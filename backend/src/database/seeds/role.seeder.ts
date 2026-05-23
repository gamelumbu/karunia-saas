import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Logger } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '@/apps/entities/master/role.entity';
import { Tenant } from '@/apps/entities/master/tenant.entity';
import { Permission } from '@/apps/entities/master/permission.entity';
import { RolePermission } from '@/apps/entities/master/role_permission.entity';

type RoleSeedRow = {
  name: string;
  description: string;
};

const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: ['*.*'],
  OWNER: ['*.*'],
  ADMIN: [
    'tenant.read',
    'tenant.update',
    'user.create',
    'user.read',
    'user.update',
    'user.delete',
    'user.restore',
    'role.create',
    'role.read',
    'role.update',
    'role.delete',
    'product.create',
    'product.read',
    'product.update',
    'product.delete',
    'order.read',
    'order.update',
  ],
  MANAGER: [
    'user.read',
    'role.read',
    'product.create',
    'product.read',
    'product.update',
    'order.read',
    'order.update',
  ],
  STAFF: ['product.read', 'product.update', 'order.read', 'order.update'],
  USER: ['product.read', 'order.read'],
  VIEWER: ['tenant.read', 'user.read', 'role.read', 'product.read', 'order.read'],
  BILLING: ['tenant.read', 'order.read'],
  SUPPORT: ['user.read', 'product.read', 'order.read', 'order.update'],
};

export default class RoleSeeder implements Seeder {
  private readonly logger = new Logger(RoleSeeder.name);

  public async run(dataSource: DataSource): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'src/database/csv/role.csv');
      const csvContent = fs.readFileSync(filePath, 'utf-8');

      const records = parse<RoleSeedRow>(csvContent, {
        delimiter: ';',
        columns: ['name', 'description'],
        from_line: 2,
        trim: true,
      });

      const roleRepository = dataSource.getRepository(Role);
      const tenantRepository = dataSource.getRepository(Tenant);
      const permissionRepository = dataSource.getRepository(Permission);
      const rolePermissionRepository = dataSource.getRepository(RolePermission);
      const tenants = await tenantRepository.find();
      const permissions = await permissionRepository.find();

      if (!tenants.length) {
        this.logger.warn('Tidak ada tenant. Seed role dilewati.');
        return;
      }

      this.logger.log('Memulai upload data Role...');

      let successCount = 0;
      let permissionCount = 0;

      for (const tenant of tenants) {
        for (const data of records) {
          let role = await roleRepository.findOne({
            where: {
              name: data.name,
              tenant_id: tenant.id,
            },
          });

          if (role) {
            this.logger.warn(
              `Role ${data.name} untuk tenant ${tenant.code} sudah ada, dilewati.`,
            );
          } else {
            role = roleRepository.create({
              name: data.name,
              description: data.description,
              tenant_id: tenant.id,
            });

            role = await roleRepository.save(role);
            successCount++;
          }

          permissionCount += await this.assignDefaultPermissions(
            role,
            permissions,
            rolePermissionRepository,
          );
        }
      }

      this.logger.log(
        `Data Role berhasil diupload. Total data masuk: ${successCount}`,
      );
      this.logger.log(
        `Permission Role berhasil disinkronkan. Total permission masuk: ${permissionCount}`,
      );
    } catch (error) {
      this.logger.error('Error upload data Role', error);
      throw error;
    }
  }

  private async assignDefaultPermissions(
    role: Role,
    permissions: Permission[],
    rolePermissionRepository: Repository<RolePermission>,
  ): Promise<number> {
    const roleName = role.name.toUpperCase();
    const permissionKeys = DEFAULT_ROLE_PERMISSIONS[roleName] ?? [];

    if (!permissionKeys.length || !permissions.length) {
      return 0;
    }

    const selectedPermissions = permissionKeys.includes('*.*')
      ? permissions
      : permissions.filter((permission) =>
          permissionKeys.includes(`${permission.resource}.${permission.action}`),
        );

    const existing = await rolePermissionRepository.find({
      where: { role_id: role.id },
    });
    const existingPermissionIds = new Set(
      existing.map((item) => item.permission_id),
    );
    const missing = selectedPermissions
      .filter((permission) => !existingPermissionIds.has(permission.id))
      .map((permission) =>
        rolePermissionRepository.create({
          role_id: role.id,
          permission_id: permission.id,
        }),
      );

    if (!missing.length) {
      return 0;
    }

    await rolePermissionRepository.save(missing);
    return missing.length;
  }
}
