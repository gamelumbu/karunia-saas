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
  UploadedFiles,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { PermissionGuard } from '@/common/guard/permission.guard';
import { Permissions } from '@/common/decorator/permission.decorator';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../services/dto/product/create-product.dto';
import { UpdateProductDto } from '../services/dto/product/update-product.dto';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import type { Request } from 'express';

const { diskStorage } = require('multer') as {
  diskStorage: (options: Record<string, unknown>) => unknown;
};

const uploadDir = join(process.cwd(), 'uploads', 'products');

type UploadedProductFile = {
  filename: string;
  originalname: string;
  mimetype: string;
};

function ensureUploadDir() {
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }
}

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('product')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  @Permissions('product.read')
  async findAll(@Query('search') search = '') {
    return {
      success: true,
      message: 'Products retrieved successfully',
      data: await this.productService.findAll(search),
    };
  }

  @Post()
  @Permissions('product.create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateProductDto) {
    return {
      success: true,
      message: 'Product created successfully',
      data: await this.productService.create(dto),
    };
  }

  @Post('uploads')
  @Permissions('product.create')
  @UseInterceptors(
    FilesInterceptor('images', 8, {
      storage: diskStorage({
        destination: (_req, _file, callback) => {
          ensureUploadDir();
          callback(null, uploadDir);
        },
        filename: (_req, file, callback) => {
          const safeName = file.originalname
            .replace(extname(file.originalname), '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 60);
          callback(
            null,
            `${Date.now()}-${Math.random().toString(36).slice(2, 10)}-${safeName}${extname(file.originalname).toLowerCase()}`,
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
  async uploadImages(
    @UploadedFiles() files: UploadedProductFile[],
    @Req() request: Request,
  ) {
    if (!files?.length) {
      throw new BadRequestException('At least one image is required');
    }

    const baseUrl = `${request.protocol}://${request.get('host')}`;
    return {
      success: true,
      message: 'Product images uploaded successfully',
      data: files.map((file) => ({
        url: `${baseUrl}/uploads/products/${file.filename}`,
        filename: file.filename,
      })),
    };
  }

  @Get(':id')
  @Permissions('product.read')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      success: true,
      message: 'Product retrieved successfully',
      data: await this.productService.findOne(id),
    };
  }

  @Patch(':id')
  @Permissions('product.update')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return {
      success: true,
      message: 'Product updated successfully',
      data: await this.productService.update(id, dto),
    };
  }

  @Delete(':id')
  @Permissions('product.delete')
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.productService.remove(id);
    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }
}
