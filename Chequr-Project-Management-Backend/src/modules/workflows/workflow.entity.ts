import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';
import { WorkflowStage } from './workflow-stage.entity';

@ObjectType()
@Entity('workflows')
@Index(['projectId'])
export class Workflow {

  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ default: false })
  isDefault: boolean;

  @Field()
  @Column({ default: 'SEQUENTIAL' })
  transitionMode: string; // 'SEQUENTIAL' | 'FLEXIBLE'

  @Field(() => ID, { nullable: true })
  @Column({ type: 'uuid', nullable: true })
  projectId?: string;

  /*
  =====================================================
  ✅ Relation: Workflow → Stages
  =====================================================
  */
  @Field(() => [WorkflowStage], { nullable: true })
  @OneToMany(() => WorkflowStage, stage => stage.workflow, {
    cascade: true,
  })
  stages: WorkflowStage[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
