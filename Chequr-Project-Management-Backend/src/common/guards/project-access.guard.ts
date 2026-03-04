import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { User } from '../../modules/users/user.entity';

@Injectable()
export class ProjectAccessGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const ctx = GqlExecutionContext.create(context);
        const request = ctx.getContext().req;
        const user = request.user; // Don't type as User entity because req.user is a different shape (JWT payload)

        if (!user || !user.roles) {
            return false;
        }

        // roles is string[] from JwtStrategy
        const userRoles: string[] = user.roles;

        const isAdmin = userRoles.includes('ADMIN');
        const isProjectManager = userRoles.includes('PROJECT_MANAGER');
        // Member check is implicit if strict CRUD is enforced below

        // Admin and PM can do everything (Create, Update, Delete, Assign)
        // Member can do nothing (ReadOnly is handled by Resolver/Service logic not blocking the method entry necessarily, 
        // but if this guard is on Mutations, Members are blocked).

        // If this guard is applied to Mutations (Create/Update/Delete/Assign):
        if (isAdmin || isProjectManager) {
            return true;
        }

        // If generic Member, deny access to modifications
        throw new ForbiddenException('You do not have permission to perform this action on projects');
    }
}
