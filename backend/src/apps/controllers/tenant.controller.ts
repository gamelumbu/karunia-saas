import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
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

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('tenant')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Get()
  @Permissions('tenant.read')
  async findAll(
    @Query() query: PaginationTenantQueryDto,
  ): Promise<PaginatedTenantResponseDto<Tenant>> {
    const result = await this.tenantService.findAll(
      query.page,
      query.limit,
      query.search ?? '',
      query.sortBy ?? 'created_at',
      query.sortOrder ?? 'DESC',
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
}
