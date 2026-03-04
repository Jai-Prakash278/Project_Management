import { Field, ID, ObjectType } from '@nestjs/graphql';
import {
    Column,
    Entity,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from 'typeorm';
import { Workflow } from './workflow.entity';
import { WorkflowStage } from './workflow-stage.entity';

// ─── WorkflowTransition Entity ────────────────────────────────────────────────
// One row = one ALLOWED transition rule in FLEXIBLE mode.
//
// This table is ONLY consulted when workflow.transitionMode === FLEXIBLE.
// In SEQUENTIAL mode, the ±1 orderIndex rule is used instead.
//
// allowedRoles controls which user roles may perform this transition.
// Empty array (stored as '') = no restriction; all roles are allowed.
//
// Example rows:
//   fromStage: "Todo",         toStage: "In Review",  allowedRoles: ["PM", "ADMIN"]
//   fromStage: "Todo",         toStage: "In Progress", allowedRoles: []  (everyone)
//   fromStage: "In Progress",  toStage: "Done",        allowedRoles: ["QA"]
@ObjectType()
@Entity('workflow_transitions')
export class WorkflowTransition {
    // UUID primary key
    @Field(() => ID)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    // Which workflow this rule belongs to
    @Field(() => Workflow)
    @ManyToOne(() => Workflow, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'workflowId' })
    workflow: Workflow;

    @Column()
    workflowId: string;

    // Source stage — the stage the issue is currently IN
    @Field(() => WorkflowStage)
    @ManyToOne(() => WorkflowStage, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'fromStageId' })
    fromStage: WorkflowStage;

    @Column()
    fromStageId: string;

    // Destination stage — where the user wants to move the issue TO
    @Field(() => WorkflowStage)
    @ManyToOne(() => WorkflowStage, { eager: true, onDelete: 'CASCADE' })
    @JoinColumn({ name: 'toStageId' })
    toStage: WorkflowStage;

    @Column()
    toStageId: string;

    // Role keys that may perform this transition.
    // Stored as a comma-separated string by TypeORM's 'simple-array'.
    // e.g. "ADMIN,PROJECT_MANAGER"   or   "" (empty = no restriction)
    @Field(() => [String])
    @Column({ type: 'simple-array', default: '' })
    allowedRoles: string[];
}
