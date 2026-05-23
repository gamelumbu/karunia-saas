import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { StorefrontService } from '../services/storefront.service';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../services/dto/order/create-order.dto';

@Controller('marketplace')
export class StorefrontController {
  constructor(
    private readonly storefrontService: StorefrontService,
    private readonly orderService: OrderService,
  ) {}

  @Get('stores')
  async findStores(@Query('search') search = '') {
    return {
      success: true,
      message: 'Stores retrieved successfully',
      data: await this.storefrontService.findStores(search),
    };
  }

  @Get('stores/:slug')
  async findStore(@Param('slug') slug: string) {
    return {
      success: true,
      message: 'Store retrieved successfully',
      data: await this.storefrontService.findStore(slug),
    };
  }

  @Post('stores/:slug/orders')
  async createOrder(@Param('slug') slug: string, @Body() dto: CreateOrderDto) {
    return {
      success: true,
      message: 'Order created successfully',
      data: await this.orderService.createPublic(slug, dto),
    };
  }
}
