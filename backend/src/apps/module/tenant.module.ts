import { TypeOrmModule } from '@nestjs/typeorm';
import { Tenant } from '../entities/master/tenant.entity';
import { Module } from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { TenantController } from '../controllers/tenant.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [TenantService],
  controllers: [TenantController],
})
export class TenantModule {}
