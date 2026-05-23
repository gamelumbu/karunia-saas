import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TenantService } from '../services/tenant.service';
import { CreateTenantDto } from '../services/dto/tenant/create-tenant.dto';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { PermissionGuard } from '@/common/guard/permission.guard';
import { Permissions } from '@/common/decorator/permission.decorator';
import { PaginationTenantQueryDto } from '../services/dto/tenant/pagination.tenant.dto';
import { Tenant } from '../entities/master/tenant.entity';
import { PaginatedTenantResponseDto } from '../services/dto/tenant/pagination-response.dto';
import { UpdateTenantDto } from '../services/dto/tenant/update-tenant.dto';
import { TenantTypeFilter } from '@/common/enum/TenantTypeFilter';
import { existsSync, mkdirSync } from 'fs';
import { extname, join } from 'path';
import type { Request } from 'express';

const { diskStorage } = require('multer') as {
  diskStorage: (options: Record<string, unknown>) => unknown;
};

const tenantUploadDir = join(process.cwd(), 'uploads', 'tenants');

type UploadedTenantFile = {
  filename: string;
  originalname: string;
  mimetype: string;
};

function ensureTenantUploadDir() {
  if (!existsSync(tenantUploadDir)) {
    mkdirSync(tenantUploadDir, { recursive: true });
  }
}

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
      query.type ?? TenantTypeFilter.ACTIVE,
    );

    const totalPages = Math.ceil(result.total / result.limit);

    return {
      success: true,
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

  @Post('uploads/:type')
  @Permissions('tenant.update')
  @UseInterceptors(
    FileInterceptor('image', {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureTenantUploadDir();
          callback(null, tenantUploadDir);
        },
        filename: (req, file, callback) => {
          const type = ['logo', 'banner'].includes(req.params.type)
            ? req.params.type
            : 'asset';
          const safeName = file.originalname
            .replace(extname(file.originalname), '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60);
          callback(
            null,
            `${Date.now()}-${type}-${Math.random().toString(36).slice(2, 10)}-${safeName}${extname(file.originalname).toLowerCase()}`,
          );
        },
      }),
      limits: {
        fileSize: 5 * 1024 * 1024,
      },
      fileFilter: (_req, file, callback) => {
        if (!file.mimetype.startsWith('image/')) {
          callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  async uploadStorefrontAsset(
    @Param('type') type: string,
    @UploadedFile() file: UploadedTenantFile,
    @Req() request: Request,
  ) {
    if (!['logo', 'banner'].includes(type)) {
      throw new BadRequestException('Upload type must be logo or banner');
    }
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const baseUrl = `${request.protocol}://${request.get('host')}`;
    return {
      success: true,
      message: 'Tenant image uploaded successfully',
      data: {
        url: `${baseUrl}/uploads/tenants/${file.filename}`,
        filename: file.filename,
        type,
      },
    };
  }

  @Get(':id')
  @Permissions('tenant.read')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const tenant = await this.tenantService.findOne(id);

    return {
      success: true,
      message: 'Tenant retrieved successfully',
      data: tenant,
    };
  }

  @Patch(':id')
  @Permissions('tenant.update')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() tenantUpdate: UpdateTenantDto,
  ) {
    const updated = await this.tenantService.update(id, tenantUpdate);

    return {
      success: true,
      message: 'Tenant updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  @Permissions('tenant.delete')
  async softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.tenantService.softDelete(id);

    return {
      success: true,
      message: 'Tenant deleted successfully',
    };
  }

  @Patch(':id/restore')
  @Permissions('tenant.restore')
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    const restored = await this.tenantService.restore(id);

    return {
      success: true,
      message: 'Tenant restored successfully',
      data: restored,
    };
  }

  @Delete('permanent/:id')
  @Permissions('tenant.delete')
  async hardDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.tenantService.hardDelete(id);

    return {
      success: true,
      message: 'Tenant permanent deleted successfully',
    };
  }
}
