import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../entities/commerce/product.entity';
import { Order } from '../entities/commerce/order.entity';
import { OrderItem } from '../entities/commerce/order-item.entity';
import { Tenant } from '../entities/master/tenant.entity';
import { ProductService } from '../services/product.service';
import { OrderService } from '../services/order.service';
import { StorefrontService } from '../services/storefront.service';
import { ProductController } from '../controllers/product.controller';
import { OrderController } from '../controllers/order.controller';
import { StorefrontController } from '../controllers/storefront.controller';
import { PermissionModule } from './permission.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Order, OrderItem, Tenant]),
    PermissionModule,
  ],
  providers: [ProductService, OrderService, StorefrontService],
  controllers: [ProductController, OrderController, StorefrontController],
})
export class CommerceModule {}
