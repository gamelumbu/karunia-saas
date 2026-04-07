import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { applyTenantScope } from './tenant-scope';

export function createTenantRepositoryProvider<T extends ObjectLiteral>(
  entity: EntityTarget<T>,
) {
  const token = `${(entity as any).name.toUpperCase()}_REPOSITORY`;

  return {
    provide: token,
    useFactory: (dataSource: DataSource) => {
      return dataSource.getRepository<T>(entity).extend({
        createScopedQuery(alias: string) {
          return applyTenantScope(
            this.createQueryBuilder(alias),
            alias,
          );
        },
      });
    },
    inject: [DataSource],
  };
}