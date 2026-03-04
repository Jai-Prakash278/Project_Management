import { Resolver, Mutation, Args, Query, ResolveField, Parent } from '@nestjs/graphql';
import { Workflow } from './workflow.entity';
import { WorkflowStage } from './workflow-stage.entity';
import { WorkflowService } from './workflow.service';
import { CreateWorkflowAdvancedInput } from './dto/create-workflow.input';

@Resolver(() => Workflow)
export class WorkflowResolver {
  constructor(private readonly workflowService: WorkflowService) { }

  @ResolveField(() => [WorkflowStage])
  async stages(@Parent() workflow: Workflow): Promise<WorkflowStage[]> {
    return this.workflowService.getStagesByWorkflow(workflow.id);
  }

  /*
  =====================================================
  ✅ Create Workflow (Default OR Custom)
  =====================================================
  */
  @Mutation(() => Workflow)
  async createWorkflowAdvanced(
    @Args('input') input: CreateWorkflowAdvancedInput,
  ): Promise<Workflow | null> {
    return this.workflowService.createWorkflowAdvanced(
      input.name,
      input.isDefault,
      input.stages,
      input.projectId,
      input.transitionMode,
      input.transitions,
    );
  }

  /*
  =====================================================
  ✅ Get Stages By Workflow
  =====================================================
  */
  @Query(() => [WorkflowStage])
  async getStagesByWorkflow(
    @Args('workflowId') workflowId: string,
  ): Promise<WorkflowStage[]> {
    return this.workflowService.getStagesByWorkflow(workflowId);
  }

  @Mutation(() => Boolean)
  deleteStage(
    @Args('stageId') stageId: string,
  ) {
    return this.workflowService.deleteStage(stageId);
  }

  @Mutation(() => [WorkflowStage])
  reorderStage(
    @Args('stageId') stageId: string,
    @Args('newOrderIndex') newOrderIndex: number,
  ) {
    return this.workflowService.reorderStage(stageId, newOrderIndex);
  }
}