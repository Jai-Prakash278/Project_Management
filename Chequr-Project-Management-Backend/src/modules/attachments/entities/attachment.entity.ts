import { Field, ID, ObjectType } from "@nestjs/graphql";
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Issue } from "../../issues/issue.entity";
import { User } from "../../users/user.entity";

@ObjectType()
@Entity('attachments')
export class Attachment {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    fileName: string;

    @Field()
    @Column()
    mimeType: string;

    @Field()
    @Column({ type: 'int', default: 0 })
    fileSize: number;

    // Bytea for full file data
    @Column({ type: 'bytea' })
    fileData: Buffer;

    // Bytea for optimized thumbnail
    @Column({ type: 'bytea', nullable: true })
    thumbnailData: Buffer;

    @Field(() => Issue)
    @ManyToOne(() => Issue, (issue) => issue.attachments, { onDelete: 'CASCADE' })
    issue: Issue;

    @Field(() => User)
    @ManyToOne(() => User, (user) => user.attachments)
    uploadedBy: User;

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String, { name: 'base64' })
    get base64(): string {
        if (!this.thumbnailData) return '';
        return this.thumbnailData.toString('base64');
    }
}

@ObjectType()
export class DownloadAttachmentResponse {
    @Field()
    fileName: string;

    @Field()
    mimeType: string;

    @Field()
    base64: string;
}