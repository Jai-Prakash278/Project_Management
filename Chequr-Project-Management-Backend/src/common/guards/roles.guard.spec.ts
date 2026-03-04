import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';

describe('RolesGuard', () => {
    let guard: RolesGuard;
    let reflector: Reflector;

    beforeEach(() => {
        reflector = new Reflector();
        guard = new RolesGuard(reflector);
    });

    const mockContext = (user: any, handlerRoles: string[] = []) => {
        const context = {
            getHandler: jest.fn(),
            getClass: jest.fn(),
        } as unknown as ExecutionContext;

        jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(handlerRoles);

        // Mock GqlExecutionContext
        jest.spyOn(GqlExecutionContext, 'create').mockReturnValue({
            getContext: () => ({ req: { user } }),
        } as any);

        return context;
    };

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    describe('canActivate', () => {
        it('should return true if no roles are required', () => {
            const context = mockContext({}, []); // No roles required
            expect(guard.canActivate(context)).toBe(true);
        });

        it('should throw ForbiddenException if user is not present', () => {
            const context = mockContext(undefined, ['ADMIN']);
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });

        it('should throw ForbiddenException if user has no roles', () => {
            const context = mockContext({ roles: null }, ['ADMIN']);
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });

        it('should return true if user has required role', () => {
            const user = { roles: ['ADMIN'] };
            const context = mockContext(user, ['ADMIN']);
            expect(guard.canActivate(context)).toBe(true);
        });

        it('should throw ForbiddenException if user does not have required role', () => {
            const user = { roles: ['USER'] };
            const context = mockContext(user, ['ADMIN']);
            expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
        });

        it('should return true if user has SUPER_ADMIN role (Bypass)', () => {
            const user = { roles: ['SUPER_ADMIN'] };
            const context = mockContext(user, ['ADMIN']); // Requires ADMIN, but user is SUPER_ADMIN
            expect(guard.canActivate(context)).toBe(true);
        });

        it('should return true if user has SUPER_ADMIN role even if multiple roles required', () => {
            const user = { roles: ['SUPER_ADMIN'] };
            const context = mockContext(user, ['ADMIN', 'MANAGER']);
            expect(guard.canActivate(context)).toBe(true);
        });
    });
});
