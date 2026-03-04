import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Issue, Subtask } from './issue.entity';
import { IssuePermissionGuard } from 'src/common/guards/issue-permission.guard';
import { IssueResolver } from './issue.resolver';
import { IssueService } from './issue.service';
import { Project } from '../projects/project.entity';
import { Sprint } from '../sprints/sprint.entity';
import { User } from '../users/user.entity';
import { IssueScheduler } from './issue.scheduler';
import { WorkflowStage } from '../workflows/workflow-stage.entity';

@Module({
    imports: [TypeOrmModule.forFeature([
        Issue,
        Subtask,
        Project,
        Sprint,
        User,
        WorkflowStage,
    ]),
    ],
    providers: [
        IssueResolver,
        IssueService,
        IssuePermissionGuard,
        IssueScheduler,
    ],
    exports: [
        TypeOrmModule,
        IssueService,
    ],
})
export class IssueModule { }