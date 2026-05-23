import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { PermissionGuard } from '@/common/guard/permission.guard';
import { Permissions } from '@/common/decorator/permission.decorator';
import { OrderService } from '../services/order.service';
import { UpdateOrderStatusDto } from '../services/dto/order/update-order-status.dto';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('order')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  @Permissions('order.read')
  async findAll() {
    return {
      success: true,
      message: 'Orders retrieved successfully',
      data: await this.orderService.findAll(),
    };
  }

  @Get(':id')
  @Permissions('order.read')
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return {
      success: true,
      message: 'Order retrieved successfully',
      data: await this.orderService.findOne(id),
    };
  }

  @Patch(':id/status')
  @Permissions('order.update')
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return {
      success: true,
      message: 'Order status updated successfully',
      data: await this.orderService.updateStatus(id, dto.status),
    };
  }
}
