import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Invite } from './invite.entity';

@Entity()
export class InviteToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inviteId: string;

  @ManyToOne(() => Invite)
  @JoinColumn({ name: 'inviteId' })
  invite: Invite;

  @Column()
  token: string;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @CreateDateColumn()
  createdAt: Date;
}