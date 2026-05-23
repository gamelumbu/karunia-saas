import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../entities/master/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTypeFilter } from '@/common/enum/UserTypeFilter';
import { CreateUserDto } from './dto/users/create-user.dto';
import * as bcrypt from 'bcrypt';
import { RequestContextService } from '@/common/context/request-context.service';
import { UpdateUserDto } from './dto/users/update-user.dto';
import { Tenant } from '../entities/master/tenant.entity';
import { USER_REPOSITORY } from '@/common/constant/repository.constant';
import type { TenantRepository } from '@/common/database/tenant/tenant-repository.type';
import { Membership } from '../entities/master/membership.entity';
import { Role } from '../entities/master/role.entity';

@Injectable()
export class UserService {
  constructor(
    @Inject(USER_REPOSITORY)
    private readonly userRepo: TenantRepository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  private async validateUniqueUsernameEmail(
    username?: string,
    email?: string,
    excludeId?: string,
  ): Promise<void> {
    if (username) {
      const existingUsername = await this.userRepo
        .createScopedQuery('user')
        .withDeleted()
        .andWhere('user.username = :username', { username })
        .andWhere(excludeId ? 'user.id != :excludeId' : '1=1', { excludeId })
        .getOne();

      if (existingUsername) {
        if (existingUsername.deleted_at) {
          throw new BadRequestException(
            'Username already used by deleted user. Please restore instead.',
          );
        }

        throw new BadRequestException('Username already exists');
      }
    }

    if (email) {
      const existingEmail = await this.userRepo
        .createScopedQuery('user')
        .withDeleted()
        .andWhere('user.email = :email', { email })
        .andWhere(excludeId ? 'user.id != :excludeId' : '1=1', { excludeId })
        .getOne();

      if (existingEmail) {
        if (existingEmail.deleted_at) {
          throw new BadRequestException(
            'Email already used by deleted user. Please restore instead.',
          );
        }

        throw new BadRequestException('Email already exists');
      }
    }
  }

  private async findUserOrFail(id: string): Promise<User> {
    const user = await this.userRepo
      .createScopedQuery('user')
      .andWhere('user.id = :id', { id })
      .getOne();

    if (!user || user.deleted_at) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  private async findUserWithDeletedOrFail(id: string): Promise<User> {
    const user = await this.userRepo
      .createScopedQuery('user')
      .withDeleted()
      .andWhere('user.id = :id', { id })
      .getOne();

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  async findAll(
    page = 1,
    limit = 10,
    search = '',
    sortBy: string = 'created_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    type: UserTypeFilter = UserTypeFilter.ACTIVE,
  ) {
    const allowedSort = ['created_at', 'username', 'email'];
    if (!allowedSort.includes(sortBy)) {
      sortBy = 'created_at';
    }

    const qb = this.userRepo.createScopedQuery('user');

    if (type === UserTypeFilter.DELETED) {
      qb.withDeleted().andWhere('user.deleted_at IS NOT NULL');
    } else if (type === UserTypeFilter.ALL) {
      qb.withDeleted();
    } else {
      qb.andWhere('user.deleted_at IS NULL');
    }

    if (search) {
      qb.andWhere('(user.username ILIKE :search OR user.email ILIKE :search)', {
        search: `%${search}%`,
      });
    }
    qb.orderBy(`user.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
    };
  }

  async create(createUser: CreateUserDto): Promise<User> {
    const { username, email, password, role_name } = createUser;
    this.ensureCanAssignSuperAdminRole(role_name);

    await this.validateUniqueUsernameEmail(username, email);
    const hashedPassword = await bcrypt.hash(password, 10);
    const currentUser = RequestContextService.getUser();
    let tenantId: string;

    if (RequestContextService.isSuperAdmin()) {
      if (!createUser.tenant_id) {
        throw new BadRequestException('tenant_id is required for super_admin');
      }

      const tenant = await this.tenantRepo.findOne({
        where: { id: createUser.tenant_id },
      });

      if (!tenant) {
        throw new BadRequestException('tenant_id invalid');
      }
      tenantId = createUser.tenant_id;
    } else {
      tenantId = currentUser.tenant_id;
    }

    return await this.userRepo.manager.transaction(async (manager) => {
      const user = manager.create(User, {
        username,
        email,
        password: hashedPassword,
        active_status: createUser.active_status,
      });

      const savedUser = await manager.save(user);

      const role =
        role_name !== undefined && role_name.trim() !== ''
          ? await this.findRoleByNameOrFail(manager, tenantId, role_name)
          : await this.getOrCreateUserRole(manager, tenantId);

      if (!role?.id) {
        throw new BadRequestException('Role not found');
      }

      await manager.save(
        manager.create(Membership, {
          user_id: savedUser.id,
          tenant_id: tenantId,
          role_id: role.id,
        }),
      );

      return savedUser;
    });
  }

  async findOne(id: string): Promise<User> {
    return this.findUserOrFail(id);
  }

  private async getOrCreateUserRole(
    manager: Repository<User>['manager'],
    tenantId: string,
  ): Promise<Role> {
    const existing = await manager.findOne(Role, {
      where: { name: 'USER', tenant_id: tenantId },
    });

    if (existing) {
      return existing;
    }

    return manager.save(
      manager.create(Role, {
        name: 'USER',
        description: 'Pengguna tenant dengan akses standar',
        tenant_id: tenantId,
      }),
    );
  }

  private async findRoleByNameOrFail(
    manager: Repository<User>['manager'],
    tenantId: string,
    roleName: string,
  ): Promise<Role> {
    this.ensureCanAssignSuperAdminRole(roleName);

    const role = await manager
      .createQueryBuilder(Role, 'role')
      .where('role.tenant_id = :tenantId', { tenantId })
      .andWhere('LOWER(role.name) = LOWER(:roleName)', {
        roleName: roleName.trim(),
      })
      .getOne();

    if (!role) {
      throw new BadRequestException(`Role "${roleName}" not found`);
    }

    return role;
  }

  async update(id: string, updateUser: UpdateUserDto): Promise<User> {
    const isSuperAdmin = RequestContextService.isSuperAdmin();
    this.ensureCanAssignSuperAdminRole(updateUser.role_name);

    const user = await this.findUserOrFail(id);
    if (updateUser.username) {
      await this.validateUniqueUsernameEmail(
        updateUser.username,
        undefined,
        id,
      );
    }

    if (updateUser.email) {
      await this.validateUniqueUsernameEmail(undefined, updateUser.email, id);
    }

    if (updateUser.password) {
      updateUser.password = await bcrypt.hash(updateUser.password, 10);
    }

    if (!isSuperAdmin) {
      delete updateUser.tenant_id;
    } else if (updateUser.tenant_id) {
      const tenant = await this.tenantRepo.findOne({
        where: { id: updateUser.tenant_id },
      });

      if (!tenant) {
        throw new BadRequestException('tenant_id invalid');
      }
    }

    if (updateUser.username) user.username = updateUser.username;
    if (updateUser.email) user.email = updateUser.email;
    if (updateUser.password) user.password = updateUser.password;
    if (updateUser.active_status) user.active_status = updateUser.active_status;

    return await this.userRepo.manager.transaction(async (manager) => {
      const savedUser = await manager.save(user);

      if (updateUser.tenant_id || updateUser.role_name) {
        const membership = await manager.findOne(Membership, {
          where: isSuperAdmin
            ? { user_id: id }
            : { user_id: id, tenant_id: RequestContextService.getTenantId() },
        });

        if (membership) {
          if (updateUser.tenant_id) membership.tenant_id = updateUser.tenant_id;
          if (updateUser.role_name) {
            const role = await this.findRoleByNameOrFail(
              manager,
              membership.tenant_id,
              updateUser.role_name,
            );
            membership.role_id = role.id;
          }
          await manager.save(membership);
        }
      }

      return savedUser;
    });
  }

  async softDelete(id: string): Promise<User> {
    const user = await this.findUserOrFail(id);

    if (user.deleted_at) {
      throw new BadRequestException(`User with ${id} already deleted`);
    }

    await this.userRepo.softRemove(user);
    return user;
  }

  async restore(id: string): Promise<User> {
    const user = await this.findUserWithDeletedOrFail(id);

    if (!user.deleted_at) {
      throw new BadRequestException('User is not deleted');
    }
    await this.userRepo.restore(user.id);
    return user;
  }

  async hardDelete(id: string): Promise<void> {
    const user = await this.findUserWithDeletedOrFail(id);

    if (!user.deleted_at) {
      throw new BadRequestException(
        'User must be soft deleted before permanent deletion',
      );
    }

    await this.userRepo.delete(user.id);
  }

  private ensureCanAssignSuperAdminRole(roleName?: string) {
    if (
      this.isSuperAdminRoleName(roleName) &&
      !RequestContextService.isSuperAdmin()
    ) {
      throw new BadRequestException(
        'Only SUPER_ADMIN can assign SUPER_ADMIN role',
      );
    }
  }

  private isSuperAdminRoleName(roleName?: string) {
    return (
      roleName
        ?.trim()
        .toUpperCase()
        .replace(/[\s-]+/g, '_') === 'SUPER_ADMIN'
    );
  }
}
