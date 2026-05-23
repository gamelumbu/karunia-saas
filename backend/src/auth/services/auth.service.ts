import { Injectable, UnauthorizedException } from '@nestjs/common';
import { EntityManager, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/apps/entities/master/user.entity';
import { RegisterDto } from './dto/register.dto';
import { Tenant } from '@/apps/entities/master/tenant.entity';
import { Role } from '@/apps/entities/master/role.entity';
import { Membership } from '@/apps/entities/master/membership.entity';
import { Permission } from '@/apps/entities/master/permission.entity';
import { RolePermission } from '@/apps/entities/master/role_permission.entity';
import { StatusAktif } from '@/common/enum/StatusAktif';
import type { CurrentUser } from '@/common/context/request-context.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.memberships', 'memberships')
      .leftJoinAndSelect('memberships.tenant', 'tenant')
      .leftJoinAndSelect('memberships.role', 'role')
      .leftJoinAndSelect('role.role_permissions', 'role_permissions')
      .leftJoinAndSelect('role_permissions.permission', 'permission')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.active_status !== StatusAktif.ACTIVE) {
      throw new UnauthorizedException('User is inactive');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new UnauthorizedException('Password incorrect');
    }

    return {
      user,
    };
  }

  async login(email: string, password: string) {
    const { user } = await this.validateUser(email, password);

    if (!user.memberships?.length) {
      throw new UnauthorizedException('User has no tenant access');
    }

    return {
      user_id: user.id,
      email: user.email,
      access_token: this.jwtService.sign({
        sub: user.id,
        email: user.email,
        roles: [],
      }),
      tenants: user.memberships.map((m) => ({
        tenant_id: m.tenant_id,
        tenant_name: m.tenant?.name,
        role: m.role?.name,
      })),
    };
  }

  async selectTenant(currentUser: CurrentUser, tenantId: string) {
    const user = await this.userRepository.findOne({
      where: { id: currentUser.id },
      relations: ['memberships', 'memberships.role', 'memberships.tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (currentUser.roles?.includes('SUPER_ADMIN')) {
      const tenant = await this.userRepository.manager.findOne(Tenant, {
        where: { id: tenantId },
      });

      if (!tenant) {
        throw new UnauthorizedException('Tenant not found');
      }

      return {
        access_token: this.jwtService.sign({
          sub: user.id,
          email: user.email,
          tenant_id: tenant.id,
          roles: ['SUPER_ADMIN'],
        }),
      };
    }

    const membership = user.memberships.find((m) => m.tenant_id === tenantId);

    if (!membership) {
      throw new UnauthorizedException('Tenant not found');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: membership.tenant_id,
      roles: membership.role ? [membership.role.name] : [],
    };

    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getUserTenants(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['memberships', 'memberships.role', 'memberships.tenant'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      tenants: user.memberships.map((m) => ({
        tenant_id: m.tenant_id,
        tenant_name: m.tenant?.name,
        role: m.role?.name,
      })),
    };
  }

  async register(dto: RegisterDto) {
    const { username, email, password, tenant_name } = dto;

    return this.userRepository.manager.transaction(async (manager) => {
      let tenantCode = tenant_name
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      const existingTenant = await manager.findOne(Tenant, {
        where: { code: tenantCode },
      });

      if (existingTenant) {
        tenantCode = `${tenantCode}-${Date.now()}`;
      }

      const tenant = manager.create(Tenant, {
        name: tenant_name,
        code: tenantCode,
      });

      const savedTenant = await manager.save(tenant);

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = manager.create(User, {
        username,
        email,
        password: hashedPassword,
      });

      const savedUser = await manager.save(user);
      let role = await manager.findOne(Role, {
        where: { name: 'OWNER', tenant_id: savedTenant.id },
        relations: ['role_permissions'],
      });

      if (!role) {
        role = await manager.save(
          manager.create(Role, {
            name: 'OWNER',
            description: 'Pemilik tenant dengan akses penuh ke data tenant',
            tenant_id: savedTenant.id,
          }),
        );
      }

      await this.ensureOwnerPermissions(manager, role.id);

      const userRole = manager.create(Membership, {
        user_id: savedUser.id,
        tenant_id: savedTenant.id,
        role_id: role.id,
      });

      await manager.save(userRole);

      const accessToken = this.jwtService.sign({
        sub: savedUser.id,
        email: savedUser.email,
        tenant_id: savedTenant.id,
        roles: [role.name],
      });

      return {
        message: 'Register success',
        user_id: savedUser.id,
        email: savedUser.email,
        access_token: accessToken,
        tenants: [
          {
            tenant_id: savedTenant.id,
            tenant_name: savedTenant.name,
            role: role.name,
          },
        ],
      };
    });
  }

  private async ensureOwnerPermissions(
    manager: EntityManager,
    roleId: string,
  ): Promise<void> {
    const permissions = await manager.find(Permission);

    if (!permissions.length) {
      return;
    }

    const existingRolePermissions = await manager.find(RolePermission, {
      where: { role_id: roleId },
    });
    const existingPermissionIds = new Set(
      existingRolePermissions.map((item) => item.permission_id),
    );

    const missing = permissions
      .filter((permission) => !existingPermissionIds.has(permission.id))
      .map((permission) =>
        manager.create(RolePermission, {
          role_id: roleId,
          permission_id: permission.id,
        }),
      );

    if (missing.length) {
      await manager.save(RolePermission, missing);
    }
  }
}
