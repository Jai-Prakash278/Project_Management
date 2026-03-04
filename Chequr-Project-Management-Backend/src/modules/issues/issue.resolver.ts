import { Args, ID, Mutation, Resolver, Query, ResolveField, Parent } from "@nestjs/graphql";
import { Issue, Subtask } from "./issue.entity";
import { WorkflowStage } from "../workflows/workflow-stage.entity";
import { Sprint } from "../sprints/sprint.entity";
import { IssueService } from "./issue.service";
import { UseGuards } from "@nestjs/common";
import { IssuePermissionGuard } from "src/common/guards/issue-permission.guard";
import { CreateIssueInput } from "./dto/create-issue.input";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { User } from "../users/user.entity";
import { JwtAuthGuard } from "src/common/guards/jwt-auth.guard";
import { UpdateIssueInput } from "./dto/update-issue.input";
import { AssignIssueInput } from "./dto/assign-issue.input";


@Resolver(() => Issue)
export class IssueResolver {
    constructor(private readonly issueService: IssueService) { }

    // Mutations 
    @Mutation(() => Issue)
    @UseGuards(JwtAuthGuard, IssuePermissionGuard)
    createIssue(
        @Args('input') input: CreateIssueInput,
        @CurrentUser() user: User,
    ) {
        return this.issueService.createIssue(input, user)
    }

    @Mutation(() => Issue)
    @UseGuards(JwtAuthGuard, IssuePermissionGuard)
    updateIssue(
        @Args('input') input: UpdateIssueInput,
        @CurrentUser() user: User,
    ) {
        return this.issueService.updateIssue(input, user)
    }

    @Mutation(() => Issue)
    @UseGuards(JwtAuthGuard, IssuePermissionGuard)
    assignIssue(
        @Args('input') input: AssignIssueInput,
        @CurrentUser() user: User,
    ) {
        return this.issueService.assignIssue(input, user)
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard, IssuePermissionGuard)
    deleteIssue(
        @Args('id', { type: () => ID }) id: string,
        @CurrentUser() user: User,
    ) {
        return this.issueService.deleteIssue(id, user);
    }

    // Subtask Mutations
    @Mutation(() => Subtask)
    @UseGuards(JwtAuthGuard)
    addSubtask(
        @Args('issueId', { type: () => ID }) issueId: string,
        @Args('title') title: string,
    ) {
        return this.issueService.addSubtask(issueId, title);
    }

    @Mutation(() => Subtask)
    @UseGuards(JwtAuthGuard)
    toggleSubtask(
        @Args('subtaskId', { type: () => ID }) subtaskId: string,
    ) {
        return this.issueService.toggleSubtask(subtaskId);
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    deleteSubtask(
        @Args('subtaskId', { type: () => ID }) subtaskId: string,
    ) {
        return this.issueService.deleteSubtask(subtaskId);
    }

    // Queries
    @Query(() => Issue)
    @UseGuards(JwtAuthGuard, IssuePermissionGuard)
    getIssueById(
        @Args('id', { type: () => ID }) id: string,
    ) {
        return this.issueService.getIssueById(id)
    }

    @Query(() => [Issue])
    @UseGuards(JwtAuthGuard, IssuePermissionGuard)
    getIssuesByProject(
        @Args('projectId', { type: () => ID }) projectId: string,
    ) {
        return this.issueService.getIssuesByProject(projectId);
    }

    @Query(() => [Issue])
    @UseGuards(JwtAuthGuard, IssuePermissionGuard)
    getBoardIssues(
        @Args('projectId', { type: () => ID }) projectId: string,
        @Args('sprintId', { type: () => String, nullable: true }) sprintId?: string,
    ) {
        return this.issueService.getBoardIssues(projectId, sprintId);
    }


    @Query(() => [Issue])
    @UseGuards(JwtAuthGuard)
    getMyIssues(
        @CurrentUser() user: User,
        @Args('filter', { type: () => String, nullable: true }) filter?: string,
    ) {
        return this.issueService.getMyIssues(user.id, filter);
    }

    // Field Resolvers
    @ResolveField(() => WorkflowStage, { nullable: true })
    async stage(@Parent() issue: Issue) {
        if (issue.stage) return issue.stage;
        if (!issue.stageId) return null;
        return this.issueService.getStageForIssue(issue.stageId);
    }

    @ResolveField(() => Sprint, { nullable: true })
    async sprint(@Parent() issue: Issue) {
        if (issue.sprint !== undefined) return issue.sprint; // null or object
        if (!issue.sprintId) return null;
        return this.issueService.getSprintForIssue(issue.sprintId);
    }
}