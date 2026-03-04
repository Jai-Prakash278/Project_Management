import {
    Injectable,
    Logger,
    ForbiddenException,
    BadRequestException,
    NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WorkflowTransition } from './workflow-transition.entity';
import { WorkflowStage } from './workflow-stage.entity';
import { Workflow } from './workflow.entity';

// TransitionMode values as string constants (enum was removed from workflow.entity.ts post-merge)
const TransitionMode = {
    SEQUENTIAL: 'SEQUENTIAL',
    FLEXIBLE: 'FLEXIBLE',
} as const;

// ─── WorkflowTransitionService ────────────────────────────────────────────────
//
// Squad 3 owns this service.  It is the single source of truth for ALL
// transition validation logic in the workflow engine.
//
// Public API used by BoardService:
//   validateTransition()         → main guard called before every stage move
//   getStagesForWorkflow()       → ordered stage list (used by getBoardData)
//   getTransitionsForWorkflow()  → all defined transitions (used by UI matrix)
//   getWorkflowForProject()      → resolves project → workflow
//
@Injectable()
export class WorkflowTransitionService {
    private readonly logger = new Logger(WorkflowTransitionService.name);

    constructor(
        // Row for each allowed FLEXIBLE transition
        @InjectRepository(WorkflowTransition)
        private readonly transitionRepo: Repository<WorkflowTransition>,

        // All stages; we read orderIndex for sequential validation
        @InjectRepository(WorkflowStage)
        private readonly stageRepo: Repository<WorkflowStage>,

        // Workflow header; we read transitionMode to pick validation path
        @InjectRepository(Workflow)
        private readonly workflowRepo: Repository<Workflow>,
    ) { }

    // =========================================================================
    // PUBLIC: validateTransition
    // =========================================================================
    // Called by board.service.ts BEFORE updating issue.stageId.
    //
    // Parameters:
    //   userId      — from JWT, used only for debug logging
    //   userRoles   — e.g. ['DEVELOPER', 'QA']
    //   fromStageId — UUID of issue's current stage
    //   toStageId   — UUID of the target stage
    //
    // Throws:
    //   NotFoundException     — stage or workflow not found in DB
    //   BadRequestException   — cross-workflow move OR sequential skip
    //   ForbiddenException    — role not permitted for this transition
    //
    // Returns void on success.
    async validateTransition(
        userId: string,
        userRoles: string[],
        fromStageId: string,
        toStageId: string,
    ): Promise<void> {
        this.logger.log(
            `[Squad3] Validating transition | user=${userId} | ${fromStageId} → ${toStageId}`,
        );

        // ── 1. Load both stages ───────────────────────────────────────────────
        const [fromStage, toStage] = await Promise.all([
            this.stageRepo.findOne({ where: { id: fromStageId } }),
            this.stageRepo.findOne({ where: { id: toStageId } }),
        ]);

        if (!fromStage) {
            throw new NotFoundException(
                `Source stage not found: ${fromStageId}`,
            );
        }
        if (!toStage) {
            throw new NotFoundException(
                `Destination stage not found: ${toStageId}`,
            );
        }

        // ── 2. Verify both stages belong to the same workflow ─────────────────
        // You cannot drag an issue across workflows — that would break ordering.
        if (fromStage.workflowId !== toStage.workflowId) {
            throw new BadRequestException(
                `Cross-workflow transition is not allowed. ` +
                `"${fromStage.name}" and "${toStage.name}" belong to different workflows.`,
            );
        }

        // ── 3. Load the workflow to determine validation mode ─────────────────
        const workflow = await this.workflowRepo.findOne({
            where: { id: fromStage.workflowId },
        });

        if (!workflow) {
            throw new NotFoundException(
                `Workflow not found: ${fromStage.workflowId}`,
            );
        }

        this.logger.debug(
            `[Squad3] Workflow "${workflow.name}" | mode=${workflow.transitionMode}`,
        );

        // ── 4. Branch on transitionMode ───────────────────────────────────────
        if (workflow.transitionMode === TransitionMode.SEQUENTIAL) {
            // SEQUENTIAL: strict ±1 rule, no role restrictions
            this.validateSequentialTransition(fromStage, toStage);
        } else {
            // FLEXIBLE: lookup defined transition row THEN check role
            const transition = await this.validateFlexibleTransition(
                workflow.id,
                fromStageId,
                toStageId,
            );
            this.validateRoleBasedAccess(userRoles, transition.allowedRoles);
        }

        this.logger.log(`[Squad3] Transition APPROVED ✔`);
    }

    // =========================================================================
    // PRIVATE: validateSequentialTransition
    // =========================================================================
    // Strict step-by-step rule.
    //
    // Calculation: | toStage.orderIndex - fromStage.orderIndex | must === 1
    //
    // Valid:   Todo(0) → InProgress(1)  diff=1 ✅
    //          InProgress(1) → Todo(0)  diff=1 ✅
    // Invalid: Todo(0) → InReview(2)    diff=2 ❌  (skip)
    //          Todo(0) → Done(4)        diff=4 ❌  (skip)
    private validateSequentialTransition(
        fromStage: WorkflowStage,
        toStage: WorkflowStage,
    ): void {
        const diff = Math.abs(toStage.orderIndex - fromStage.orderIndex);

        this.logger.debug(
            `[Squad3][Sequential] from="${fromStage.name}"(${fromStage.orderIndex}) ` +
            `to="${toStage.name}"(${toStage.orderIndex}) | diff=${diff}`,
        );

        if (diff !== 1) {
            throw new BadRequestException(
                `Sequential workflow violation: cannot skip stages. ` +
                `"${fromStage.name}" → "${toStage.name}" ` +
                `(positions ${fromStage.orderIndex} → ${toStage.orderIndex}, diff=${diff}). ` +
                `You may only move one step at a time.`,
            );
        }
    }

    // =========================================================================
    // PRIVATE: validateFlexibleTransition
    // =========================================================================
    // Looks up the workflow_transitions table for an explicit rule that permits
    // this exact fromStageId → toStageId pair within the given workflow.
    //
    // Returns the matched WorkflowTransition so the caller can read allowedRoles.
    // Throws BadRequestException if no matching rule exists.
    private async validateFlexibleTransition(
        workflowId: string,
        fromStageId: string,
        toStageId: string,
    ): Promise<WorkflowTransition> {
        this.logger.debug(
            `[Squad3][Flexible] Looking up transition rule: ${fromStageId} → ${toStageId} in workflow ${workflowId}`,
        );

        const transition = await this.transitionRepo.findOne({
            where: { workflowId, fromStageId, toStageId },
        });

        if (!transition) {
            throw new BadRequestException(
                `Transition not permitted in this workflow. ` +
                `No rule defined for stage "${fromStageId}" → "${toStageId}". ` +
                `Ask your Project Manager to add this transition in the workflow settings.`,
            );
        }

        return transition;
    }

    // =========================================================================
    // PRIVATE: validateRoleBasedAccess
    // =========================================================================
    // Checks if the user holds at least one role from the transition's allowedRoles.
    //
    // Edge cases:
    //   - allowedRoles is empty  → no restriction, all roles pass
    //   - TypeORM simple-array stores '' for empty, so we clean it first
    //
    // Throws ForbiddenException if user has no permitted role.
    private validateRoleBasedAccess(
        userRoles: string[],
        allowedRoles: string[],
    ): void {
        // simple-array saves empty array as ['']. Strip those out.
        const permitted = allowedRoles.filter((r) => r.trim() !== '');

        this.logger.debug(
            `[Squad3][Role] user=[${userRoles.join(', ')}] | permitted=[${permitted.join(', ')}]`,
        );

        // Empty permitted list = open transition (no role restriction)
        if (permitted.length === 0) {
            this.logger.debug('[Squad3][Role] No role restriction → ALLOW');
            return;
        }

        // At least one of the user's roles must appear in the permitted list (case-insensitive)
        const normalizedPermitted = permitted.map((r) => r.toUpperCase());
        const hasAccess = userRoles.some((role) => normalizedPermitted.includes(role.toUpperCase()));

        if (!hasAccess) {
            throw new ForbiddenException(
                `Your role is not authorized to perform this transition. ` +
                `Your roles: [${userRoles.join(', ')}]. ` +
                `Permitted roles: [${permitted.join(', ')}].`,
            );
        }

        this.logger.debug('[Squad3][Role] Role check passed ✔');
    }

    // =========================================================================
    // PUBLIC HELPERS — used by the resolver and board service
    // =========================================================================

    // Returns all stages for a workflow, sorted by orderIndex ASC.
    // Squad 2 uses this to render dynamic Kanban columns.
    async getStagesForWorkflow(workflowId: string): Promise<WorkflowStage[]> {
        this.logger.debug(`[Squad3] getStagesForWorkflow: ${workflowId}`);
        return this.stageRepo.find({
            where: { workflowId },
            order: { orderIndex: 'ASC' },
        });
    }

    // Returns all defined transition rules for a workflow.
    // Used by Squad 4's Transition Matrix UI to show "From \ To" grid.
    async getTransitionsForWorkflow(
        workflowId: string,
    ): Promise<WorkflowTransition[]> {
        this.logger.debug(`[Squad3] getTransitionsForWorkflow: ${workflowId}`);
        return this.transitionRepo.find({
            where: { workflowId },
            // fromStage and toStage are eager-loaded on the entity,
            // but we also load them explicitly for safety
            relations: ['fromStage', 'toStage'],
        });
    }

    // Resolves a projectId to its associated Workflow.
    // Used by squad 4 when a user opens a project to determine which
    // workflow drives its board.
    async getWorkflowForProject(projectId: string): Promise<Workflow | null> {
        this.logger.debug(`[Squad3] getWorkflowForProject: ${projectId}`);

        // Try project-specific workflow first
        const projectWorkflow = await this.workflowRepo.findOne({
            where: { projectId },
            relations: ['stages'],
        });

        if (projectWorkflow) return projectWorkflow;

        // Fall back to the global default workflow
        const defaultWorkflow = await this.workflowRepo.findOne({
            where: { isDefault: true },
            relations: ['stages'],
        });

        return defaultWorkflow ?? null;
    }
}
