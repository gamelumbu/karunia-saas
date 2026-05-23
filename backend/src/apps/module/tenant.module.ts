import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../entities/master/tenant.entity';
import { Module } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { TenantController } from '../controllers/tenant.controller';
import { PermissionModule } from './permission.module';
import { Membership } from '../entities/master/membership.entity';
import { Role } from '../entities/master/role.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tenant, Membership, Role]),
    PermissionModule,
  ],
  providers: [TenantService],
  controllers: [TenantController],
  exports: [TypeOrmModule],
})
export class TenantModule {}
