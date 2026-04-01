import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { RolePermission } from '../entities/master/role_permission.entity';
import { Repository } from 'typeorm';
import { UserRole } from '../entities/master/user_role.entity';

@Injectable()
export class PermissionService {
  constructor(
    @InjectRepository(UserRole)
    private userRoleRepo: Repository<UserRole>,

    @InjectRepository(RolePermission)
    private rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const roles = await this.userRoleRepo.find({
      where: { user_id: userId },
    });

    const roleIds = roles.map(r => r.role_id);
    if (!roleIds.length) return [];

    const permissions = await this.rolePermissionRepo
      .createQueryBuilder('rp')
      .innerJoin('rp.permission', 'p')
      .where('rp.role_id IN (:...roleIds)', { roleIds })
      .select(['p.resource', 'p.action'])
      .getRawMany();

    return permissions.map(p => `${p.p_resource}.${p.p_action}`);
  }
}