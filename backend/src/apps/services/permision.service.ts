import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermission } from '../entities/master/role_permission.entity';
import { Repository } from 'typeorm';
import { Membership } from '../entities/master/membership.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(Membership)
    private membershipRepo: Repository<Membership>,

    @InjectRepository(RolePermission)
    private rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async getUserPermissions(
    userId: string,
    tenantId: string,
  ): Promise<string[]> {
    const permissions = await this.rolePermissionRepo
      .createQueryBuilder('rp')
      .innerJoin('rp.permission', 'p')
      .innerJoin(Membership, 'm', 'm.role_id = rp.role_id')
      .where('m.user_id = :userId', { userId })
      .andWhere('m.tenant_id = :tenantId', { tenantId })
      .select(['p.resource AS resource', 'p.action AS action'])
      .getRawMany();

    const result = permissions.map((p) => `${p.resource}.${p.action}`);
    return [...new Set(result)];
  }
}
