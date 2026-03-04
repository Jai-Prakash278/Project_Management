import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AttachmentsService } from './attachments.service';
import { AttachmentsResolver } from './attachments.resolver';
import { AttachmentsController } from './attachments.controller';
import { Attachment } from './entities/attachment.entity';
import { Issue } from '../issues/issue.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Attachment, Issue]),
        AuthModule,
    ],
    controllers: [AttachmentsController],
    providers: [AttachmentsResolver, AttachmentsService],
    exports: [AttachmentsService],
})
export class AttachmentsModule { }
