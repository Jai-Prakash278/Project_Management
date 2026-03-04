import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Unique,
  JoinColumn,
} from 'typeorm';
import { ObjectType, Field, ID, Int } from '@nestjs/graphql';
import { Workflow } from './workflow.entity';

@ObjectType()
@Entity('workflow_stages')
@Unique(['workflowId', 'orderIndex'])
@Index(['workflowId'])
@Index(['orderIndex'])
export class WorkflowStage {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ nullable: false })
  name: string;

  @Field(() => Int)
  @Column({ nullable: false })
  orderIndex: number;

  @Field()
  @Column({ default: false })
  isFinal: boolean;

  @Field(() => ID)
  @Column({ type: 'uuid' })
  workflowId: string;

  @ManyToOne(() => Workflow, workflow => workflow.stages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'workflowId' })
  workflow: Workflow;

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
