import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';
import { RequestContextService } from '../../context/request-context.service';

export function applyTenantScope<T extends ObjectLiteral>(
  qb: SelectQueryBuilder<T>,
  alias: string,
): SelectQueryBuilder<T> {
  const tenantId = RequestContextService.getTenantId();

  return qb
    .leftJoinAndSelect(
      `${alias}.memberships`,
      'membership',
      'membership.tenant_id = :tenantId',
      { tenantId },
    )
    .leftJoinAndSelect('membership.role', 'role');
}
