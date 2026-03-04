import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Comment } from './entities/comment.entity';
import { CreateCommentInput } from './dto/create-comment.input';
import { UpdateCommentInput } from './dto/update-comment.input';
import { User } from '../users/user.entity';
import { Issue } from '../issues/issue.entity';

@Injectable()
export class CommentsService {
    constructor(
        @InjectRepository(Comment)
        private commentRepository: Repository<Comment>,
        @InjectRepository(Issue)
        private issueRepository: Repository<Issue>,
    ) { }

    async create(createCommentInput: CreateCommentInput, user: User): Promise<Comment> {
        const { issueId, content } = createCommentInput;

        const issue = await this.issueRepository.findOne({ where: { id: issueId } });

        if (!issue) {
            throw new NotFoundException(`Issue with ID ${issueId} not found`);
        }

        const comment = this.commentRepository.create({
            content,
            issue,
            author: user,
        });

        return this.commentRepository.save(comment);
    }

    async findAllByIssue(issueId: string): Promise<Comment[]> {
        return this.commentRepository.find({
            where: { issue: { id: issueId } },
            order: { createdAt: 'DESC' },
            relations: ['author'],
        });
    }

    async remove(id: string, user: User): Promise<boolean> {
        const comment = await this.commentRepository.findOne({
            where: { id },
            relations: ['author'],
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${id} not found`);
        }

        if (comment.author.id !== user.id) {
            // Allow admins to delete? For now requirement says "Only author can delete"
            // But usually admins should be able to. Sticking to requirements: "Only authenticated users can... Delete their own comments" -> Implies only own.
            throw new ForbiddenException('You can only delete your own comments');
        }

        await this.commentRepository.remove(comment);
        return true;
    }
    async update(updateCommentInput: UpdateCommentInput, user: User): Promise<Comment> {
        const { commentId, content } = updateCommentInput;

        const comment = await this.commentRepository.findOne({
            where: { id: commentId },
            relations: ['author'],
        });

        if (!comment) {
            throw new NotFoundException(`Comment with ID ${commentId} not found`);
        }

        if (comment.author.id !== user.id) {
            // Check for admin role if applicable, currently restricted to author as per primary requirement
            throw new ForbiddenException('You can only edit your own comments');
        }

        comment.content = content;
        return this.commentRepository.save(comment);
    }
}
