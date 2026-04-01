import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UserRole } from '../entities/master/user_role.entity';
import { RolePermission } from '../entities/master/role_permission.entity';
import { PermissionService } from '../services/permision.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserRole, RolePermission])],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
