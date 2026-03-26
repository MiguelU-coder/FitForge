import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { UsersService } from '../../modules/users/users.module';

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(private readonly usersService: UsersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user; // populated by JwtAuthGuard

    if (!user) return false;

    const hasAccess = await this.usersService.canAccessApp(user.id);
    if (!hasAccess) {
      throw new ForbiddenException(
        'Subscription required. Please complete your payment to access this feature.',
      );
    }

    return true;
  }
}
