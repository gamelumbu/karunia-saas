import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from '../entities/commerce/order.entity';
import { OrderItem } from '../entities/commerce/order-item.entity';
import { Product } from '../entities/commerce/product.entity';
import { Tenant } from '../entities/master/tenant.entity';
import { CreateOrderDto } from './dto/order/create-order.dto';
import { RequestContextService } from '@/common/context/request-context.service';
import { StatusAktif } from '@/common/enum/StatusAktif';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  async findAll(): Promise<Order[]> {
    const tenantId = RequestContextService.getTenantId();
    return this.orderRepo.find({
      where: { tenant_id: tenantId },
      relations: ['items'],
      order: { created_at: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Order> {
    const tenantId = RequestContextService.getTenantId();
    const order = await this.orderRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    return order;
  }

  async createPublic(storeSlug: string, dto: CreateOrderDto): Promise<Order> {
    const tenant = await this.tenantRepo.findOne({
      where: [
        { domain: storeSlug, active_status: StatusAktif.ACTIVE },
        { code: storeSlug, active_status: StatusAktif.ACTIVE },
      ],
    });

    if (!tenant) {
      throw new NotFoundException('Store not found');
    }

    return this.orderRepo.manager.transaction(async (manager) => {
      const items: OrderItem[] = [];
      let total = 0;

      for (const item of dto.items) {
        const product = await manager.findOne(Product, {
          where: {
            id: item.product_id,
            tenant_id: tenant.id,
          },
          lock: { mode: 'pessimistic_write' },
        });

        if (
          !product ||
          product.deleted_at ||
          product.active_status !== StatusAktif.ACTIVE
        ) {
          throw new BadRequestException('Product is not available');
        }

        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Stock for ${product.name} is not enough`,
          );
        }

        const unitPrice = Number(product.price);
        const subtotal = unitPrice * item.quantity;
        total += subtotal;
        product.stock -= item.quantity;
        await manager.save(product);

        items.push(
          manager.create(OrderItem, {
            product_id: product.id,
            product_name: product.name,
            quantity: item.quantity,
            unit_price: unitPrice.toFixed(2),
            subtotal: subtotal.toFixed(2),
          }),
        );
      }

      const order = manager.create(Order, {
        tenant_id: tenant.id,
        order_number: this.createOrderNumber(),
        customer_name: dto.customer_name,
        customer_email: dto.customer_email,
        customer_phone: dto.customer_phone,
        shipping_address: dto.shipping_address,
        shipping_province: dto.shipping_province,
        shipping_city: dto.shipping_city,
        shipping_district: dto.shipping_district,
        shipping_postal_code: dto.shipping_postal_code,
        shipping_method: dto.shipping_method,
        payment_method: dto.payment_method,
        total_amount: total.toFixed(2),
        status: OrderStatus.PENDING,
        items,
      });

      return manager.save(order);
    });
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(id);
    order.status = status;
    return this.orderRepo.save(order);
  }

  async trackPublic(orderNumber: string, email: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: {
        order_number: orderNumber,
        customer_email: email,
      },
      relations: ['items'],
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  private createOrderNumber(): string {
    const stamp = new Date()
      .toISOString()
      .replace(/[-:.TZ]/g, '')
      .slice(0, 14);
    const random = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `ORD-${stamp}-${random}`;
  }
}
