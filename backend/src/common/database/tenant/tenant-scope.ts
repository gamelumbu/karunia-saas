import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { RequestContextService } from '../../context/request-context.service';

export function applyTenantScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
): SelectQueryBuilder<T> {
  if (RequestContextService.isSuperAdmin()) {
    return qb
      .leftJoinAndSelect(`${alias}.memberships`, 'membership')
      .leftJoinAndSelect('membership.role', 'role');
  }

  const tenantId = RequestContextService.getTenantId();

  return qb
    .innerJoinAndSelect(
      `${alias}.memberships`,
      'membership',
      'membership.tenant_id = :tenantId',
      { tenantId },
    )
    .leftJoinAndSelect('membership.role', 'role');
}
