import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TenantService } from '../services/tenant.service';
import { CreateTenantDto } from '../services/dto/tenant/create-tenant.dto';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { PermissionGuard } from '@/common/guard/permission.guard';
import { Permissions } from '@/common/decorator/permission.decorator';
import { PaginationTenantQueryDto } from '../services/dto/tenant/pagination.tenant.dto';
import { Tenant } from '../entities/master/tenant.entity';
import { PaginatedTenantResponseDto } from '../services/dto/tenant/pagination-response.dto';
import { UpdateTenantDto } from '../services/dto/tenant/update-tenant.dto';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @Permissions('tenant.read')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: PaginationTenantQueryDto,
  ): Promise<PaginatedTenantResponseDto<Tenant>> {
    const result = await this.tenantService.findAll(
      query.page,
      query.limit,
      query.search ?? '',
      query.sortBy ?? 'created_at',
      query.sortOrder ?? 'DESC',
      query.type ?? 'active',
    );

    const totalPages = Math.ceil(result.total / result.limit);

    return {
      message: 'List Tenant successfully retrieved',
      data: result.data,
      pagination: {
        current_page: result.page,
        total_pages: totalPages,
        total_items: result.total,
        limit: result.limit,
      },
    };
  }

  @Post()
  @Permissions('tenant.create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createTenant: CreateTenantDto) {
    const newTenant = await this.tenantService.create(createTenant);

    return {
      success: true,
      message: 'Tenant created successfully',
      data: newTenant,
    };
  }

  @Get('id')
  @Permissions('tenant.read')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantService.findOne(id);

    return {
      success: true,
      message: 'Tenant retrieved successfully',
      data: tenant,
    };
  }

  @Patch(':id')
  @Permissions('tenant.update')
  async update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    const updated = await this.tenantService.update(id, dto);

    return {
      success: true,
      message: 'Tenant updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  @Permissions('tenant.delete')
  async softDelete(@Param('id') id: string) {
    await this.tenantService.softDelete(id);

    return {
      success: true,
      message: 'Tenant deleted successfully',
    };
  }

  @Patch(':id/restore')
  @Permissions('tenant.restore')
  async restore(@Param('id') id: string) {
    const restored = await this.tenantService.restore(id);

    return {
      success: true,
      message: 'Tenant restored successfully',
      data: restored,
    };
  }

  @Delete('permanent/:id')
  @Permissions('tenant.delete')
  async hardDelete(@Param('id') id: string) {
    await this.tenantService.hardDelete(id);

    return {
      success: true,
      message: 'Tenant deleted successfully',
    };
  }
}
