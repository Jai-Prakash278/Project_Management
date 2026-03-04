import { ObjectType, Field, ID } from '@nestjs/graphql';
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    ManyToMany,
    JoinTable,
    JoinColumn,
    OneToMany,
    Index,
} from 'typeorm';

import { projectStatus } from '../../common/enums/project-status.enum';
import { User } from '../users/user.entity';
import { Issue } from '../issues/issue.entity';
import { Sprint } from '../sprints/sprint.entity';
import { Workflow } from '../workflows/workflow.entity';
import { WorkflowStage } from '../workflows/workflow-stage.entity';
import { WorkflowTransition } from '../workflows/workflow-transition.entity';

@ObjectType()
@Entity('projects')
@Index(['workflowId'])
export class Project {
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field()
    @Column()
    name: string;

    @Field()
    @Column({ unique: true })
    key: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    description?: string;

    @Field(() => ID)
    @Column({ name: 'owner_id' })
    ownerId: string;

    @Field(() => User)
    @ManyToOne(() => User)
    @JoinColumn({ name: 'owner_id' })
    owner: User;

    @Field(() => ID)
    @Column({ name: 'organization_id' })
    organizationId: string;

    @Field(() => projectStatus)
    @Column({
        type: 'enum',
        enum: projectStatus,
        default: projectStatus.ACTIVE,
    })
    status: projectStatus;

    // Jira-like fields
    @Field({ nullable: true })
    @Column({ nullable: true })
    color: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    icon: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    type: string; // WEB, MOB, API, DES

    // Members of the project (Assigned Users)
    @Field(() => [User], { nullable: 'items' })
    @ManyToMany(() => User, (user) => user.projects)
    @JoinTable({
        name: 'project_members',
        joinColumn: {
            name: 'project_id',
            referencedColumnName: 'id',
        },
        inverseJoinColumn: {
            name: 'user_id',
            referencedColumnName: 'id',
        },
    })
    members: User[];

    @Field(() => [Issue], { nullable: 'items' })
    @OneToMany(() => Issue, (issue) => issue.project)
    issues: Issue[];

    @Field(() => [Sprint], { nullable: 'items' })
    @OneToMany(() => Sprint, (sprint) => sprint.project)
    sprints: Sprint[];

    @Field()
    @CreateDateColumn({ name: 'created_at' })
    createdAt: Date;

    @Field()
    @UpdateDateColumn({ name: 'updated_at' })
    updatedAt: Date;

    @Field(() => ID, { nullable: true })
    @Column({ nullable: true })
    workflowId: string;

    @Field(() => Workflow, { nullable: true })
    @ManyToOne(() => Workflow, { nullable: true, eager: false })
    @JoinColumn({ name: 'workflowId' })
    workflow: Workflow;

    @Field(() => [WorkflowStage], { nullable: 'items' })
    stages?: WorkflowStage[];

    @Field(() => [WorkflowTransition], { nullable: 'items' })
    transitions?: WorkflowTransition[];
}
