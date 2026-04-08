import { Injectable, CanActivate, ExecutionContext, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../../modules/auth/strategies/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  private readonly logger = new Logger(RolesGuard.name);

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No @Roles() decorator → endpoint is open to any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // From here on, roles ARE required — we need a valid user
    const { user, params } = context.switchToHttp().getRequest<{ user: AuthUser; params: any }>();

    if (!user) {
      this.logger.warn('RolesGuard: no user on request — JWT may have failed');
      return false;
    }

    // 1. GLOBAL_ADMIN bypass — if the user has isGlobalAdmin flag
    if (user.isGlobalAdmin) {
      return true;
    }

    // 2. No organizations → cannot satisfy any role requirement
    if (!user.organizations || user.organizations.length === 0) {
      return false;
    }

    // 3. Check for specific organization access if organizationId is in params
    const organizationId = params.id || params.organizationId;

    if (organizationId) {
      const userOrg = user.organizations.find((org) => org.id === organizationId);
      if (!userOrg) return false;

      return requiredRoles.includes(userOrg.role as UserRole);
    }

    // 4. If no organizationId is provided, check if the user has the required role in ANY organization
    return user.organizations.some((org) => requiredRoles.includes(org.role as UserRole));
  }
}
