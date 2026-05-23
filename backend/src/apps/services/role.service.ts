import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Role } from '../entities/master/role.entity';
import { Permission } from '../entities/master/permission.entity';
import { RolePermission } from '../entities/master/role_permission.entity';
import { CreateRoleDto } from './dto/role/create-role.dto';
import { SetRolePermissionsDto } from './dto/role/set-role-permissions.dto';
import { RequestContextService } from '@/common/context/request-context.service';
import { Membership } from '../entities/master/membership.entity';
import { UpdateRoleDto } from './dto/role/update-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionRepo: Repository<Permission>,
    @InjectRepository(RolePermission)
    private readonly rolePermissionRepo: Repository<RolePermission>,
  ) {}

  async findAll(): Promise<Role[]> {
    return this.roleRepo.find({
      where: { tenant_id: RequestContextService.getTenantId() },
      relations: ['role_permissions', 'role_permissions.permission'],
      order: { name: 'ASC' },
    });
  }

  async findPermissions(): Promise<Permission[]> {
    return this.permissionRepo.find({
      order: { resource: 'ASC', action: 'ASC' },
    });
  }

  async create(dto: CreateRoleDto): Promise<Role> {
    const tenantId = RequestContextService.getTenantId();
    const existing = await this.roleRepo.findOne({
      where: { tenant_id: tenantId, name: dto.name },
    });

    if (existing) {
      throw new BadRequestException('Role name already exists');
    }

    return this.roleRepo.save(
      this.roleRepo.create({
        ...dto,
        tenant_id: tenantId,
      }),
    );
  }

  async update(roleId: string, dto: UpdateRoleDto): Promise<Role> {
    const tenantId = RequestContextService.getTenantId();
    const role = await this.findTenantRoleOrFail(roleId, tenantId);

    if (dto.name && dto.name !== role.name) {
      const existing = await this.roleRepo.findOne({
        where: { tenant_id: tenantId, name: dto.name },
      });

      if (existing && existing.id !== roleId) {
        throw new BadRequestException('Role name already exists');
      }

      role.name = dto.name;
    }

    if (dto.description !== undefined) {
      role.description = dto.description;
    }

    return this.roleRepo.save(role);
  }

  async remove(roleId: string): Promise<void> {
    const tenantId = RequestContextService.getTenantId();
    await this.findTenantRoleOrFail(roleId, tenantId);

    const membershipCount = await this.roleRepo.manager.count(Membership, {
      where: { role_id: roleId },
    });

    if (membershipCount > 0) {
      throw new BadRequestException('Role is still used by users');
    }

    await this.roleRepo.manager.transaction(async (manager) => {
      await manager.delete(RolePermission, { role_id: roleId });
      await manager.delete(Role, { id: roleId, tenant_id: tenantId });
    });
  }

  async setPermissions(
    roleId: string,
    dto: SetRolePermissionsDto,
  ): Promise<Role> {
    const tenantId = RequestContextService.getTenantId();
    await this.findTenantRoleOrFail(roleId, tenantId);

    const permissions = dto.permission_ids.length
      ? await this.permissionRepo.find({
          where: { id: In(dto.permission_ids) },
        })
      : [];

    if (permissions.length !== dto.permission_ids.length) {
      throw new BadRequestException('Some permissions are invalid');
    }

    await this.roleRepo.manager.transaction(async (manager) => {
      await manager.delete(RolePermission, { role_id: roleId });

      if (permissions.length) {
        await manager.save(
          permissions.map((permission) =>
            manager.create(RolePermission, {
              role_id: roleId,
              permission_id: permission.id,
            }),
          ),
        );
      }
    });

    const updated = await this.roleRepo.findOne({
      where: { id: roleId, tenant_id: tenantId },
      relations: ['role_permissions', 'role_permissions.permission'],
    });

    if (!updated) {
      throw new NotFoundException('Role not found');
    }

    return updated;
  }

  private async findTenantRoleOrFail(
    roleId: string,
    tenantId: string,
  ): Promise<Role> {
    const role = await this.roleRepo.findOne({
      where: { id: roleId, tenant_id: tenantId },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }
}
