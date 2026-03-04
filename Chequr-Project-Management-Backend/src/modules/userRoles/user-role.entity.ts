import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

import { User } from '../users/user.entity';
import { Role } from '../roles/role.entity';
import { Organization } from '../organization/organization.entity';

import { ObjectType, Field, ID } from '@nestjs/graphql';

@ObjectType()
@Entity('user_roles')
export class UserRole {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => String, { nullable: true })
  @Column({ name: 'organization_id', nullable: true })
  organizationId: string | null;

  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field()
  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Field()
  @Column({ name: 'role_id' })
  roleId: string;

  @Field(() => Role)
  @ManyToOne(() => Role)
  @JoinColumn({ name: 'role_id' })
  role: Role;

  @Field({ nullable: true })
  @Column({ name: 'assigned_by', nullable: true })
  assignedBy: string;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
  @Field({ nullable: true })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;
}