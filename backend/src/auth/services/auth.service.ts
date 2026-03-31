import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from '@/apps/entities/master/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      relations: [
        'tenant',
        'user_roles',
        'user_roles.role',
        'user_roles.role.role_permission',
        'user_roles.role.role_permission.permission',
      ],
    });

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
}
