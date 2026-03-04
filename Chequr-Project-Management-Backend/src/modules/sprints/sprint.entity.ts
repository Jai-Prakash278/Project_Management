import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { sprintStatus } from '../../common/enums/sprint-status.enum';
import { Project } from '../projects/project.entity';
import { Issue } from '../issues/issue.entity';

registerEnumType(sprintStatus, {
  name: 'SprintStatus',
});

@ObjectType()
@Entity('sprints')
export class Sprint {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  name: string;

  @Field()
  @Column({ type: 'timestamp', nullable: true })
  startDate?: Date;

  @Field()
  @Column({ type: 'timestamp', nullable: true })
  endDate?: Date;

  @Field({ nullable: true })
  @Column({ nullable: true })
  goal?: string;


  @Field(() => sprintStatus)
  @Column({
    type: 'enum',
    enum: sprintStatus,
    default: sprintStatus.PLANNED,
  })
  status: sprintStatus;

  @Index('IDX_SPRINT_PROJECT')
  @Field(() => Project)
  @ManyToOne(() => Project, (project) => project.sprints, {
    onDelete: 'CASCADE',
  })
  project: Project;

  @Field(() => [Issue], { nullable: true })
  @OneToMany(() => Issue, (issue) => issue.sprint)
  issues: Issue[];

  @Field()
  @CreateDateColumn()
  createdAt: Date;

  @Field()
  @UpdateDateColumn()
  updatedAt: Date;
}
