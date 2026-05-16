import * as path from 'path';
import * as fs from 'fs';
import { parse } from 'csv-parse/sync';
import { Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Seeder } from 'typeorm-extension';
import { Role } from '@/apps/entities/master/role.entity';

type RoleSeedRow = {
  name: string;
  description: string;
};

export default class RoleSeeder implements Seeder {
  private readonly logger = new Logger(RoleSeeder.name);

  public async run(dataSource: DataSource): Promise<void> {
    try {
      const filePath = path.join(process.cwd(), 'src/database/csv/role.csv');
      const csvContent = fs.readFileSync(filePath, 'utf-8');

      const records = parse<RoleSeedRow>(csvContent, {
        delimiter: ';',
        columns: ['name', 'description'],
        from_line: 2,
        trim: true,
      });

      const roleRepository = dataSource.getRepository(Role);
      this.logger.log('Memulai upload data Role...');

      let successCount = 0;

      for (const data of records) {
        const existing = await roleRepository.findOne({
          where: { name: data.name, description: data.description },
        });

        if (existing) {
          this.logger.warn(
            `Role ${data.name}:${data.description} sudah ada, dilewati.`,
          );
          continue;
        }

        const role = roleRepository.create({
          name: data.name,
          description: data.description,
        });

        await roleRepository.save(role);
        successCount++;
      }

      this.logger.log(
        `Data Role berhasil diupload. Total data masuk: ${successCount}`,
      );
    } catch (error) {
      this.logger.error('Error upload data Role', error);
      throw error;
    }
  }
}
