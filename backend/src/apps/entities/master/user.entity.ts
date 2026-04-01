import { StatusAktif } from '@/common/enum/StatusAktif';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './user_role.entity';
import { Tenant } from './tenant.entity';

@Index(['tenant_id', 'email'], { unique: true })
@Index(['tenant_id', 'username'], { unique: true })
@Entity('master_users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({
    type: 'enum',
    enum: StatusAktif,
    default: StatusAktif.ACTIVE,
  })
  active_status: StatusAktif;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn({ nullable: true })
  deleted_at?: Date;

  @OneToMany(() => UserRole, (userRole) => userRole.user)
  user_roles: UserRole[];

  @Column()
  tenant_id: string;

  @ManyToOne(() => Tenant, (tenant) => tenant.users, {
     onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'tenant_id' })
  tenant: Tenant;
}
