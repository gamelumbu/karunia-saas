import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductImage } from '../entities/commerce/product-image.entity';
import { Product, ProductCategory } from '../entities/commerce/product.entity';
import { CreateProductDto } from './dto/product/create-product.dto';
import { UpdateProductDto } from './dto/product/update-product.dto';
import { RequestContextService } from '@/common/context/request-context.service';
import { StatusAktif } from '@/common/enum/StatusAktif';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepo: Repository<ProductImage>,
  ) {}

  async findAll(search = ''): Promise<Product[]> {
    const tenantId = RequestContextService.getTenantId();
    const qb = this.productRepo
      .createQueryBuilder('product')
      .where('product.tenant_id = :tenantId', { tenantId })
      .andWhere('product.deleted_at IS NULL')
      .leftJoinAndSelect('product.images', 'image')
      .orderBy('product.created_at', 'DESC');

    if (search) {
      qb.andWhere('(product.name ILIKE :search OR product.sku ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    qb.addOrderBy('image.sort_order', 'ASC');

    return this.withImageUrls(await qb.getMany());
  }

  async findOne(id: string): Promise<Product> {
    const tenantId = RequestContextService.getTenantId();
    const product = await this.productRepo.findOne({
      where: { id, tenant_id: tenantId },
      relations: { images: true },
      order: { images: { sort_order: 'ASC' } },
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return this.withImageUrls(product);
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const tenantId = RequestContextService.getTenantId();
    const slug = dto.slug || this.toSlug(dto.name);
    await this.ensureUniqueSlug(tenantId, slug);

    const product = this.productRepo.create({
      name: dto.name,
      description: dto.description,
      sku: dto.sku,
      price: dto.price,
      stock: dto.stock,
      slug,
      tenant_id: tenantId,
      category: dto.category || ProductCategory.PRODUCT,
      related_product_ids: dto.related_product_ids || [],
      image_url: dto.image_url || dto.image_urls?.[0],
      active_status: StatusAktif.ACTIVE,
    });

    const savedProduct = await this.productRepo.save(product);
    await this.syncImages(savedProduct, dto.image_urls, dto.image_url);
    return this.findOne(savedProduct.id);
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
    if (dto.category !== undefined) product.category = dto.category;
    if (dto.related_product_ids !== undefined) {
      product.related_product_ids = dto.related_product_ids;
    }
    if (dto.price !== undefined) product.price = dto.price;
    if (dto.stock !== undefined) product.stock = dto.stock;
    if (dto.image_urls !== undefined) {
      const imageUrls = this.normalizeImageUrls(dto.image_urls, dto.image_url);
      product.image_url = dto.image_url || imageUrls[0];
    } else if (dto.image_url !== undefined) {
      product.image_url = dto.image_url;
    }

    const savedProduct = await this.productRepo.save(product);
    if (dto.image_urls !== undefined || dto.image_url !== undefined) {
      await this.syncImages(savedProduct, dto.image_urls, dto.image_url);
    }

    return this.findOne(savedProduct.id);
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

  private normalizeImageUrls(imageUrls?: string[], primaryImageUrl?: string) {
    const urls = [primaryImageUrl, ...(imageUrls || [])]
      .filter((value): value is string => Boolean(value?.trim()))
      .map((value) => value.trim());

    return Array.from(new Set(urls));
  }

  private async syncImages(
    product: Product,
    imageUrls?: string[],
    primaryImageUrl?: string,
  ) {
    const urls = this.normalizeImageUrls(imageUrls, primaryImageUrl);
    await this.productImageRepo.delete({ product_id: product.id });

    if (!urls.length) return;

    await this.productImageRepo.save(
      urls.map((url, index) =>
        this.productImageRepo.create({
          product_id: product.id,
          url,
          filename: url.split('/').pop(),
          sort_order: index,
        }),
      ),
    );
  }

  private withImageUrls<T extends Product | Product[]>(product: T): T {
    const rows = Array.isArray(product) ? product : [product];
    rows.forEach((row) => {
      const images = [...(row.images || [])].sort(
        (left, right) => left.sort_order - right.sort_order,
      );
      (row as Product & { image_urls: string[] }).image_urls = images.map(
        (image) => image.url,
      );
      if (!row.image_url && images[0]) {
        row.image_url = images[0].url;
      }
    });

    return product;
  }
}
