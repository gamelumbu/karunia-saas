import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Tenant } from "./tenant.entity";

@Entity('master_policies')
export class Policy {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: "varchar", length: 255 })
  name: string;

  @Column({ type: "varchar", length: 255 })
  resource: string;

  @Column({ type: "varchar", length: 255 })
  action: string;

  @Column({ type: 'jsonb' })
  conditions: object;

  @ManyToOne(() => Tenant, (tenant) => tenant.policy, {
    nullable: false
  })
  @JoinColumn({name: 'tenant_id'})
  tenant: Tenant;
}