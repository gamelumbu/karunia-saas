import { ForbiddenException } from '@nestjs/common';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { RequestContextService } from '@/common/context/request-context.service';

export class TenantScopeHelper {
  static apply<T extends ObjectLiteral>(
    qb: SelectQueryBuilder<T>,
    alias: string,
    options?: {
      tenantField?: string;
      resource?: string;
      action?: string;
      isRoot?: boolean;
    },
  ): SelectQueryBuilder<T> {
    const user = RequestContextService.getUser();

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (RequestContextService.isSuperAdmin()) {
      return qb;
    }

    const tenantId = RequestContextService.getTenantId();

    if (options?.isRoot) {
      qb.andWhere(`${alias}.id = :tenantId`, { tenantId });
      return qb;
    }

    const tenantField = options?.tenantField || 'tenant_id';
    const resource = options?.resource || alias;
    const action = options?.action || 'read';

    const permission = `${resource}.${action}`;

    if (!RequestContextService.hasPermission(permission)) {
      throw new ForbiddenException(`No permission: ${permission}`);
    }

    qb.andWhere(`${alias}.${tenantField} = :tenantId`, {
      tenantId,
    });

    return qb;
  }
}
