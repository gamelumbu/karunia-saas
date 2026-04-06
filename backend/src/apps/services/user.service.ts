import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { User } from '../entities/master/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UserTypeFilter } from '@/common/enum/UserTypeFilter';
import { CreateUserDto } from './dto/users/create-user.dto';
import { TenantScopeHelper } from '@/common/helper/tenant-scope.helper';
import * as bcrypt from 'bcrypt';
import { RequestContextService } from '@/common/context/request-context.service';
import { UpdateUserDto } from './dto/users/update-user.dto';
import { Tenant } from '../entities/master/tenant.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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
        .createQueryBuilder('user')
        .withDeleted()
        .where('user.username = :username', { username })
        .andWhere('user.tenant_id = :tenantId', { tenantId })
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
        .createQueryBuilder('user')
        .withDeleted()
        .where('user.email = :email', { email })
        .andWhere('user.tenant_id = :tenantId', { tenantId })
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

  private async findUserWithDeleted(id: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }

    return user;
  }

  private async findUserOrFail(id: string): Promise<User> {
    const isSuperAdmin = RequestContextService.isSuperAdmin();
    const tenantId = RequestContextService.getTenantId();

    const user = await this.userRepo.findOne({
      where: isSuperAdmin ? { id } : { id, tenant_id: tenantId },
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
      where: isSuperAdmin ? { id } : { id, tenant_id: tenantId },
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
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    limit: number;
  }> {
    const allowedSort = ['created_at', 'name'];
    if (!allowedSort.includes(sortBy)) {
      sortBy = 'created_at';
    }

    const qb = this.userRepo.createQueryBuilder('user');
    TenantScopeHelper.apply(qb, 'user');
    if (type === UserTypeFilter.DELETED) {
      qb.withDeleted().andWhere('user.deleted_at IS NOT NULL');
    } else if (type === UserTypeFilter.ALL) {
      qb.withDeleted();
    }

    if (search) {
      qb.andWhere(`(user.username ILIKE :search OR user.email ILIKE :search)`, {
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
    const { username, email, password } = createUser;

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

    const user = this.userRepo.create({
      username: createUser.username,
      email: createUser.email,
      password: hashedPassword,
      active_status: createUser.active_status,
      tenant_id: tenantId,
    });

    return await this.userRepo.save(user);
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
    if (updateUser.tenant_id && isSuperAdmin) {
      user.tenant_id = updateUser.tenant_id;
    }

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
