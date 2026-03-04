import {
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Unique,
} from 'typeorm';
import { Organization } from '../organization/organization.entity';

import { ObjectType, Field, ID } from '@nestjs/graphql';


@ObjectType()
@Entity('roles')
@Unique(['name', 'organizationId'])
@Unique(['key', 'organizationId'])
export class Role {
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
  @Column()
  name: string;

  @Field()
  @Column()
  key: string;

  @Field({ nullable: true })
  @Column({ type: 'text', nullable: true })
  description: string;

  @Field()
  @Column({ name: 'is_system_role', default: false })
  isSystemRole: boolean;

}

