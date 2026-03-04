import { Resolver, Query, Mutation, Args, Context, ID, ResolveField, Parent } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ProjectAccessGuard } from '../../common/guards/project-access.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProjectsService } from './projects.service';
import { Project } from './project.entity';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { AssignUsersInput } from './dto/assign-users.input';
import { WorkflowStage } from '../workflows/workflow-stage.entity';
import { WorkflowTransition } from '../workflows/workflow-transition.entity';
import { WorkflowTransitionService } from '../workflows/workflow-transition.service';
import { User } from '../users/user.entity';

@Resolver(() => Project)
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProjectsResolver {
    constructor(
        private readonly projectsService: ProjectsService,
        private readonly workflowTransitionService: WorkflowTransitionService,
    ) { }

    @ResolveField(() => [WorkflowStage], { nullable: 'items' })
    async stages(@Parent() project: Project) {
        if (!project.workflowId) return [];
        return this.workflowTransitionService.getStagesForWorkflow(project.workflowId);
    }

    @ResolveField(() => [WorkflowTransition], { nullable: 'items' })
    async transitions(@Parent() project: Project) {
        if (!project.workflowId) return [];
        return this.workflowTransitionService.getTransitionsForWorkflow(project.workflowId);
    }
    @Mutation(() => Project)
    @UseGuards(ProjectAccessGuard)
    createProject(
        @Args('createProjectInput') createProjectInput: CreateProjectInput,
        @Context() context,
    ) {
        return this.projectsService.create(createProjectInput, context.req.user);
    }

    @Query(() => Boolean)
    async isProjectKeyAvailable(
        @Args('key') key: string,
        @Context() context,
    ) {
        return this.projectsService.isProjectKeyAvailable(key, context.req.user.organizationId);
    }

    @Query(() => [Project], { name: 'projects' })
    async findAll(@Context() context): Promise<Project[]> {
        return this.projectsService.findAll(context.req.user);
    }

    @Query(() => Project, { name: 'project' })
    findOne(@Args('id') id: string) {
        return this.projectsService.findOne(id);
    }

    @Mutation(() => Project)
    @UseGuards(ProjectAccessGuard)
    updateProject(@Args('updateProjectInput') updateProjectInput: UpdateProjectInput) {
        return this.projectsService.update(updateProjectInput.id, updateProjectInput);
    }

    @Mutation(() => Project)
    @UseGuards(ProjectAccessGuard)
    archiveProject(@Args('id') id: string) {
        return this.projectsService.archive(id);
    }

    @Mutation(() => Project)
    @UseGuards(ProjectAccessGuard)
    unarchiveProject(@Args('id') id: string) {
        return this.projectsService.unarchive(id);
    }

    @Mutation(() => Project)
    @UseGuards(ProjectAccessGuard)
    assignUsersToProject(@Args('assignUsersInput') assignUsersInput: AssignUsersInput) {
        return this.projectsService.setMembers(assignUsersInput.projectId, assignUsersInput.userIds);
    }

    @Mutation(() => Project)
    @UseGuards(ProjectAccessGuard)
    assignUserToProject(
        @Args('projectId', { type: () => ID }) projectId: string,
        @Args('userId', { type: () => ID }) userId: string,
    ) {
        return this.projectsService.addMember(projectId, userId);
    }

    @Mutation(() => Boolean)
    @UseGuards(ProjectAccessGuard)
    deleteProject(@Args('id', { type: () => ID }) id: string) {
        return this.projectsService.remove(id);
    }
}