import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { RolePermission } from '../entities/master/role_permission.entity';
import { PermissionService } from '../services/permission.service';
import { Membership } from '../entities/master/membership.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, RolePermission])],
  providers: [PermissionService],
  exports: [PermissionService],
})
export class PermissionModule {}
