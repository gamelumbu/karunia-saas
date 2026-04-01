import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorator/permission.decorator';
import { PermissionService } from '@/apps/services/permision.service';
import { RedisService } from '@/database/redis/redis.service';

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
    private redisService: RedisService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSION_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions?.length) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.roles?.includes('super_admin')) {
      return true;
    }

    const cacheKey = `user_permissions:${user.id}`;
    let userPermissions = await this.redisService.get<string[]>(cacheKey);

    if (!userPermissions) {
      userPermissions = await this.permissionService.getUserPermissions(
        user.id,
      );

      await this.redisService.set(cacheKey, userPermissions, 60);
    }

    const hasPermission = requiredPermissions.some((p) =>
      userPermissions.includes(p),
    );

    if (!hasPermission) {
      throw new ForbiddenException(
        `Forbidden: missing permission (${requiredPermissions.join(', ')})`,
      );
    }

    return true;
  }
}
