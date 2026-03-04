import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  LessThan,
} from 'typeorm';
import { validate as isUUID } from 'uuid';

import { Sprint } from './sprint.entity';
import { Project } from '../projects/project.entity';
import { Issue } from '../issues/issue.entity';
import { WorkflowStage } from '../workflows/workflow-stage.entity';

import { createSprintInput } from './dto/create-sprint.input';
import { updateSprintInput } from './dto/update-sprint.input';
import { startSprintInput } from './dto/start-sprint.input';

import { sprintStatus } from '../../common/enums/sprint-status.enum';

@Injectable()
export class SprintService {
  constructor(
    @InjectRepository(Sprint)
    private readonly sprintRepo: Repository<Sprint>,

    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(Issue)
    private readonly issueRepo: Repository<Issue>,

    @InjectRepository(WorkflowStage)
    private readonly stageRepo: Repository<WorkflowStage>,

    private readonly dataSource: DataSource,
  ) { }

  // ===============================
  // CREATE SPRINT
  // ===============================
  async createSprint(input: createSprintInput): Promise<Sprint> {
    const project = await this.projectRepo.findOne({
      where: { id: input.projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    const sprint = this.sprintRepo.create({
      name: input.name,
      project,
      status: sprintStatus.PLANNED,
      startDate: input.startDate,
      endDate: input.endDate,
    });

    return this.sprintRepo.save(sprint);
  }

  // ===============================
  // START SPRINT
  // ===============================
  async startSprint(input: startSprintInput): Promise<Sprint> {
    const { sprintId, startDate, endDate, goal } = input;

    const sprint = await this.sprintRepo.findOne({
      where: { id: sprintId },
      relations: ['project'],
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (sprint.status !== sprintStatus.PLANNED) {
      throw new BadRequestException(
        'Only PLANNED sprints can be started',
      );
    }

    if (startDate >= endDate) {
      throw new BadRequestException(
        'End date must be after start date',
      );
    }

    // Ensure only one ACTIVE sprint per project
    const activeSprint = await this.sprintRepo.findOne({
      where: {
        project: { id: sprint.project.id },
        status: sprintStatus.ACTIVE,
      },
    });

    if (activeSprint) {
      throw new BadRequestException(
        'Another sprint is already active for this project',
      );
    }

    // Rule 1: Sprint must have at least one issue
    const issueCount = await this.issueRepo.count({
      where: {
        sprint: { id: sprint.id },
      },
    });

    if (issueCount === 0) {
      throw new BadRequestException(
        'Sprint cannot be started without issues',
      );
    }

    sprint.startDate = startDate;
    sprint.endDate = endDate;
    sprint.goal = goal;
    sprint.status = sprintStatus.ACTIVE;

    return this.sprintRepo.save(sprint);
  }
  // ===============================
  // COMPLETE SPRINT (Manual)
  // ===============================
  async completeSprint(sprintId: string): Promise<Sprint> {
    return this.dataSource.transaction(async (manager) => {

      const sprint = await manager.findOne(Sprint, {
        where: { id: sprintId },
        relations: ['project'],
      });

      if (!sprint) {
        throw new NotFoundException('Sprint not found');
      }

      if (sprint.status !== sprintStatus.ACTIVE) {
        throw new BadRequestException(
          'Only ACTIVE sprint can be completed',
        );
      }

      // 🔥 Robust Done stage detection
      const allStages = await manager.find(WorkflowStage, {
        where: { workflowId: sprint.project.workflowId },
        order: { orderIndex: 'ASC' },
      });

      // A stage is considers "Done" if:
      // 1. It is explicitly marked as isFinal
      // 2. OR its name contains "done", "complete", "closed", or "finish"
      // 3. Fallback: If nothing matches, the stage with the highest orderIndex is considered Done
      let doneStages = allStages.filter(s =>
        s.isFinal ||
        ['done', 'complete', 'closed', 'finish'].some(k => s.name.toLowerCase().includes(k))
      );

      if (doneStages.length === 0 && allStages.length > 0) {
        doneStages = [allStages[allStages.length - 1]]; // Last stage
      }

      const doneStageIds = doneStages.map((s) => s.id);

      const sprintIssues = await manager.find(Issue, {
        where: { sprint: { id: sprintId } },
      });

      for (const issue of sprintIssues) {
        const isInDoneStage = doneStageIds.includes(issue.stageId);

        if (!isInDoneStage) {
          issue.sprint = null;
          await manager.save(issue);
        }
      }

      sprint.status = sprintStatus.COMPLETED;

      return manager.save(sprint);
    });
  }

  // ===============================
  // AUTO COMPLETE (All issues DONE)
  // ===============================
  async checkAndAutoCompleteSprint(sprintId: string): Promise<void> {
    const sprint = await this.sprintRepo.findOne({
      where: { id: sprintId },
      relations: ['project'],
    });

    if (!sprint) return;

    // Find all final (Done) stage IDs for this project's workflow
    const allStages = await this.stageRepo.find({
      where: { workflowId: sprint.project.workflowId },
      order: { orderIndex: 'ASC' },
    });

    let doneStages = allStages.filter(s =>
      s.isFinal ||
      ['done', 'complete', 'closed', 'finish'].some(k => s.name.toLowerCase().includes(k))
    );

    if (doneStages.length === 0 && allStages.length > 0) {
      doneStages = [allStages[allStages.length - 1]];
    }

    const doneStageIds = doneStages.map((s) => s.id);

    // Count issues NOT in a final stage
    const allSprintIssues = await this.issueRepo.find({
      where: { sprint: { id: sprintId } },
    });

    const remainingIssues = allSprintIssues.filter(
      (issue) => !doneStageIds.includes(issue.stageId),
    ).length;

    if (remainingIssues === 0 && sprint.status === sprintStatus.ACTIVE) {
      sprint.status = sprintStatus.COMPLETED;
      await this.sprintRepo.save(sprint);
    }
  }

  // ===============================
  // CLOSE EXPIRED SPRINTS
  // ===============================
  async closeExpiredSprints(): Promise<boolean> {
    const now = new Date();

    const expiredSprints = await this.sprintRepo.find({
      where: {
        status: sprintStatus.ACTIVE,
        endDate: LessThan(now),
      },
      relations: ['issues', 'project'],
    });

    for (const sprint of expiredSprints) {
      // Find final stage IDs for this project's workflow
      const allStages = await this.stageRepo.find({
        where: { workflowId: sprint.project.workflowId },
        order: { orderIndex: 'ASC' },
      });

      let doneStages = allStages.filter(s =>
        s.isFinal ||
        ['done', 'complete', 'closed', 'finish'].some(k => s.name.toLowerCase().includes(k))
      );

      if (doneStages.length === 0 && allStages.length > 0) {
        doneStages = [allStages[allStages.length - 1]];
      }

      const doneStageIds = doneStages.map((s) => s.id);

      for (const issue of sprint.issues) {
        const isInFinalStage = doneStageIds.includes(issue.stageId);
        if (!isInFinalStage) {
          issue.sprint = null;
          await this.issueRepo.save(issue);
        }
      }

      sprint.status = sprintStatus.COMPLETED;
      await this.sprintRepo.save(sprint);
    }

    return true;
  }

  // ===============================
  // GET SPRINTS BY PROJECT
  // ===============================
  async getSprintsByProject(projectId: string): Promise<Sprint[]> {
    if (!isUUID(projectId)) {
      throw new BadRequestException(
        'Invalid project ID format',
      );
    }

    const project = await this.projectRepo.findOne({
      where: { id: projectId },
    });

    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return this.sprintRepo.find({
      where: {
        project: { id: projectId },
      },
      relations: ['project', 'issues', 'issues.assignee', 'issues.project'],
      order: { createdAt: 'DESC' },
    });
  }

  // ===============================
  // UPDATE SPRINT (PLANNED OR ACTIVE)
  // ===============================
  async updateSprint(input: updateSprintInput): Promise<Sprint> {
    const { sprintId, goal, endDate, name, startDate } = input;

    const sprint = await this.sprintRepo.findOne({
      where: { id: sprintId },
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    // Allow editing if PLANNED or ACTIVE
    if (
      sprint.status !== sprintStatus.ACTIVE &&
      sprint.status !== sprintStatus.PLANNED
    ) {
      throw new BadRequestException(
        'Only PLANNED or ACTIVE sprints can be edited',
      );
    }

    // Date validation
    const newStartDate = startDate || sprint.startDate;
    const newEndDate = endDate || sprint.endDate;

    if (newEndDate && newStartDate && newEndDate <= newStartDate) {
      throw new BadRequestException('End date must be after start date');
    }

    if (goal !== undefined) sprint.goal = goal;
    if (name !== undefined) sprint.name = name;
    if (startDate !== undefined) sprint.startDate = startDate;
    if (endDate !== undefined) sprint.endDate = endDate;

    return this.sprintRepo.save(sprint);
  }

  // ===============================
  // DELETE SPRINT
  // ===============================
  async deleteSprint(sprintId: string): Promise<boolean> {
    const sprint = await this.sprintRepo.findOne({
      where: { id: sprintId },
      relations: ['issues'],
    });

    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    // Unlink issues from sprint (move to backlog — sprint is being deleted)
    if (sprint.issues && sprint.issues.length > 0) {
      for (const issue of sprint.issues) {
        issue.sprint = null;
        await this.issueRepo.save(issue);
      }
    }

    await this.sprintRepo.remove(sprint);
    return true;
  }
}