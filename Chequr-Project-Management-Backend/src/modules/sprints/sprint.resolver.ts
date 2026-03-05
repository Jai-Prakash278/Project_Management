import { Resolver, Mutation, Args } from '@nestjs/graphql';
import { Sprint } from './sprint.entity';
import { SprintService } from './sprint.service';
import { createSprintInput } from './dto/create-sprint.input';
import { updateSprintInput } from './dto/update-sprint.input';

import { Query } from '@nestjs/graphql';
import { startSprintInput } from './dto/start-sprint.input';

import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Resolver(() => Sprint)
@UseGuards(JwtAuthGuard)
export class SprintResolver {
  constructor(private readonly sprintService: SprintService) { }

  @Mutation(() => Sprint)
  createSprint(
    @Args('input') input: createSprintInput,
  ): Promise<Sprint> {
    return this.sprintService.createSprint(input);
  }

  @Mutation(() => Sprint)
  completeSprint(
    @Args('sprintId') sprintId: string,
  ): Promise<Sprint> {
    return this.sprintService.completeSprint(sprintId);
  }

  @Mutation(() => Boolean)
  checkExpiredSprints() {
    return this.sprintService.closeExpiredSprints();
  }

  @Mutation(() => Sprint)
  updateSprint(
    @Args('input') input: updateSprintInput,
  ) {
    return this.sprintService.updateSprint(input);
  }

  @Mutation(() => Sprint)
  startSprint(
    @Args('input') input: startSprintInput,
  ) {
    return this.sprintService.startSprint(input);
  }

  @Mutation(() => Boolean)
  deleteSprint(
    @Args('sprintId') sprintId: string,
  ): Promise<boolean> {
    return this.sprintService.deleteSprint(sprintId);
  }

  @Query(() => [Sprint])
  getSprintsByProject(
    @Args('projectId') projectId: string,
  ): Promise<Sprint[]> {
    return this.sprintService.getSprintsByProject(projectId);
  }

}
