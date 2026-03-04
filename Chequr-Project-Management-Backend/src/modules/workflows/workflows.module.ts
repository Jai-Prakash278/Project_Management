import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowStage } from './workflow-stage.entity';
import { WorkflowTransition } from './workflow-transition.entity';
import { WorkflowService } from './workflow.service';
import { WorkflowResolver } from './workflow.resolver';
import { WorkflowTransitionService } from './workflow-transition.service';

// ─── WorkflowsModule ──────────────────────────────────────────────────────────
// Registers all 3 workflow tables (workflows, workflow_stages, workflow_transitions)
// Provides:
//   WorkflowService           — default workflow creation (Squad 1)
//   WorkflowResolver          — getWorkflowStages, createWorkflow GQL
//   WorkflowTransitionService — transition validation engine (Squad 3)
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      WorkflowStage,
      WorkflowTransition,   // ← Squad 3: needed for validateTransition()
    ]),
  ],
  providers: [
    WorkflowService,
    WorkflowResolver,
    WorkflowTransitionService,   // ← Squad 3 engine
  ],
  exports: [
    WorkflowService,
    WorkflowTransitionService,   // ← exported so BoardModule can inject it
    TypeOrmModule,               // ← exported so repos are available to importers
  ],
})
export class WorkflowsModule { }
