import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

export type TenantRepository<T extends ObjectLiteral> = Repository<T> & {
  createScopedQuery: (alias: string) => SelectQueryBuilder<T>;
};