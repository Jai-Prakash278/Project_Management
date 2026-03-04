import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { GqlExecutionContext } from "@nestjs/graphql";
import { ROLES_KEY } from "../decorators/roles.decorator";
import { Reflector } from "@nestjs/core";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no roles required → allow
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const ctx = GqlExecutionContext.create(context);
    const user = ctx.getContext().req.user;

    if (!user || !user.roles) {
      throw new ForbiddenException('Access denied');
    }

    // 🔥 ADMIN has full access (for now)
    if (user.roles.includes('ADMIN')) {
      return true;
    }

    const hasRole = requiredRoles.some((role) =>
      user.roles.includes(role),
    );

    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}








// import {
//   CanActivate,
//   ExecutionContext,
//   ForbiddenException,
//   Injectable,
// } from "@nestjs/common";
// import { GqlExecutionContext } from "@nestjs/graphql";
// import { ROLES_KEY } from "../decorators/roles.decorator";
// import { Reflector } from "@nestjs/core";

// @Injectable()
// export class RolesGuard implements CanActivate {
//   constructor(private reflector: Reflector) {}

//   canActivate(context: ExecutionContext): boolean {
//     const requiredRoles = this.reflector.getAllAndOverride<string[]>(
//       ROLES_KEY,
//       [context.getHandler(), context.getClass()],
//     );

//     // If no roles required → allow
//     if (!requiredRoles || requiredRoles.length === 0) {
//       return true;
//     }

//     const ctx = GqlExecutionContext.create(context);
//     const user = ctx.getContext().req.user;

//     if (!user || !user.roles) {
//       throw new ForbiddenException("Access denied");
//     }

//     // 🌍 GLOBAL SUPER_ADMIN BYPASS
//     if (user.roles.includes("SUPER_ADMIN")) {
//       return true;
//     }

//     // 🏢 Org-level role check
//     const hasRole = requiredRoles.some((role) =>
//       user.roles.includes(role),
//     );

//     if (!hasRole) {
//       throw new ForbiddenException("Insufficient permissions");
//     }

//     return true;
//   }
// }
