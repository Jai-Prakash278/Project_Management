import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Attachment } from './entities/attachment.entity';
import { User } from '../users/user.entity';
import { Issue } from '../issues/issue.entity';
import { FileUpload } from 'graphql-upload';
import sharp from 'sharp';

@Injectable()
export class AttachmentsService {
    constructor(
        @InjectRepository(Attachment)
        private attachmentRepository: Repository<Attachment>,
        @InjectRepository(Issue)
        private issueRepository: Repository<Issue>,
    ) { }

    async upload(issueId: string, file: Promise<FileUpload>, user: User): Promise<Omit<Attachment, 'fileData' | 'thumbnailData'>> {
        const { createReadStream, filename, mimetype } = await file;
        const stream = createReadStream();
        const chunks: Buffer[] = [];

        const buffer = await new Promise<Buffer>((resolve, reject) => {
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('error', reject);
            stream.on('end', () => resolve(Buffer.concat(chunks)));
        });

        // 10MB limit for general files
        if (buffer.length > 10 * 1024 * 1024) {
            throw new BadRequestException('File size exceeds 10MB limit');
        }

        const issue = await this.issueRepository.findOne({ where: { id: issueId } });
        if (!issue) {
            throw new NotFoundException(`Issue with ID ${issueId} not found`);
        }

        let thumbnailData: Buffer | null = null;
        if (mimetype.startsWith('image/')) {
            try {
                // Generate a thumbnail (max 400px width/height, maintaining aspect ratio)
                thumbnailData = await sharp(buffer)
                    .resize(400, 400, { fit: 'inside', withoutEnlargement: true })
                    .toBuffer();
            } catch (error) {
                console.error('Thumbnail generation failed', error);
                // Fallback: use full image as thumbnail if sharp fails
                thumbnailData = buffer;
            }
        }

        const attachment = this.attachmentRepository.create({
            fileName: filename,
            mimeType: mimetype,
            fileSize: buffer.length,
            fileData: buffer,
            thumbnailData: thumbnailData || buffer, // Default to buffer if not image
            issue,
            uploadedBy: user,
        });

        const saved = await this.attachmentRepository.save(attachment);

        // Return without large buffers
        const { fileData, thumbnailData: _, ...result } = saved;
        return result as Attachment;
    }

    async findAllByIssue(issueId: string): Promise<Attachment[]> {
        const attachments = await this.attachmentRepository.find({
            where: { issue: { id: issueId } },
            select: ['id', 'fileName', 'mimeType', 'fileSize', 'thumbnailData', 'createdAt', 'uploadedBy'],
            relations: ['uploadedBy'],
            order: { createdAt: 'DESC' },
        });

        // Map thumbnailData to base64 for GraphQL if needed, 
        // but here we just return the entities. The resolver will handle base64 conversion.
        return attachments;
    }

    async download(id: string): Promise<{ fileName: string; mimeType: string; base64: string }> {
        const attachment = await this.attachmentRepository.findOne({
            where: { id },
            select: ['id', 'fileName', 'mimeType', 'fileData'],
        });

        if (!attachment) {
            throw new NotFoundException(`Attachment with ID ${id} not found`);
        }

        return {
            fileName: attachment.fileName,
            mimeType: attachment.mimeType,
            base64: attachment.fileData.toString('base64'),
        };
    }

    async remove(id: string, user: User): Promise<boolean> {
        const attachment = await this.attachmentRepository.findOne({
            where: { id },
            relations: ['uploadedBy'],
        });

        if (!attachment) {
            throw new NotFoundException(`Attachment with ID ${id} not found`);
        }

        const isUploader = attachment.uploadedBy.id === user.id;

        if (!isUploader) {
            throw new ForbiddenException('You can only delete your own attachments');
        }

        await this.attachmentRepository.remove(attachment);
        return true;
    }

    async update(id: string, fileName: string, user: User): Promise<Attachment> {
        const attachment = await this.attachmentRepository.findOne({
            where: { id },
            relations: ['uploadedBy'],
        });

        if (!attachment) {
            throw new NotFoundException(`Attachment with ID ${id} not found`);
        }

        if (attachment.uploadedBy.id !== user.id) {
            throw new ForbiddenException('You can only rename your own attachments');
        }

        attachment.fileName = fileName;
        return this.attachmentRepository.save(attachment);
    }

    async findOne(id: string): Promise<Attachment | null> {
        return this.attachmentRepository.findOne({ where: { id } });
    }
}