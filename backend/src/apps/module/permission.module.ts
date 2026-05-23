import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { RolePermission } from '../entities/master/role_permission.entity';
import { PermissionService } from '../services/permission.service';
import { Membership } from '../entities/master/membership.entity';
import { Policy } from '../entities/master/policy.entity';
import { AbacService } from '../services/abac.service';

@Module({
  imports: [TypeOrmModule.forFeature([Membership, RolePermission, Policy])],
  providers: [PermissionService, AbacService],
  exports: [PermissionService, AbacService],
})
export class PermissionModule {}
