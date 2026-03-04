import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Issue } from '../issue.entity';
import { Project } from '../../projects/project.entity';
import { User } from '../../users/user.entity';
import { issueType } from '../../../common/enums/issue-type.enum';

export class IssueValidation {
  static validateProjectMembership(project: Project, user: User) {
    const isMember = project.members?.some((u) => u.id === user.id);

    if (!isMember) {
      throw new ForbiddenException('User does not belong to this project');
    }
  }

  static validateSubtaskRules(parent: Issue, projectId: string) {
    if (!parent) throw new BadRequestException('Parent issue not found');

    if (parent.type === issueType.SUBTASK) {
      throw new BadRequestException('Parent cannot be SUBTASK');
    }

    if (parent.project.id !== projectId) {
      throw new BadRequestException(
        'Parent and subtask must belong to same project',
      );
    }
  }

  static validateAssignmentPermission(project: Project, user: User) {
    const isMember = project.members?.some((u) => u.id === user.id);

    if (!isMember) {
      throw new ForbiddenException(
        'Only project members can assign issues',
      );
    }
  }

  static validateUpdatePermission(issue: Issue, user: User) {
    const isAdmin = user.roles?.some((role) => role.role?.name === 'ADMIN');

    if (
      issue.reporter.id !== user.id &&
      issue.assignee?.id !== user.id &&
      !isAdmin
    ) {
      throw new ForbiddenException(
        'Only Admin, Reporter, or Assignee can update issue',
      );
    }
  }

  static validateDeletePermission(issue: Issue, user: User) {
    const isAdmin = user.roles?.some((role) => role.role?.name === 'ADMIN');

    if (issue.reporter.id !== user.id && !isAdmin) {
      throw new ForbiddenException('Only ADMIN or Reporter can delete issue');
    }
  }

  static validateSprintConsistency(issueProjectId: string, sprintProjectId: string) {
    if (issueProjectId !== sprintProjectId) {
      throw new BadRequestException(
        'Sprint must belong to same project',
      );
    }
  }
}