import * as dotenv from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';
import { SeederOptions } from 'typeorm-extension';

dotenv.config({
  path: '.env.local',
});
export const dataSourceOptions: DataSourceOptions & SeederOptions = {
  type: 'postgres',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  username: process.env.DB_USERNAME,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  entities: ['dist/**/*.entity.js'],
  migrations: ['dist/database/migrations/*.js'],
  seeds: ['dist/database/seeds/*.js'],
  factories: ['dist/database/factories/*.js'],
  seedTracking: false,
  synchronize: process.env.DB_SYNCHRONIZE === 'true',
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource;
