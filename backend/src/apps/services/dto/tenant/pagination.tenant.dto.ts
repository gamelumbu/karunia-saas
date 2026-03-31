import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { TenantTypeFilter } from '@/common/enum/TenantTypeFilter';

export class PaginationTenantQueryDto {
  @ApiPropertyOptional({ description: 'Halaman saat ini' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Jumlah item per halaman' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({
    description: 'Kata kunci pencarian',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Kolom untuk sorting',
    example: '',
  })
  @IsOptional()
  @IsString()
  sortBy?: string;

  @ApiPropertyOptional({
    description: 'Arah sorting',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsIn(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Filter data type',
    enum: TenantTypeFilter,
    default: TenantTypeFilter.ACTIVE,
  })
  @IsOptional()
  @IsEnum(TenantTypeFilter)
  type?: TenantTypeFilter;
}
