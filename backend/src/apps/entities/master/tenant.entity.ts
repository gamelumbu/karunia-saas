import { StatusAktif } from '@/common/enum/StatusAktif';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Policy } from './policy.entity';
import { Membership } from './membership.entity';

@Entity('master_tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  code: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  domain: string;

  @Column({ type: 'int', default: StatusAktif.ACTIVE })
  active_status: StatusAktif;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at?: Date;

  @OneToMany(() => Membership, (member) => member.tenant)
  memberships: Membership[];

  @OneToMany(() => Policy, (policy) => policy.tenant)
  policy: Policy[];
}
