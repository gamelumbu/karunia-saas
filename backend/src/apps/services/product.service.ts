import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/commerce/product.entity';
import { CreateProductDto } from './dto/product/create-product.dto';
import { UpdateProductDto } from './dto/product/update-product.dto';
import { RequestContextService } from '@/common/context/request-context.service';
import { StatusAktif } from '@/common/enum/StatusAktif';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(search = ''): Promise<Product[]> {
    const tenantId = RequestContextService.getTenantId();
    const qb = this.productRepo
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.deleted_at IS NULL')
      .orderBy('product.created_at', 'DESC');

    if (search) {
      qb.andWhere(
        '(product.name ILIKE :search OR product.sku ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.getMany();
  }

  async findOne(id: string): Promise<Product> {
    const tenantId = RequestContextService.getTenantId();
    const product = await this.productRepo.findOne({
      where: { id, tenant_id: tenantId },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const tenantId = RequestContextService.getTenantId();
    const slug = dto.slug || this.toSlug(dto.name);
    await this.ensureUniqueSlug(tenantId, slug);

    const product = this.productRepo.create({
      ...dto,
      slug,
      tenant_id: tenantId,
      active_status: StatusAktif.ACTIVE,
    });

    return this.productRepo.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);
    const nextSlug = dto.slug || (dto.name ? this.toSlug(dto.name) : undefined);

    if (nextSlug && nextSlug !== product.slug) {
      await this.ensureUniqueSlug(product.tenant_id, nextSlug, id);
      product.slug = nextSlug;
    }

    if (dto.name !== undefined) product.name = dto.name;
    if (dto.description !== undefined) product.description = dto.description;
    if (dto.sku !== undefined) product.sku = dto.sku;
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.image_url !== undefined) product.image_url = dto.image_url;

    return this.productRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productRepo.softRemove(product);
  }

  private async ensureUniqueSlug(
    tenantId: string,
    slug: string,
    excludeId?: string,
  ) {
    const qb = this.productRepo
      .createQueryBuilder('product')
      .withDeleted()
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.slug = :slug', { slug });

    if (excludeId) {
      qb.andWhere('product.id != :excludeId', { excludeId });
    }

    const existing = await qb.getOne();
    if (existing) {
      throw new BadRequestException('Product slug already exists');
    }
  }

  private toSlug(value: string): string {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }
}
