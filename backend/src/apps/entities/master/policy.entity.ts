import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Tenant } from "./tenant.entity";

@Index(['tenant_id'])
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

  @Column()
  tenant_id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.policy, {
    nullable: false,
    onDelete: 'CASCADE',
  })
  @JoinColumn({name: 'tenant_id'})
  tenant: Tenant;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}