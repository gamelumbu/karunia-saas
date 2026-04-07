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
    const tenantId = RequestContextService.getTenantId();

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
    const isSuperAdmin = RequestContextService.isSuperAdmin();
    const tenantId = RequestContextService.getTenantId();

    const user = await this.userRepo.findOne({
      where: isSuperAdmin ? { id } : { id },
    });

    if (!user || user.deleted_at) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  private async findUserWithDeletedOrFail(id: string): Promise<User> {
    const isSuperAdmin = RequestContextService.isSuperAdmin();
    const tenantId = RequestContextService.getTenantId();

    const user = await this.userRepo.findOne({
      where: isSuperAdmin ? { id } : { id },
      withDeleted: true,
    });

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
    type: 'active' | 'deleted' | 'all' = 'active',
  ) {
    const allowedSort = ['created_at', 'username', 'email'];
    if (!allowedSort.includes(sortBy)) {
      sortBy = 'created_at';
    }

    const qb = this.userRepo.createScopedQuery('user');

    if (type === 'deleted') {
      qb.withDeleted().andWhere('user.deleted_at IS NOT NULL');
    } else if (type === 'all') {
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
    const { username, email, password, role_id } = createUser;

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

      const roleId =
        role_id ||
        (await manager.findOne(Role, { where: { name: 'member' } }))?.id;

      if (!roleId) {
        throw new BadRequestException('Role not found');
      }

      await manager.save(
        manager.create(Membership, {
          user_id: savedUser.id,
          tenant_id: tenantId,
          role_id: roleId,
        }),
      );

      return savedUser;
    });
  }

  async findOne(id: string): Promise<User> {
    return this.findUserOrFail(id);
  }

  async update(id: string, updateUser: UpdateUserDto): Promise<User> {
    const isSuperAdmin = RequestContextService.isSuperAdmin();

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

    return await this.userRepo.save(user);
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
}
