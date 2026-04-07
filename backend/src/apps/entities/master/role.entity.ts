import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from './tenant.entity';
import { RolePermission } from './role_permission.entity';

@Index(['tenant_id'])
@Entity('master_roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  role_permissions: RolePermission[];

  @Column()
  tenant_id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.roles, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
