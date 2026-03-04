import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  ManyToMany,
} from 'typeorm';
import { ObjectType, Field, ID } from '@nestjs/graphql';

import { UserStatus } from '../../common/enums/user-status.enum';
import { Organization } from '../organization/organization.entity';
import { UserRole } from '../userRoles/user-role.entity';
import { Attachment } from '../attachments/entities/attachment.entity';
import { Project } from '../projects/project.entity';
import { Comment } from '../comments/entities/comment.entity';


@ObjectType()
@Entity('users')
export class User {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field({ nullable: true })
  @Column({ name: 'organization_id', nullable: true })
  organizationId: string;


  @ManyToOne(() => Organization)
  @JoinColumn({ name: 'organization_id' })
  organization: Organization;

  @Field()
  @Column({ unique: true })
  email: string;

  @Field({ nullable: true })
  @Column({ name: 'first_name', nullable: true })
  firstName: string;

  @Field({ nullable: true })
  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Field({ nullable: true })
  @Column({ name: 'phone', nullable: true })
  phone: string;

  @Field({ nullable: true })
  @Column({ name: 'employee_id', nullable: true })
  employeeId: string;

  @Field({ nullable: true })
  @Column({ name: 'reporting_manager', nullable: true })
  reportingManager: string;

  // ❗ Not exposed to GraphQL
  @Column({
    name: 'password_hash',
    type: 'varchar',
    nullable: true,
  })
  passwordHash: string | null;

  @Column({
    name: 'reset_token',
    type: 'varchar',
    length: 6,
    nullable: true,
  })
  resetToken: string | null;

  // ❗ Not exposed to GraphQL
  @Column({
    name: 'reset_token_expires_at',
    type: 'timestamp',
    nullable: true,
  })
  resetTokenExpiresAt: Date | null;

  @Field(() => UserStatus)
  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.INVITED,
  })
  status: UserStatus;

  @Field(() => [UserRole], { nullable: true })
  @OneToMany(() => UserRole, (userRole) => userRole.user)
  roles: UserRole[];

  @OneToMany(() => Comment, (comment) => comment.author)
  comments: Comment[];

  @OneToMany(() => Attachment, (attachment) => attachment.uploadedBy)
  attachments: Attachment[];





  //profile fields

  @Field({ nullable: true })
  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  //email verification
  @Field()
  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Field({ nullable: true })
  @Column({ name: 'email_verified_at', nullable: true })
  emailVerifiedAt: Date;
  //employee information
  @Field({ nullable: true })
  @Column({ name: 'employment_type', nullable: true })
  employmentType: string;

  @Field({ nullable: true })
  @Column({ name: 'employment_status', nullable: true })
  employmentStatus: string;

  //login tracking
  @Column({ name: 'last_login_at', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'last_login_ip', nullable: true })
  lastLoginIp: string;
  //password lifecycle
  @Column({ name: 'password_reset_token', nullable: true })
  passwordResetToken: string;

  @Column({ name: 'password_reset_expires', nullable: true })
  passwordResetExpires: Date;

  @Column({ name: 'password_changed_at', nullable: true })
  passwordChangedAt: Date;
  //scope flag
  @Field()
  @Column({ name: 'is_in_scope', default: true })
  isInScope: boolean;

  @Field()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field()
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field({ nullable: true })
  @DeleteDateColumn({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  //Project Field 

  @Field(() => [Project], { nullable: 'items' })
  @ManyToMany(() => Project, (project) => project.members)
  projects: Project[];
  @Field()
  get username(): string {
    const name = [this.firstName, this.lastName].filter(Boolean).join(' ');
    // If we have a name, return it; otherwise fallback to email (or part of it)
    return name || this.email;
  }
}
