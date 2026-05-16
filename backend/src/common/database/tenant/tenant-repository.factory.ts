import { DataSource, EntityTarget, ObjectLiteral, Repository } from 'typeorm';
import { applyTenantScope } from './tenant-scope';
import { TenantRepository } from './tenant-repository.type';

type NamedEntityTarget<T extends ObjectLiteral> = EntityTarget<T> & {
  name?: string;
};

export function createTenantRepositoryProvider<T extends ObjectLiteral>(
  entity: NamedEntityTarget<T>,
) {
  const token = `${entity.name?.toUpperCase() ?? 'ENTITY'}_REPOSITORY`;

  return {
    provide: token,
    useFactory: (dataSource: DataSource) => {
      return dataSource.getRepository<T>(entity).extend({
        createScopedQuery(this: Repository<T>, alias: string) {
          return applyTenantScope(this.createQueryBuilder(alias), alias);
        },
      }) as TenantRepository<T>;
    },
    inject: [DataSource],
  };
}
