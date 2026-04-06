import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/apps/entities/master/user.entity';
import { RegisterDto } from './dto/register.dto';
import { Tenant } from '@/apps/entities/master/tenant.entity';
import { Role } from '@/apps/entities/master/role.entity';
import { UserRole } from '@/apps/entities/master/user_role.entity';

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
      .leftJoinAndSelect('user.tenant', 'tenant')
      .leftJoinAndSelect('user.user_roles', 'user_roles')
      .leftJoinAndSelect('user_roles.role', 'role')
      .leftJoinAndSelect('role.role_permission', 'role_permission')
      .leftJoinAndSelect('role_permission.permission', 'permission')
      .where('user.email = :email', { email })
      .getOne();

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new UnauthorizedException('Password incorrect');
    }

    const roles = user.user_roles.map((ur) => ur.role.name);

    const permissions = user.user_roles.flatMap((ur) =>
      ur.role.role_permission.map(
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
    const { user, roles, permissions } = await this.validateUser(
      email,
      password,
    );

    const payload = {
      sub: user.id,
      email: user.email,
      tenant_id: user.tenant.id,
      roles,
      permissions,
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
        tenant_id: savedTenant.id,
      });

      const savedUser = await manager.save(user);
      const role = manager.create(Role, {
        name: 'admin',
        tenant_id: savedTenant.id,
      });

      const savedRole = await manager.save(role);

      const userRole = manager.create(UserRole, {
        user_id: savedUser.id,
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
