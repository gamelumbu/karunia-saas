import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Tenant } from '../entities/master/tenant.entity';
import { CreateTenantDto } from './dto/tenant/create-tenant.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  applyTenantFilter,
  getCurrentUser,
} from '@/common/helper/tenant.helper';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  private async validateUniqueCode(code: string): Promise<void> {
    const existing = await this.tenantRepo.findOne({
      where: { code },
    });

    if (existing) {
      throw new BadRequestException('Tenant code already exists');
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    search = '',
    sortBy: string = 'created_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
  ): Promise<{
    data: Tenant[];
    total: number;
    page: number;
    limit: number;
  }> {
    const allowedSort = ['created_at', 'name'];

    if (!allowedSort.includes(sortBy)) {
      sortBy = 'created_at';
    }

    const user = getCurrentUser();
    if (!user) {
      throw new ForbiddenException('Unauthorized');
    }

    const qb = this.tenantRepo.createQueryBuilder('tenant');

    if (!user.roles?.includes('super_admin')) {
      qb.where('tenant.id = :tenantId', {
        tenantId: user.tenant_id,
      });
    }

    if (search) {
      qb.andWhere('LOWER(tenant.name) LIKE LOWER(:search)', {
        search: `%${search}%`,
      });
    }

    qb.orderBy(`tenant.${sortBy}`, sortOrder);
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    return {
      data,
      total,
      page,
      limit,
    };
  }

  async create(createTenant: CreateTenantDto): Promise<Tenant> {
    await this.validateUniqueCode(createTenant.code);

    const tenant = this.tenantRepo.create(createTenant);
    return this.tenantRepo.save(tenant);
  }
}
