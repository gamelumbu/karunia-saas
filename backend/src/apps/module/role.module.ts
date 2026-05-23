import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Role } from '../entities/master/role.entity';
import { Permission } from '../entities/master/permission.entity';
import { RolePermission } from '../entities/master/role_permission.entity';
import { RoleService } from '../services/role.service';
import { RoleController } from '../controllers/role.controller';
import { PermissionModule } from './permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role, Permission, RolePermission]),
    PermissionModule,
  ],
  providers: [RoleService],
  controllers: [RoleController],
})
export class RoleModule {}
