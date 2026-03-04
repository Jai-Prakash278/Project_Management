import { Controller, Get, Param, Res, Query, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { Response } from 'express';
import { JwtService } from '@nestjs/jwt';

@Controller('attachments')
export class AttachmentsController {
    constructor(
        private readonly attachmentsService: AttachmentsService,
        private readonly jwtService: JwtService,
    ) { }

    @Get(':id')
    async getAttachment(
        @Param('id') id: string,
        @Res() res: Response,
        @Query('token') token: string,
    ) {
        if (!token) {
            throw new UnauthorizedException('No token provided');
        }

        try {
            await this.jwtService.verifyAsync(token);
        } catch (e) {
            throw new UnauthorizedException('Invalid token');
        }

        const attachment = await this.attachmentsService.findOne(id);

        if (!attachment) {
            throw new NotFoundException('Attachment not found');
        }

        res.set({
            'Content-Type': attachment.mimeType,
            'Content-Disposition': `inline; filename="${attachment.fileName}"`,
        });

        res.send(attachment.fileData);
    }
}
