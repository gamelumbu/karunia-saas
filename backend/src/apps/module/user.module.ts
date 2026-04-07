import { User } from '../entities/master/user.entity';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PermissionModule } from './permission.module';
import { UserService } from '../services/user.service';
import { UserController } from '../controllers/user.controller';
import { TenantModule } from './tenant.module';
import { createTenantRepositoryProvider } from '@/common/database/tenant/tenant-repository.factory';

const userRepositoryProvider = createTenantRepositoryProvider(User);
@Module({
  imports: [TypeOrmModule.forFeature([User]), PermissionModule, TenantModule],
  providers: [UserService, userRepositoryProvider],
  controllers: [UserController],
  exports: [userRepositoryProvider]
})
export class UserModule {}  