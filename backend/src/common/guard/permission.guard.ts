import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSION_KEY } from '../decorator/permission.decorator';
import { PermissionService } from '@/apps/services/permission.service';
import { RedisService } from '@/database/redis/redis.service';
import type { Request } from 'express';
import type { CurrentUser } from '../context/request-context.service';

type AuthenticatedRequest = Request & {
  user?: CurrentUser;
};

@Injectable()
export class PermissionGuard implements CanActivate {
  private readonly CACHE_TTL = 300;
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

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (user.roles?.some((role) => ['SUPER_ADMIN', 'OWNER'].includes(role))) {
      return true;
    }

    const cacheKey = this.getCacheKey(user.id, user.tenant_id);

    let userPermissions: string[];
    try {
      const cached = await this.redisService.get<string[]>(cacheKey);

      if (cached) {
        userPermissions = cached;
      } else {
        userPermissions = await this.permissionService.getUserPermissions(
          user.id,
          user.tenant_id,
        );

        await this.redisService.set(cacheKey, userPermissions, this.CACHE_TTL);
      }
    } catch {
      userPermissions = await this.permissionService.getUserPermissions(
        user.id,
        user.tenant_id,
      );
    }
    request.user.permissions = userPermissions;

    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException({
        message: 'Forbidden: insufficient permissions',
        required: requiredPermissions,
        current: userPermissions,
      });
    }

    return true;
  }

  private getCacheKey(userId: string, tenantId: string): string {
    return `user_permissions:${userId}:${tenantId}:v2`;
  }
}
