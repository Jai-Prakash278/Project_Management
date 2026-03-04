import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Issue } from '../issues/issue.entity';
import { Workflow } from './workflow.entity';
import { WorkflowStage } from './workflow-stage.entity';
import { WorkflowTransition } from './workflow-transition.entity';

const DEFAULT_STAGES: { name: string; orderIndex: number; isFinal: boolean }[] = [
  { name: 'Todo', orderIndex: 0, isFinal: false },
  { name: 'In Progress', orderIndex: 1, isFinal: false },
  { name: 'Blocked', orderIndex: 2, isFinal: false },
  { name: 'In Review', orderIndex: 3, isFinal: false },
  { name: 'Done', orderIndex: 4, isFinal: true },
];

@Injectable()
export class WorkflowService {
  constructor(
    @InjectRepository(Workflow)
    private readonly workflowRepo: Repository<Workflow>,

    @InjectRepository(WorkflowStage)
    private readonly stageRepo: Repository<WorkflowStage>,

    private readonly dataSource: DataSource,
  ) { }

  /*
  =====================================================
  ✅ Create Default Kanban Workflow (transactional)
  Used during project creation
  =====================================================
  */
  async createDefaultWorkflow(projectId: string): Promise<Workflow | null> {
    return this.dataSource.transaction(async (manager) => {
      const workflow = manager.create(Workflow, {
        name: 'Default Kanban Workflow',
        isDefault: true,
        transitionMode: 'SEQUENTIAL',
        projectId,
      });

      const savedWorkflow = await manager.save(workflow);

      const stages = DEFAULT_STAGES.map((stage) =>
        manager.create(WorkflowStage, {
          ...stage,
          workflowId: savedWorkflow.id,
        }),
      );

      await manager.save(stages);

      return manager.findOne(Workflow, {
        where: { id: savedWorkflow.id },
        relations: ['stages'],
      });
    });
  }

  /*
  =====================================================
  ✅ NEW: Create Custom Workflow (Dynamic Stages)
  =====================================================
  */
  async createCustomWorkflow(
    name: string,
    stagesInput: { name: string; orderIndex: number; isFinal?: boolean }[],
    projectId?: string,
    transitionMode?: string,
    transitionsInput?: { fromStage: string; toStage: string; allowedRoles?: string[] }[],
  ): Promise<Workflow | null> {
    return this.dataSource.transaction(async (manager) => {
      if (!stagesInput || stagesInput.length === 0) {
        throw new Error('Custom workflow requires at least one stage');
      }

      const workflow = manager.create(Workflow, {
        name,
        isDefault: false,
        transitionMode: transitionMode || 'SEQUENTIAL',
        projectId,
      });

      const savedWorkflow = await manager.save(workflow);

      // Determine if any stage is explicitly marked as final
      const hasExplicitFinal = stagesInput.some((s) => s.isFinal === true);

      // Find the stage with the highest orderIndex to auto-mark as final if needed
      const maxOrderIndex = Math.max(...stagesInput.map((s) => s.orderIndex));

      const stages = stagesInput.map((stage) =>
        manager.create(WorkflowStage, {
          name: stage.name,
          orderIndex: stage.orderIndex,
          // ✅ If no stage is explicitly marked final, auto-mark the last stage (highest orderIndex) as final
          isFinal: stage.isFinal ?? (!hasExplicitFinal && stage.orderIndex === maxOrderIndex),
          workflowId: savedWorkflow.id,
        }),
      );

      const savedStages = await manager.save(stages);

      if (transitionMode === 'FLEXIBLE' && transitionsInput && transitionsInput.length > 0) {
        const transitionRepo = manager.getRepository(WorkflowTransition);
        const transitions = transitionsInput.map((t) => {
          const fromStage = savedStages.find((s) => s.name === t.fromStage);
          const toStage = savedStages.find((s) => s.name === t.toStage);

          if (!fromStage || !toStage) {
            throw new Error(`Invalid transition: Stages "${t.fromStage}" or "${t.toStage}" not found.`);
          }

          return transitionRepo.create({
            workflowId: savedWorkflow.id,
            fromStageId: fromStage.id,
            toStageId: toStage.id,
            allowedRoles: t.allowedRoles || [],
          });
        });
        await manager.save(transitions);
      }

      if (projectId) {
        // Update the project's workflow connection
        await manager.query(`UPDATE projects SET "workflowId" = $1 WHERE id = $2`, [savedWorkflow.id, projectId]);
      }

      return manager.findOne(Workflow, {
        where: { id: savedWorkflow.id },
        relations: ['stages'],
      });
    });
  }

  /*
  =====================================================
  ✅ NEW: Smart Workflow Creator
  If isDefault = true → uses DEFAULT_STAGES
  If false → uses custom stages
  =====================================================
  */
  async createWorkflowAdvanced(
    name: string,
    isDefault: boolean,
    stagesInput?: { name: string; orderIndex: number; isFinal?: boolean }[],
    projectId?: string,
    transitionMode?: string,
    transitionsInput?: { fromStage: string; toStage: string; allowedRoles?: string[] }[],
  ): Promise<Workflow | null> {
    if (isDefault) {
      return this.createCustomWorkflow(name, DEFAULT_STAGES, projectId);
    }

    return this.createCustomWorkflow(name, stagesInput ?? [], projectId, transitionMode, transitionsInput);
  }

  /*
  =====================================================
  ✅ Get Stages By Workflow (Ordered)
  =====================================================
  */
  async getStagesByWorkflow(workflowId: string): Promise<WorkflowStage[]> {
    return this.stageRepo.find({
      where: { workflowId },
      order: { orderIndex: 'ASC' },
    });
  }

  /*
  =====================================================
  ✅ Get First Stage (orderIndex = 0)
  Used when creating an issue
  =====================================================
  */
  async getFirstStage(workflowId: string): Promise<WorkflowStage | null> {
    return this.stageRepo.findOne({
      where: { workflowId, orderIndex: 0 },
    });
  }

  /*
  =====================================================
  ✅ Legacy: Create Workflow + Auto Seed (kept intact)
  =====================================================
  */
  async createWorkflow(name: string): Promise<Workflow | null> {
    const workflow = this.workflowRepo.create({
      name,
      isDefault: false,
      transitionMode: 'SEQUENTIAL',
    });

    const savedWorkflow = await this.workflowRepo.save(workflow);

    const stages = DEFAULT_STAGES.map((stage) =>
      this.stageRepo.create({ ...stage, workflowId: savedWorkflow.id }),
    );

    await this.stageRepo.save(stages);

    return this.workflowRepo.findOne({
      where: { id: savedWorkflow.id },
      relations: ['stages'],
    });
  }

  async deleteStage(stageId: string): Promise<boolean> {
    return this.dataSource.transaction(async (manager) => {
      const stageRepo = manager.getRepository(WorkflowStage);
      const issueRepo = manager.getRepository(Issue);

      const stage = await stageRepo.findOne({ where: { id: stageId } });
      if (!stage) {
        throw new Error('Stage not found');
      }

      // 🚫 Prevent deleting final stage
      if (stage.isFinal) {
        throw new Error('Cannot delete final stage');
      }

      // 🚫 Prevent deleting stage with issues
      const issueCount = await issueRepo.count({
        where: { stageId: stageId },
      });

      if (issueCount > 0) {
        throw new Error('Cannot delete stage with existing issues. Move issues first.');
      }

      const workflowId = stage.workflowId;
      const deletedOrderIndex = stage.orderIndex;

      // Delete stage
      await stageRepo.remove(stage);

      // Reorder remaining stages
      await stageRepo
        .createQueryBuilder()
        .update(WorkflowStage)
        .set({ orderIndex: () => `"orderIndex" - 1` })
        .where('workflowId = :workflowId', { workflowId })
        .andWhere('orderIndex > :deletedOrderIndex', { deletedOrderIndex })
        .execute();

      return true;
    });
  }

  async reorderStage(stageId: string, newOrderIndex: number): Promise<WorkflowStage[]> {
    return this.dataSource.transaction(async (manager) => {
      const stageRepo = manager.getRepository(WorkflowStage);

      const stage = await stageRepo.findOne({ where: { id: stageId } });
      if (!stage) throw new Error('Stage not found');

      const workflowId = stage.workflowId;
      const oldOrderIndex = stage.orderIndex;

      const stages = await stageRepo.find({
        where: { workflowId },
        order: { orderIndex: 'ASC' },
      });

      if (newOrderIndex < 0 || newOrderIndex >= stages.length) {
        throw new Error('Invalid order index');
      }

      if (oldOrderIndex === newOrderIndex) {
        return stages;
      }

      // Temporarily move out
      stage.orderIndex = -1;
      await stageRepo.save(stage);

      if (newOrderIndex > oldOrderIndex) {
        await stageRepo
          .createQueryBuilder()
          .update(WorkflowStage)
          .set({ orderIndex: () => `"orderIndex" - 1` })
          .where('workflowId = :workflowId', { workflowId })
          .andWhere('orderIndex > :oldOrderIndex', { oldOrderIndex })
          .andWhere('orderIndex <= :newOrderIndex', { newOrderIndex })
          .execute();
      } else {
        await stageRepo
          .createQueryBuilder()
          .update(WorkflowStage)
          .set({ orderIndex: () => `"orderIndex" + 1` })
          .where('workflowId = :workflowId', { workflowId })
          .andWhere('orderIndex >= :newOrderIndex', { newOrderIndex })
          .andWhere('orderIndex < :oldOrderIndex', { oldOrderIndex })
          .execute();
      }

      stage.orderIndex = newOrderIndex;
      await stageRepo.save(stage);

      // ✅ Return updated ordered list
      return stageRepo.find({
        where: { workflowId },
        order: { orderIndex: 'ASC' },
      });
    });
  }
}