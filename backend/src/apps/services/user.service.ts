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

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  private async validateUniqueUsernameEmail(
    username: string,
    email: string,
    excludeId?: string,
  ): Promise<void> {
    if (!username) return;
    if (!email) return;

    const existing = await this.userRepo.findOne({
      where: { username, email },
      withDeleted: true,
    });

    if (existing && existing.id !== excludeId) {
      if (existing.deleted_at) {
        throw new BadRequestException(
          'Username or Email already used by a deleted user data. Please restore instead.',
        );
      }

      throw new BadRequestException('User code already exists');
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

  //   async create(createUser: CreateUserDto, currentUser: any): Promise<User> {
  //     await this.validateUniqueUsernameEmail(
  //       createUser.username,
  //       createUser.email,
  //     );
  //     const hashedPassword = await bcrypt.hash(createUser.password, 10);

  //     const user = this.userRepo.create({
  //       username: createUser.username,
  //       email: createUser.email,
  //       password: hashedPassword,
  //       tenant_id: currentUser.tenant_id,
  //     });

  //     const savedUser = await this.userRepo.save(user);

  //     // 4. Assign role
  //     await this.userRoleRepo.save({
  //       user_id: savedUser.id,
  //       role_id: createUser.role_id,
  //     });

  //     return savedUser;
  //   }
}
