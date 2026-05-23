import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './services/auth.service';
import { User } from '@/apps/entities/master/user.entity';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './services/jwt.strategy';
import { StringValue } from 'ms';
import { Membership } from '@/apps/entities/master/membership.entity';

const expiresIn = (process.env.JWT_EXPIRES_IN ?? '4h') as StringValue;
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET is required in production');
}

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Membership]),
    JwtModule.register({
      secret: jwtSecret ?? 'karunia-local-dev-secret',
      signOptions: {
        expiresIn,
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
