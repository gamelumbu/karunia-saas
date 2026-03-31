import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { UserRole } from './user_role.entity';
import { Tenant } from './tenant.entity';
import { RolePermission } from './role_permission.entity';

@Entity('master_roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  user_roles: UserRole[];

  @OneToMany(() => RolePermission, (rolePermission) => rolePermission.role)
  role_permission: RolePermission[];

  @ManyToOne(() => Tenant, (tenant) => tenant.roles, {
    nullable: false,
  })
  @JoinColumn({name: 'tenant_id'})
  tenant: Tenant;
}
