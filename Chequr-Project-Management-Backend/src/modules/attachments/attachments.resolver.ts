import { Resolver, Query, Mutation, Args, ID } from '@nestjs/graphql';
import { AttachmentsService } from './attachments.service';
import { Attachment, DownloadAttachmentResponse } from './entities/attachment.entity';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../users/user.entity';
import { GraphQLUpload, FileUpload } from 'graphql-upload';

@Resolver(() => Attachment)
export class AttachmentsResolver {
    constructor(private readonly attachmentsService: AttachmentsService) { }

    @Mutation(() => Attachment)
    @UseGuards(JwtAuthGuard)
    async uploadAttachment(
        @Args('issueId') issueId: string,
        @Args({ name: 'file', type: () => GraphQLUpload }) file: Promise<FileUpload>,
        @CurrentUser() user: User,
    ) {
        return this.attachmentsService.upload(issueId, file, user);
    }

    @Query(() => [Attachment], { name: 'attachmentsByIssue' })
    @UseGuards(JwtAuthGuard)
    async getAttachmentsByIssue(@Args('issueId') issueId: string) {
        return this.attachmentsService.findAllByIssue(issueId);
    }

    @Query(() => DownloadAttachmentResponse, { name: 'downloadAttachment' })
    @UseGuards(JwtAuthGuard)
    async downloadAttachment(@Args('id', { type: () => ID }) id: string) {
        return this.attachmentsService.download(id);
    }

    @Mutation(() => Boolean)
    @UseGuards(JwtAuthGuard)
    async deleteAttachment(
        @Args('id', { type: () => ID }) id: string,
        @CurrentUser() user: User,
    ) {
        return this.attachmentsService.remove(id, user);
    }

    @Mutation(() => Attachment)
    @UseGuards(JwtAuthGuard)
    async updateAttachment(
        @Args('id', { type: () => ID }) id: string,
        @Args('fileName') fileName: string,
        @CurrentUser() user: User,
    ) {
        return this.attachmentsService.update(id, fileName, user);
    }
}