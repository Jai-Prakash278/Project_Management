import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { BoardService } from './board.service';
import { MoveIssueInput } from './dto/move-issue.input';
import { Issue } from '../issues/issue.entity';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { BoardStage } from './dto/board-stage.type';

@Resolver()
export class BoardResolver {
  constructor(private readonly boardService: BoardService) {}

  /*
  =====================================================
  ✅ DYNAMIC BOARD QUERY (Squad 2)
  Returns stages with grouped issues
  =====================================================
  */
  @Query(() => [BoardStage], { name: 'getBoardIssues' })
  @UseGuards(JwtAuthGuard)
  async getBoardIssues(
    @Args('projectId') projectId: string,
    @Args('sprintId', { nullable: true }) sprintId: string,
    @Args('assigneeId', { nullable: true }) assigneeId: string,
  ) {
    return this.boardService.getBoardData(
      projectId,
      sprintId,
      assigneeId,
    );
  }

  /*
  =====================================================
  ✅ MOVE ISSUE BETWEEN STAGES
  =====================================================
  */
  @Mutation(() => Issue)
  @UseGuards(JwtAuthGuard)
  async moveIssue(
    @Args('input') input: MoveIssueInput,
    @Context() context,
  ) {
    const userId = context.req.user.id;
    return this.boardService.moveIssueStage(userId, input);
  }

  /*
  =====================================================
  ✅ MY ASSIGNED ISSUES (UNCHANGED)
  =====================================================
  */
  @Query(() => [Issue], { name: 'myAssignedIssues' })
  @UseGuards(JwtAuthGuard)
  async getMyAssignedIssues(@Context() context) {
    const userId = context.req.user.id;
    return this.boardService.getMyAssignedIssues(userId);
  }
}