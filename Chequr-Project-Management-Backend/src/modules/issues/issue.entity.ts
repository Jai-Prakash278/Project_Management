import { Field, ID, ObjectType } from "@nestjs/graphql";
import { issuePriority } from "src/common/enums/issue-priority.enum";
import { issueType } from "src/common/enums/issue-type.enum";
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "../users/user.entity";
import { Project } from "../projects/project.entity";
import { Attachment } from "../attachments/entities/attachment.entity";
import { Sprint } from "../sprints/sprint.entity";
import { Comment } from "../comments/entities/comment.entity";
import { WorkflowStage } from "../workflows/workflow-stage.entity";

@ObjectType()
@Entity('issues')
@Index(['project'])
@Index(['assignee'])
@Index(['stageId'])
export class Issue {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    title: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    description?: string;

    @Field({ nullable: true })
    @Column({ type: 'text', nullable: true })
    blockedReason?: string;

    @Field(() => Number, { nullable: true })
    @Column({ type: 'int', nullable: true })
    storyPoints?: number;

    @Field({ nullable: true })
    @Column({ type: 'timestamp', nullable: true })
    dueDate?: Date;

    @Field(() => issueType)
    @Column({ type: 'enum', enum: issueType })
    type: issueType;

    @Field(() => issuePriority)
    @Column({
        type: 'enum',
        enum: issuePriority,
        default: issuePriority.MEDIUM
    })
    priority: issuePriority

    @Field({ nullable: true })
    @Column({ type: 'float', default: 0, nullable: true })
    boardOrder: number;

    // ✅ Workflow Stage FK (replaces status ENUM)
    @Field(() => ID, { nullable: true })
    @Column({ type: 'uuid', nullable: true })
    stageId: string;

    @Field(() => WorkflowStage, { nullable: true })
    @ManyToOne(() => WorkflowStage, { nullable: true, eager: false })
    @JoinColumn({ name: 'stageId' })
    stage?: WorkflowStage;

    @Field(() => Project, { nullable: true })
    @ManyToOne(() => Project, (project) => project.issues, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'projectId' })
    project: Project;

    @Field(() => User, { nullable: true })
    @ManyToOne(() => User)
    @JoinColumn({ name: 'reporterId' })
    reporter: User;

    @Field(() => User, { nullable: true })
    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: 'assigneeId' })
    assignee?: User | null;

    @Field(() => ID, { nullable: true })
    @Column({ type: 'uuid', nullable: true })
    sprintId?: string | null;

    @Field(() => Sprint, { nullable: true })
    @ManyToOne(() => Sprint, (sprint) => sprint.issues, { nullable: true })
    @JoinColumn({ name: 'sprintId' })
    sprint?: Sprint | null;

    @Field(() => Issue, { nullable: true })
    @ManyToOne(() => Issue, (issue) => issue.childIssues, { nullable: true })
    @JoinColumn({ name: 'parentId' })
    parent?: Issue;

    @Field(() => [Issue], { nullable: true })
    @OneToMany(() => Issue, (issue) => issue.parent)
    childIssues?: Issue[];

    @Field(() => [Subtask], { nullable: true })
    @OneToMany(() => Subtask, (subtask) => subtask.issue, { cascade: true })
    subtaskList?: Subtask[];

    @Field(() => [Comment], { nullable: true })
    @OneToMany(() => Comment, (comment) => comment.issue, { cascade: true })
    comments?: Comment[];

    @Field(() => [Attachment], { nullable: true })
    @OneToMany(() => Attachment, (attachment) => attachment.issue, { cascade: true })
    attachments?: Attachment[];

    @Field()
    @CreateDateColumn()
    createdAt: Date;

    @Field()
    @UpdateDateColumn()
    updatedAt: Date;
}

@ObjectType()
@Entity('subtasks')
export class Subtask {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    title: string;

    @Field()
    @Column({ default: false })
    completed: boolean;

    @Field(() => Issue)
    @ManyToOne(() => Issue, (issue) => issue.subtaskList, { onDelete: 'CASCADE' })
    issue: Issue;
}