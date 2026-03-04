import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Issue } from '../issues/issue.entity';
import { MoveIssueInput } from './dto/move-issue.input';
import { sprintStatus } from '../../common/enums/sprint-status.enum';
import { WorkflowTransitionService } from '../workflows/workflow-transition.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class BoardService {
    private readonly logger = new Logger(BoardService.name);

    constructor(
        @InjectRepository(Issue)
        private readonly issueRepo: Repository<Issue>,

        // Squad 3: transition validation engine
        private readonly workflowTransitionService: WorkflowTransitionService,

        // Needed to load user roles from DB for role-based transition checks
        private readonly usersService: UsersService,
    ) { }

    /*
    =====================================================
    ✅ DYNAMIC BOARD DATA
    Returns workflow stages + issues grouped per stage
    =====================================================
    */
    async getBoardData(
        projectId: string,
        sprintId?: string,
        assigneeId?: string,
    ) {
        // Build issue filter
        const whereCondition: any = {
            project: { id: projectId },
        };

        if (assigneeId) {
            whereCondition.assignee = { id: assigneeId };
        }

        if (sprintId === 'all') {
            // No sprint filter
        } else if (sprintId && sprintId !== 'null' && sprintId !== 'undefined') {
            whereCondition.sprint = { id: sprintId };
        } else {
            // Default: active sprint only
            whereCondition.sprint = { status: sprintStatus.ACTIVE };
        }

        // Get workflow for this project (falls back to default workflow)
        const workflow = await this.workflowTransitionService.getWorkflowForProject(projectId);
        if (!workflow) {
            throw new Error(`No workflow found for project ${projectId}`);
        }

        // Get stages ordered by position
        const stages = await this.workflowTransitionService.getStagesForWorkflow(workflow.id);

        // Get all matching issues
        const issues = await this.issueRepo.find({
            where: whereCondition,
            relations: ['assignee', 'sprint', 'parent', 'subtaskList', 'stage'],
            order: { boardOrder: 'ASC' },
        });

        // Group issues into their stage columns
        const board = stages.map((stage) => ({
            id: stage.id,
            name: stage.name,
            orderIndex: stage.orderIndex,
            issues: issues.filter((issue) => issue.stageId === stage.id),
        }));

        return board;
    }

    /*
    =====================================================
    ✅ MOVE ISSUE BETWEEN STAGES (Squad 3 Validation)
    Runs the full transition validation engine before saving.
    =====================================================
    */
    async moveIssueStage(userId: string, input: MoveIssueInput) {
        this.logger.log(
            `moveIssueStage called | user=${userId} | issue=${input.issueId} → stage=${input.stageId}`,
        );

        // 1. Load the issue
        const issue = await this.issueRepo.findOne({
            where: { id: input.issueId },
            relations: ['project', 'sprint'],
        });

        if (!issue) {
            this.logger.error(`Issue not found: ${input.issueId}`);
            throw new Error('Issue not found');
        }

        // 2. Load the user's roles (needed for role-based validation in FLEXIBLE mode)
        const fullUser = await this.usersService.findById(userId);
        const userRoles = fullUser?.roles?.map((ur) => ur.role?.key).filter(Boolean) ?? [];

        this.logger.debug(`User roles: [${userRoles.join(', ')}]`);

        // 3. Run Squad 3 transition validation engine
        //    - Loads fromStage (issue.stageId) and toStage (input.stageId)
        //    - Checks they belong to the same workflow
        //    - SEQUENTIAL: enforces ±1 orderIndex rule
        //    - FLEXIBLE: checks workflow_transitions table + role access
        //    Throws ForbiddenException or BadRequestException on failure.
        if (issue.stageId) {
            // Only validate if issue already has a stage (skip for first assignment)
            await this.workflowTransitionService.validateTransition(
                userId,
                userRoles,
                issue.stageId,    // current stage (fromStageId)
                input.stageId,    // target stage  (toStageId)
            );
        }

        // 4. Validation passed — update stage
        issue.stageId = input.stageId;

        if (input.position !== undefined) {
            issue.boardOrder = input.position;
        }

        const saved = await this.issueRepo.save(issue);
        this.logger.log(`Issue ${saved.id} moved to stage ${input.stageId} ✔`);
        return saved;
    }

    /*
    =====================================================
    ✅ MY ASSIGNED ISSUES (UNCHANGED)
    =====================================================
    */
    async getMyAssignedIssues(userId: string) {
        return this.issueRepo.find({
            where: { assignee: { id: userId } },
            relations: ['project', 'sprint', 'parent', 'stage'],
            order: { updatedAt: 'DESC' },
        });
    }
}