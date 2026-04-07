import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/apps/entities/master/user.entity';
import { RegisterDto } from './dto/register.dto';
import { Tenant } from '@/apps/entities/master/tenant.entity';
import { Role } from '@/apps/entities/master/role.entity';
import { Membership } from '@/apps/entities/master/membership.entity';

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

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new UnauthorizedException('Password incorrect');
    }

    const roles = user.memberships.map((member) => member.role.name);

    const permissions = user.memberships.flatMap((member) =>
      member.role.role_permissions.map(
        (rp) => `${rp.permission.resource}.${rp.permission.action}`,
      ),
    );

    return {
      user,
      roles,
      permissions,
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
      tenants: user.memberships.map((m) => ({
        tenant_id: m.tenant_id,
        tenant_name: m.tenant?.name,
        role: m.role?.name,
      })),
    };
  }

  async selectTenant(userId: string, tenantId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['memberships'],
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const membership = user.memberships.find((m) => m.tenant_id === tenantId);

    if (!membership) {
      throw new UnauthorizedException('Tenant not found');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: membership.tenant_id,
    };

    return {
      access_token: this.jwtService.sign(payload),
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
      const role = manager.create(Role, {
        name: 'OWNER',
      });

      const savedRole = await manager.save(role);

      const userRole = manager.create(Membership, {
        user_id: savedUser.id,
        tenant_id: savedTenant.id,
        role_id: savedRole.id,
      });

      await manager.save(userRole);

      return {
        message: 'Register success',
        user: savedUser,
        tenant: savedTenant,
      };
    });
  }
}
