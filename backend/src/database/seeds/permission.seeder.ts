import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Permission } from '@/apps/entities/master/permission.entity';

type PermissionSeedRow = {
  resource: string;
  action: string;
  description: string;
};

export default class PermissionSeeder implements Seeder {
  private readonly logger = new Logger(PermissionSeeder.name);

  public async run(dataSource: DataSource): Promise<void> {
    try {
      const filePath = path.join(
        process.cwd(),
        'src/database/csv/permission.csv',
      );
      const csvContent = fs.readFileSync(filePath, 'utf-8');

      const records = parse<PermissionSeedRow>(csvContent, {
        delimiter: ';',
        columns: ['resource', 'action', 'description'],
        from_line: 2,
        trim: true,
      });

      const permissionRepository = dataSource.getRepository(Permission);
      this.logger.log('Memulai upload data Permission...');

      let successCount = 0;

      for (const data of records) {
        const existing = await permissionRepository.findOne({
          where: { resource: data.resource, action: data.action },
        });

        if (existing) {
          this.logger.warn(
            `Permission ${data.resource}:${data.action} sudah ada, dilewati.`,
          );
          continue;
        }

        const permission = permissionRepository.create({
          resource: data.resource,
          action: data.action,
          description: data.description,
        });

        await permissionRepository.save(permission);
        successCount++;
      }

      this.logger.log(
        `Data Permission berhasil diupload. Total data masuk: ${successCount}`,
      );
    } catch (error) {
      this.logger.error('Error upload data Permission', error);
      throw error;
    }
  }
}
