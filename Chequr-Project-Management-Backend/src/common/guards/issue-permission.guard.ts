import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { InjectRepository } from '@nestjs/typeorm';
import { Issue } from 'src/modules/issues/issue.entity';
import { Project } from 'src/modules/projects/project.entity';
import { Repository } from 'typeorm';

@Injectable()
export class IssuePermissionGuard implements CanActivate {
  constructor(
    @InjectRepository(Project)
    private projectRepo: Repository<Project>,

    @InjectRepository(Issue)
    private issueRepo: Repository<Issue>,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const { user } = ctx.getContext().req;
    const args = ctx.getArgs();

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // 🔹 Handle Create Issue / Get Issues by Project
    const projectId = args.input?.projectId || args.projectId;
    if (projectId) {
      const project = await this.projectRepo.findOne({
        where: { id: projectId },
        relations: ['members'],
      });

      if (!project) {
        throw new NotFoundException('Project not found');
      }

      const isOwner = project.ownerId === user.id;
      const isMember = project.members?.some(
        (u) => u.id === user.id,
      );
      const isAdmin = Array.isArray(user.roles) && user.roles.includes('ADMIN');

      if (!isOwner && !isMember && !isAdmin) {
        throw new ForbiddenException(
          'You are not a member of this project',
        );
      }
    }

    // 🔹 Handle Update / Assign / Delete / Get Issue
    const issueId = args.input?.issueId || args.id || args.issueId;
    if (issueId) {
      const issue = await this.issueRepo.findOne({
        where: { id: issueId },
        relations: ['project', 'project.members'], // ✅ correct relation path
      });

      if (!issue) {
        throw new NotFoundException('Issue not found');
      }

      const isOwner = issue.project?.ownerId === user.id;
      const isMember = issue.project?.members?.some(
        (u) => u.id === user.id,
      );
      const isAdmin = Array.isArray(user.roles) && user.roles.includes('ADMIN');

      if (!isOwner && !isMember && !isAdmin) {
        throw new ForbiddenException(
          'You are not allowed to access this issue',
        );
      }
    }

    return true;
  }
}
