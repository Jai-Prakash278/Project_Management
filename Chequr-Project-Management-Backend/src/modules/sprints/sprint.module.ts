import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sprint } from './sprint.entity';
import { SprintService } from './sprint.service';
import { SprintResolver } from './sprint.resolver';
import { Project } from '../projects/project.entity';
import { Issue } from '../issues/issue.entity';
import { WorkflowStage } from '../workflows/workflow-stage.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Sprint, Project, Issue, WorkflowStage])],
  providers: [SprintService, SprintResolver],
})
export class SprintModule { }
