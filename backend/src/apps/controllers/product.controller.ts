import {
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
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { PermissionGuard } from '@/common/guard/permission.guard';
import { Permissions } from '@/common/decorator/permission.decorator';
import { ProductService } from '../services/product.service';
import { CreateProductDto } from '../services/dto/product/create-product.dto';
import { UpdateProductDto } from '../services/dto/product/update-product.dto';

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
