import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tenant } from '../entities/master/tenant.entity';
import { CreateTenantDto } from './dto/tenant/create-tenant.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateTenantDto } from './dto/tenant/update-tenant.dto';
import { TenantTypeFilter } from '@/common/enum/TenantTypeFilter';
import { RequestContextService } from '@/common/context/request-context.service';
import { Membership } from '../entities/master/membership.entity';
import { Role } from '../entities/master/role.entity';

@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
  ) {}

  private async validateUniqueCode(
    code?: string,
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

  private normalizeSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  private async validateUniqueDomain(
    domain?: string,
    excludeId?: string,
  ): Promise<void> {
    if (!domain) return;

    const existing = await this.tenantRepo.findOne({
      where: { domain },
      withDeleted: true,
    });

    if (existing && existing.id !== excludeId) {
      if (existing.deleted_at) {
        throw new BadRequestException(
          'Domain slug already used by a deleted tenant. Please restore instead.',
        );
      }

      throw new BadRequestException('Domain slug already exists');
    }
  }

  private async findTenantOrFail(id: string): Promise<Tenant> {
    const isSuperAdmin = RequestContextService.isSuperAdmin();
    const currentTenantId = RequestContextService.getTenantId();

    if (!isSuperAdmin && id !== currentTenantId) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }

    const tenant = await this.tenantRepo.findOneBy({ id });

    if (!tenant) {
      throw new NotFoundException(`Tenant with id ${id} not found`);
    }

    return tenant;
  }

  private async findTenantWithDeleted(id: string): Promise<Tenant> {
    const isSuperAdmin = RequestContextService.isSuperAdmin();
    const tenantId = RequestContextService.getTenantId();

    const tenant = await this.tenantRepo.findOne({
      where: isSuperAdmin ? { id } : { id: tenantId },
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
    type: TenantTypeFilter = TenantTypeFilter.ACTIVE,
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
    const qb = this.tenantRepo.createQueryBuilder('tenant');
    const isSuperAdmin = RequestContextService.isSuperAdmin();

    if (!isSuperAdmin) {
      qb.andWhere('tenant.id = :tenantId', {
        tenantId: RequestContextService.getTenantId(),
      });
    }

    if (type === TenantTypeFilter.DELETED) {
      qb.withDeleted().andWhere('tenant.deleted_at IS NOT NULL');
    } else if (type === TenantTypeFilter.ALL) {
      qb.withDeleted();
    }

    if (search) {
      const fields = ['tenant.name', 'tenant.code', 'tenant.domain'];
      qb.andWhere(
        `(
          ${fields.map((f) => `${f} ILIKE :search`).join(' OR ')}
        )`,
        { search: `%${search}%` },
      );
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
    createTenant.code = this.normalizeSlug(createTenant.code);
    createTenant.domain = this.normalizeSlug(
      createTenant.domain || createTenant.code || createTenant.name,
    );

    await this.validateUniqueCode(createTenant.code);
    await this.validateUniqueDomain(createTenant.domain);

    return this.tenantRepo.manager.transaction(async (manager) => {
      const tenant = manager.create(Tenant, {
        ...createTenant,
        storefront_template: createTenant.storefront_template || 'market',
        storefront_accent_color:
          createTenant.storefront_accent_color || '#0891b2',
      });
      const savedTenant = await manager.save(tenant);

      if (!RequestContextService.isSuperAdmin()) {
        const ownerRole = await this.getOrCreateOwnerRole(
          manager,
          savedTenant.id,
        );

        await manager.save(
          manager.create(Membership, {
            user_id: RequestContextService.getUserId(),
            tenant_id: savedTenant.id,
            role_id: ownerRole.id,
          }),
        );
      }

      return savedTenant;
    });
  }

  async findOne(id: string): Promise<Tenant> {
    return this.findTenantOrFail(id);
  }

  async update(id: string, updateTenant: UpdateTenantDto): Promise<Tenant> {
    const isSuperAdmin = RequestContextService.isSuperAdmin();

    const tenant = await this.findTenantOrFail(id);

    if (updateTenant.code) {
      updateTenant.code = this.normalizeSlug(updateTenant.code);
      await this.validateUniqueCode(updateTenant.code, id);
    }

    if (updateTenant.domain) {
      updateTenant.domain = this.normalizeSlug(updateTenant.domain);
      await this.validateUniqueDomain(updateTenant.domain, id);
    }

    if (updateTenant.name) tenant.name = updateTenant.name;
    if (updateTenant.code && isSuperAdmin) tenant.code = updateTenant.code;
    if (updateTenant.domain) tenant.domain = updateTenant.domain;
    if (updateTenant.storefront_template) {
      tenant.storefront_template = updateTenant.storefront_template;
    }
    if (updateTenant.storefront_accent_color) {
      tenant.storefront_accent_color = updateTenant.storefront_accent_color;
    }
    if (updateTenant.active_status && isSuperAdmin) {
      tenant.active_status = updateTenant.active_status;
    }

    return this.tenantRepo.save(tenant);
  }

  async softDelete(id: string): Promise<void> {
    const tenant = await this.findTenantOrFail(id);

    if (tenant.deleted_at) {
      throw new BadRequestException(`Tenant with ${id} already deleted`);
    }

    await this.tenantRepo.softRemove(tenant);
  }

  async restore(id: string): Promise<Tenant> {
    const tenant = await this.findTenantWithDeleted(id);
    if (!tenant.deleted_at) {
      throw new BadRequestException('Tenant is not deleted');
    }

    await this.tenantRepo.restore(tenant.id);
    return tenant;
  }

  async hardDelete(id: string): Promise<void> {
    const tenant = await this.findTenantWithDeleted(id);

    if (!tenant.deleted_at) {
      throw new BadRequestException(
        'Tenant must be soft deleted before permanent deletion',
      );
    }

    await this.tenantRepo.delete(tenant.id);
  }

  private async getOrCreateOwnerRole(
    manager: Repository<Tenant>['manager'],
    tenantId: string,
  ): Promise<Role> {
    const existing = await manager.findOne(Role, {
      where: { name: 'OWNER', tenant_id: tenantId },
    });

    if (existing) {
      return existing;
    }

    return manager.save(
      manager.create(Role, {
        name: 'OWNER',
        description: 'Pemilik tenant dengan akses penuh ke data tenant',
        tenant_id: tenantId,
      }),
    );
  }
}
