import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { RequestContextService } from '../../context/request-context.service';

export function applyTenantScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
): SelectQueryBuilder<T> {
  return qb
    .leftJoin(`${alias}.memberships`, 'membership')
    .andWhere('membership.tenant_id = :tenantId', {
      tenantId: RequestContextService.getTenantId(),
    })
    .distinct(true);
}