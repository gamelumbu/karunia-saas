import { requestContext } from "../context/request-context";


export function getCurrentUser() {
  return requestContext.getStore()?.user;
}

export function applyTenantFilter(qb: any, alias: string) {
  const user = getCurrentUser();

  if (user?.roles?.includes('super_admin')) {
    return qb;
  }

  if (!user?.tenant_id) {
    throw new Error('Tenant not found in context');
  }

  qb.leftJoin(`${alias}.tenant`, 'tenant_filter');

  return qb.andWhere('tenant_filter.id = :tenantId', {
    tenantId: user.tenant_id,
  });
}