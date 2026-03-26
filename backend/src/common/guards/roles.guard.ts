import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../../modules/auth/strategies/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const { user, params } = context.switchToHttp().getRequest<{ user: AuthUser; params: any }>();
    
    if (!user || !user.organizations) {
      return false;
    }

    // 1. GLOBAL_ADMIN bypass — if the user has isGlobalAdmin flag
    if (user.isGlobalAdmin) {
      return true;
    }

    // 2. Check for specific organization access if organizationId is in params
    const organizationId = params.id || params.organizationId;

    if (organizationId) {
      const userOrg = user.organizations.find(org => org.id === organizationId);
      if (!userOrg) return false;

      return requiredRoles.includes(userOrg.role as UserRole);
    }

    // 3. If no organizationId is provided, check if the user has the required role in ANY organization
    return user.organizations.some(org => requiredRoles.includes(org.role as UserRole));
  }
}
