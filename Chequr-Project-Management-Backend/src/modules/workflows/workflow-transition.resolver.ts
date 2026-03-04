import { Resolver, Query, Args, ID } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { WorkflowTransitionService } from './workflow-transition.service';
import { WorkflowStage } from './workflow-stage.entity';
import { WorkflowTransition } from './workflow-transition.entity';
import { Workflow } from './workflow.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

// ─── WorkflowTransitionResolver ───────────────────────────────────────────────
//
// Squad 3 – GraphQL query layer for the transition engine.
//
// Exposed queries:
//   getWorkflowStages(workflowId)      → ordered stage list for a workflow
//   getWorkflowTransitions(workflowId) → all defined transition rules (FLEXIBLE mode)
//   getWorkflowForProject(projectId)   → resolves project → workflow
//
// All queries are behind JwtAuthGuard — authenticated users only.
@Resolver()
export class WorkflowTransitionResolver {
    constructor(
        private readonly workflowTransitionService: WorkflowTransitionService,
    ) { }

    // ── getWorkflowStages ─────────────────────────────────────────────────────
    // Returns all stages for a workflow, ordered by orderIndex ASC.
    // Squad 2 consumes this to render dynamic Kanban columns.
    // Squad 4 consumes this to populate the stage dropdowns in
    // the workflow transition builder UI.
    //
    // Example query:
    //   query { getWorkflowStages(workflowId: "uuid") { id name orderIndex isFinal } }
    @Query(() => [WorkflowStage], {
        name: 'getWorkflowStages',
        description: 'Get all stages for a workflow ordered by position',
    })
    @UseGuards(JwtAuthGuard)
    async getWorkflowStages(
        @Args('workflowId', { type: () => ID }) workflowId: string,
    ): Promise<WorkflowStage[]> {
        return this.workflowTransitionService.getStagesForWorkflow(workflowId);
    }

    // ── getWorkflowTransitions ────────────────────────────────────────────────
    // Returns all defined FLEXIBLE transition rules for a workflow.
    // Squad 4 uses these to render the Transition Matrix grid  (From \ To table).
    // Frontend can determine which cells are allowed and which roles are needed.
    //
    // Example query:
    //   query {
    //     getWorkflowTransitions(workflowId: "uuid") {
    //       id fromStage { name } toStage { name } allowedRoles
    //     }
    //   }
    @Query(() => [WorkflowTransition], {
        name: 'getWorkflowTransitions',
        description:
            'Get all defined transition rules for a FLEXIBLE workflow (used for the transition matrix UI)',
    })
    @UseGuards(JwtAuthGuard)
    async getWorkflowTransitions(
        @Args('workflowId', { type: () => ID }) workflowId: string,
    ): Promise<WorkflowTransition[]> {
        return this.workflowTransitionService.getTransitionsForWorkflow(
            workflowId,
        );
    }

    // ── getWorkflowForProject ─────────────────────────────────────────────────
    // Resolves a project to its associated Workflow (project-specific first,
    // falls back to the global default workflow if none is assigned).
    // Squad 4 calls this when rendering the project board to know which
    // stages and transition rules to use.
    //
    // Example query:
    //   query {
    //     getWorkflowForProject(projectId: "uuid") {
    //       id name transitionMode
    //       stages { id name orderIndex }
    //     }
    //   }
    @Query(() => Workflow, {
        name: 'getWorkflowForProject',
        nullable: true,
        description:
            'Get the workflow associated with a project (falls back to default workflow)',
    })
    @UseGuards(JwtAuthGuard)
    async getWorkflowForProject(
        @Args('projectId', { type: () => ID }) projectId: string,
    ): Promise<Workflow | null> {
        return this.workflowTransitionService.getWorkflowForProject(projectId);
    }
}
