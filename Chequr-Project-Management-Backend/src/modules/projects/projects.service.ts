import { Injectable, NotFoundException, Inject, forwardRef, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Project } from './project.entity';
import { CreateProjectInput } from './dto/create-project.input';
import { UpdateProjectInput } from './dto/update-project.input';
import { User } from '../users/user.entity';
import { Organization } from '../organization/organization.entity';
import { projectStatus } from '../../common/enums/project-status.enum';
import { UsersService } from '../users/users.service';
import { WorkflowService } from '../workflows/workflow.service';

@Injectable()
export class ProjectsService {
    constructor(
        @InjectRepository(Project)
        private readonly projectsRepository: Repository<Project>,
        @Inject(forwardRef(() => UsersService))
        private readonly usersService: UsersService,
        @InjectRepository(Organization)
        private readonly organizationRepository: Repository<Organization>,
        private readonly workflowService: WorkflowService,
        private readonly dataSource: DataSource,
    ) { }

    async create(createProjectInput: CreateProjectInput, user: User): Promise<Project> {
        const fullUser = await this.usersService.findById(user.id);
        if (!fullUser) throw new NotFoundException('User not found');

        let organizationId = fullUser.organizationId;

        // Fallback: If user has no organization, try to assign the first one found (Dev/Recovery mode)
        if (!organizationId) {
            const defaultOrg = await this.organizationRepository.find({ take: 1 });
            if (defaultOrg && defaultOrg.length > 0) {
                organizationId = defaultOrg[0].id;
            } else {
                throw new NotFoundException(
                    'No organization found to assign to the project. Please contact support.',
                );
            }
        }

        try {
            const savedProject = await this.dataSource.transaction(async (manager) => {
                // 1. Create project (no workflowId yet)
                const { workflow: workflowInput, ...projectData } = createProjectInput;
                const project = manager.create(Project, {
                    ...projectData,
                    ownerId: fullUser.id,
                    organizationId,
                    status: projectStatus.ACTIVE,
                    members: [fullUser],
                });

                const createdProject = await manager.save(project);
                // 2. Create workflow (Advanced or Default)
                let workflow;
                if (workflowInput) {
                    workflow = await this.workflowService.createWorkflowAdvanced(
                        workflowInput.name,
                        workflowInput.isDefault,
                        workflowInput.stages,
                        createdProject.id,
                        workflowInput.transitionMode,
                        workflowInput.transitions,
                    );
                } else {
                    workflow = await this.workflowService.createDefaultWorkflow(createdProject.id);
                }

                if (!workflow) {
                    throw new Error('Failed to create workflow for project');
                }

                // 3. Attach workflowId to project and save
                createdProject.workflowId = workflow.id;
                createdProject.workflow = workflow;
                await manager.save(createdProject);

                return createdProject;
            });

            // Manually populate owner to satisfy GraphQL non-nullable field
            savedProject.owner = fullUser;

            return savedProject;
        } catch (error) {
            if (error.code === '23505') {
                throw new BadRequestException(
                    `Project key "${createProjectInput.key}" already exists.`,
                );
            }
            throw error;
        }
    }
    async findAll(user: any): Promise<Project[]> {
        const fullUser = await this.usersService.findById(user.id);
        if (!fullUser) throw new NotFoundException('User not found');

        const userRoles = fullUser.roles.map(ur => ur.role.key);
        const isAdmin = userRoles.includes('ADMIN');
        const isProjectManager = userRoles.includes('PROJECT_MANAGER');

        const query = this.projectsRepository
            .createQueryBuilder('project')
            .leftJoinAndSelect('project.members', 'members')
            .leftJoinAndSelect('project.owner', 'owner')
            .leftJoinAndSelect('project.issues', 'issues')
            .leftJoinAndSelect('issues.assignee', 'issueAssignee')
            .leftJoinAndSelect('issues.reporter', 'issueReporter')
            .leftJoinAndSelect('issues.stage', 'issueStage')
            .leftJoinAndSelect('project.workflow', 'workflow')
            .where('project.organizationId = :orgId', {
                orgId: fullUser.organizationId,
            })
            .orderBy('project.createdAt', 'DESC');

        if (isAdmin) {
            // Admin sees all projects in org
            return query.getMany();
        }

        if (isProjectManager) {
            // PM sees owned OR assigned
            query.andWhere(
                '(project.ownerId = :userId OR members.id = :userId)',
                { userId: fullUser.id },
            );
            return query.getMany();
        }

        // Normal member sees only assigned
        query.andWhere('members.id = :userId', {
            userId: fullUser.id,
        });

        return query.getMany();
    }

    async findOne(id: string): Promise<Project> {
        const project = await this.projectsRepository.findOne({
            where: { id },
            relations: ['members', 'owner', 'issues', 'workflow', 'issues.assignee', 'issues.reporter', 'issues.stage'],
        });
        if (!project) throw new NotFoundException(`Project with ID ${id} not found`);
        return project;
    }

    async update(id: string, updateProjectInput: UpdateProjectInput): Promise<Project> {
        const project = await this.findOne(id);

        if (updateProjectInput.name) project.name = updateProjectInput.name;
        if (updateProjectInput.description !== undefined) project.description = updateProjectInput.description;
        if (updateProjectInput.status) project.status = updateProjectInput.status;
        if (updateProjectInput.color) project.color = updateProjectInput.color;
        if (updateProjectInput.icon) project.icon = updateProjectInput.icon;
        if (updateProjectInput.type) project.type = updateProjectInput.type;

        return this.projectsRepository.save(project);
    }

    async archive(id: string): Promise<Project> {
        const project = await this.findOne(id);
        project.status = projectStatus.ARCHIVED;
        return this.projectsRepository.save(project);
    }

    async unarchive(id: string): Promise<Project> {
        const project = await this.findOne(id);
        project.status = projectStatus.ACTIVE;
        return this.projectsRepository.save(project);
    }

    async setMembers(projectId: string, userIds: string[]): Promise<Project> {
        const project = await this.findOne(projectId);

        const users = await Promise.all(userIds.map(id => this.usersService.findById(id)));
        const validUsers = users.filter(u => u !== null) as User[];

        // Replace existing members with new list
        project.members = validUsers;
        return this.projectsRepository.save(project);
    }

    async addMember(projectId: string, userId: string): Promise<Project> {
        const project = await this.findOne(projectId);
        const user = await this.usersService.findById(userId);

        if (!user) throw new NotFoundException('User not found');

        // Check if already member
        const isMember = project.members.some(m => m.id === user.id);
        if (!isMember) {
            project.members.push(user);
            return this.projectsRepository.save(project);
        }

        return project;
    }

    async isProjectKeyAvailable(key: string, organizationId: string): Promise<boolean> {
        const project = await this.projectsRepository.findOne({
            where: {
                key: key.toUpperCase(),
                organizationId
            }
        });
        return !project;
    }

    async remove(id: string): Promise<boolean> {
        const result = await this.projectsRepository.delete(id);
        return (result.affected ?? 0) > 0;
    }
}