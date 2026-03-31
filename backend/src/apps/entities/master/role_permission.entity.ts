import { Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, Unique } from "typeorm";
import { Permission } from "./permission.entity";
import { Role } from "./role.entity";

@Unique(['role', 'permission'])
@Entity('role_permissions')
export class RolePermission {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Permission, (permissions) => permissions.role_permissions, {
    nullable: false,
  })
  @JoinColumn({name: 'permission_id'})
  permission: Permission;

  @ManyToOne(() => Role, (role) => role.role_permission, {
    nullable: false,
  })
  @JoinColumn ({name: 'role_id'})
  role: Role;
}