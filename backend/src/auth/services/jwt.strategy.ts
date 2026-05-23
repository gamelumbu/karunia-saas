import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Membership } from '@/apps/entities/master/membership.entity';
import type { CurrentUser } from '@/common/context/request-context.service';

type JwtPayload = {
  sub: string;
  email: string;
  tenant_id?: string;
  roles?: string[];
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret && configService.get<string>('NODE_ENV') === 'production') {
      throw new Error('JWT_SECRET is required in production');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret ?? 'karunia-local-dev-secret',
    });
  }

  async validate(payload: JwtPayload): Promise<CurrentUser> {
    let roles = payload.roles ?? [];

    if (!roles.length && payload.tenant_id) {
      const membership = await this.membershipRepository.findOne({
        where: {
          user_id: payload.sub,
          tenant_id: payload.tenant_id,
        },
        relations: ['role'],
      });

      roles = membership?.role ? [membership.role.name] : [];
    }

    return {
      id: payload.sub,
      email: payload.email,
      tenant_id: payload.tenant_id ?? '',
      roles,
    };
  }
}
