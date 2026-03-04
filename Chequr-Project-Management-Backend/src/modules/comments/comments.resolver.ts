import { Resolver, Query, Mutation, Args, ID, ResolveField, Parent } from '@nestjs/graphql';
import { CommentsService } from './comments.service';
import { Comment } from './entities/comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';

@Resolver(() => Comment)
export class CommentsResolver {
    constructor(private readonly commentsService: CommentsService) { }

    @Mutation(() => Comment)
    @UseGuards(JwtAuthGuard)
    createComment(
        @Args('createCommentInput') createCommentInput: CreateCommentInput,
        @CurrentUser() user: User,
    ) {
        return this.commentsService.create(createCommentInput, user);
    }

    @Query(() => [Comment], { name: 'commentsByIssue' })
    @UseGuards(JwtAuthGuard)
    findAllByIssue(@Args('issueId', { type: () => String }) issueId: string) {
        return this.commentsService.findAllByIssue(issueId);
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    deleteComment(
        @Args('id', { type: () => ID }) id: string,
        @CurrentUser() user: User,
    ) {
        return this.commentsService.remove(id, user);
    }
    @Mutation(() => Comment)
    @UseGuards(JwtAuthGuard)
    updateComment(
        @Args('updateCommentInput') updateCommentInput: UpdateCommentInput,
        @CurrentUser() user: User,
    ) {
        return this.commentsService.update(updateCommentInput, user);
    }

    @ResolveField(() => Boolean)
    isEdited(@Parent() comment: Comment): boolean {
        return comment.updatedAt.getTime() > comment.createdAt.getTime();
    }
}
