import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './services/auth.service';
import { User } from '@/apps/entities/master/user.entity';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './services/jwt.strategy';
import { StringValue } from 'ms';

const expiresIn = (process.env.JWT_EXPIRES_IN ?? '4h') as StringValue;

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn,
      },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
