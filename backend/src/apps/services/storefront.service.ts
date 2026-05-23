import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../entities/commerce/product.entity';
import { Tenant } from '../entities/master/tenant.entity';
import { StatusAktif } from '@/common/enum/StatusAktif';

@Injectable()
export class StorefrontService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findStores(search = '') {
    const qb = this.tenantRepo
      .createQueryBuilder('tenant')
      .where('tenant.deleted_at IS NULL')
      .andWhere('tenant.active_status = :active', {
        active: StatusAktif.ACTIVE,
      })
      .orderBy('tenant.created_at', 'DESC');

    if (search) {
      qb.andWhere(
        '(tenant.name ILIKE :search OR tenant.code ILIKE :search OR tenant.domain ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    return qb.getMany();
  }

  async findAllStores() {
    const stores = await this.findStores();
    const storeIds = stores.map((store) => store.id);

    if (!storeIds.length) {
      return {
        store: {
          id: 'all',
          name: 'Semua toko',
          code: 'all',
          domain: 'all',
          storefront_template: 'market',
          storefront_accent_color: '#111827',
          active_status: StatusAktif.ACTIVE,
        },
        products: [],
        stores,
      };
    }

    const products = await this.productRepo
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.images', 'image')
      .where('product.active_status = :active', {
        active: StatusAktif.ACTIVE,
      })
      .andWhere('product.tenant_id IN (:...storeIds)', { storeIds })
      .orderBy('product.created_at', 'DESC')
      .addOrderBy('image.sort_order', 'ASC')
      .getMany();

    return {
      store: {
        id: 'all',
        name: 'Semua toko',
        code: 'all',
        domain: 'all',
        storefront_template: 'market',
        storefront_accent_color: '#111827',
        storefront_tagline:
          'Belanja produk dari semua toko aktif dalam satu katalog.',
        active_status: StatusAktif.ACTIVE,
      },
      products: this.withImageUrls(products),
      stores,
    };
  }

  async findStore(slug: string) {
    const store = await this.tenantRepo.findOne({
      where: [
        { domain: slug, active_status: StatusAktif.ACTIVE },
        { code: slug, active_status: StatusAktif.ACTIVE },
      ],
    });

    if (!store) {
      throw new NotFoundException('Store not found');
    }

    const products = await this.productRepo.find({
      where: {
        tenant_id: store.id,
        active_status: StatusAktif.ACTIVE,
      },
      relations: { images: true },
      order: { created_at: 'DESC' },
    });

    return { store, products: this.withImageUrls(products) };
  }

  private withImageUrls(products: Product[]) {
    return products.map((product) => {
      const images = [...(product.images || [])].sort(
        (left, right) => left.sort_order - right.sort_order,
      );
      return {
        ...product,
        image_url: product.image_url || images[0]?.url,
        image_urls: images.map((image) => image.url),
      };
    });
  }
}
