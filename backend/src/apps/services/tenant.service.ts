import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tenant } from '../entities/master/tenant.entity';
import { CreateTenantDto } from './dto/tenant/create-tenant.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import {
  applyTenantFilter,
  getCurrentUser,
} from '@/common/helper/tenant.helper';
import { UpdateTenantDto } from './dto/tenant/update-tenant.dto';
import { TenantTypeFilter } from '@/common/enum/TenantTypeFilter';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  private async validateUniqueCode(
    code: string,
    excludeId?: string,
  ): Promise<void> {
    if (!code) return;

    const existing = await this.tenantRepo.findOne({
      where: { code },
      withDeleted: true,
    });

    if (existing && existing.id !== excludeId) {
      if (existing.deleted_at) {
        throw new BadRequestException(
          'Code already used by a deleted tenant. Please restore instead.',
        );
      }

      throw new BadRequestException('Tenant code already exists');
    }
  }

  private async findTenantWithDeleted(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({
      where: { id },
      withDeleted: true,
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }

    return tenant;
  }

  async findAll(
    page = 1,
    limit = 10,
    search = '',
    sortBy: string = 'created_at',
    sortOrder: 'ASC' | 'DESC' = 'DESC',
    type: 'active' | 'deleted' | 'all' = 'active',
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

    if (type === TenantTypeFilter.DELETED) {
      qb.withDeleted().andWhere('tenant.deleted_at IS NOT NULL');
    } else if (type === TenantTypeFilter.ALL) {
      qb.withDeleted();
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

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }

    return tenant;
  }

  async update(id: string, updateTenant: UpdateTenantDto): Promise<Tenant> {
    const tenant = await this.tenantRepo.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }
    if (updateTenant.code && updateTenant.code !== tenant.code) {
      await this.validateUniqueCode(updateTenant.code, id);
    }
    Object.assign(tenant, updateTenant);

    return this.tenantRepo.save(tenant);
  }

  async softDelete(id: string): Promise<void> {
    const result = await this.tenantRepo.softDelete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }
  }

  async restore(id: string): Promise<Tenant> {
    const tenant = await this.findTenantWithDeleted(id);
    if (!tenant.deleted_at) {
      throw new BadRequestException('Tenant is not deleted');
    }

    await this.tenantRepo.restore(id);

    const restored = await this.tenantRepo.findOne({
      where: { id },
    });
    if (!restored) {
      throw new NotFoundException(
        `Tenant with id "${id}" not found after restore`,
      );
    }

    return restored;
  }

  async hardDelete(id: string): Promise<void> {
    const tenant = await this.findTenantWithDeleted(id);

    if (!tenant.deleted_at) {
      throw new BadRequestException(
        'Tenant must be soft deleted before permanent deletion',
      );
    }

    const result = await this.tenantRepo.delete(id);

    if (result.affected === 0) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }
  }
}
