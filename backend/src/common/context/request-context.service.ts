import { requestContext } from './request-context';

export interface CurrentUser {
  id: string;
  tenant_id: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
}

export class RequestContextService {
  static get<K extends keyof CurrentUser>(key: K): CurrentUser[K] | undefined {
    return requestContext.getStore()?.user?.[key];
  }

  static getUser(): CurrentUser {
    const user = requestContext.getStore()?.user;

    if (!user) {
      throw new Error('User not found in RequestContext');
    }

    return user;
  }

  static getUserId(): string {
    return this.getUser().id;
  }

  static getTenantId(): string {
    const tenantId = this.getUser().tenant_id;

    if (!tenantId) {
      throw new Error('Tenant not found in user context');
    }

    return tenantId;
  }

  static getRoles(): string[] {
    return this.getUser().roles ?? [];
  }

  static getPermissions(): string[] {
    return this.getUser().permissions ?? [];
  }

  static hasRole(role: string): boolean {
    return this.getRoles().includes(role);
  }

  static hasPermission(permission: string): boolean {
    return this.getPermissions().includes(permission);
  }

  static isSuperAdmin(): boolean {
    return this.hasRole('SUPER_ADMIN');
  }
}
