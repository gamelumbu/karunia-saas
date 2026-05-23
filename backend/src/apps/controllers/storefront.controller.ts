import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { StorefrontService } from '../services/storefront.service';
import { OrderService } from '../services/order.service';
import { CreateOrderDto } from '../services/dto/order/create-order.dto';

@Controller('marketplace')
export class StorefrontController {
  private readonly orderAttempts = new Map<
    string,
    { count: number; resetAt: number }
  >();

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

  @Get('all')
  async findAllStores() {
    return {
      success: true,
      message: 'All active stores retrieved successfully',
      data: await this.storefrontService.findAllStores(),
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
  async createOrder(
    @Param('slug') slug: string,
    @Body() dto: CreateOrderDto,
    @Req() request: Request,
  ) {
    this.assertOrderRateLimit(request);

    return {
      success: true,
      message: 'Order created successfully',
      data: await this.orderService.createPublic(slug, dto),
    };
  }

  @Get('orders/track')
  async trackOrder(
    @Query('order_number') orderNumber: string,
    @Query('email') email: string,
  ) {
    return {
      success: true,
      message: 'Order tracking retrieved successfully',
      data: await this.orderService.trackPublic(orderNumber, email),
    };
  }

  private assertOrderRateLimit(request: Request): void {
    const key =
      request.ip ||
      request.headers['x-forwarded-for']?.toString().split(',')[0] ||
      'unknown';
    const now = Date.now();
    const windowMs = 60_000;
    const max = 10;
    const current = this.orderAttempts.get(key);

    if (!current || current.resetAt < now) {
      this.orderAttempts.set(key, { count: 1, resetAt: now + windowMs });
      return;
    }

    if (current.count >= max) {
      throw new HttpException('Too many order attempts', HttpStatus.TOO_MANY_REQUESTS);
    }

    current.count += 1;
  }
}
