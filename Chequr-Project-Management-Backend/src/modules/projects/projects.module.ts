import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProjectsService } from './projects.service';
import { ProjectsResolver } from './projects.resolver';
import { Project } from './project.entity';
import { Organization } from '../organization/organization.entity';
import { UsersModule } from '../users/users.module';
import { WorkflowsModule } from '../workflows/workflows.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([Project, Organization]),
        forwardRef(() => UsersModule),
        WorkflowsModule,
    ],
    providers: [ProjectsService, ProjectsResolver],
    exports: [ProjectsService],
})
export class ProjectsModule { }
