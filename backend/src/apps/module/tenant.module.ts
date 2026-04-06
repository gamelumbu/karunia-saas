import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../entities/master/tenant.entity';
import { Module } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { TenantController } from '../controllers/tenant.controller';
import { PermissionModule } from './permission.module';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant]), PermissionModule],
  providers: [TenantService,],
  controllers: [TenantController],
  exports: [TypeOrmModule],
})
export class TenantModule {}
