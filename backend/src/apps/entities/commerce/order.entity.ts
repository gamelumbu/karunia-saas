import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../master/tenant.entity';
import { OrderItem } from './order-item.entity';

export enum OrderStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Index(['tenant_id'])
@Index(['order_number'], { unique: true })
@Entity('commerce_orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenant_id: string;

  @ManyToOne(() => Tenant, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;

  @Column({ type: 'varchar', length: 40 })
  order_number: string;

  @Column({ type: 'varchar', length: 255 })
  customer_name: string;

  @Column({ type: 'varchar', length: 255 })
  customer_email: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  customer_phone?: string;

  @Column({ type: 'text' })
  shipping_address: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  shipping_province?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  shipping_city?: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  shipping_district?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  shipping_postal_code?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  shipping_method?: string;

  @Column({ type: 'varchar', length: 80, nullable: true })
  payment_method?: string;

  @Column({ type: 'numeric', precision: 14, scale: 2, default: 0 })
  total_amount: string;

  @Column({ type: 'varchar', length: 40, default: OrderStatus.PENDING })
  status: OrderStatus;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items: OrderItem[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
