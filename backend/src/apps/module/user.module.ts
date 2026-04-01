import { User } from '../entities/master/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionModule } from './permission.module';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User]), PermissionModule],
  providers: [UserService],
  controllers: [UserController],
})
export class UserModule {}  