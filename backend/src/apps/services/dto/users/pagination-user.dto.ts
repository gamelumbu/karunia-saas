import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, IsIn, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { UserTypeFilter } from '@/common/enum/UserTypeFilter';

export class PaginationUserQueryDto {
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
    enum: UserTypeFilter,
    default: UserTypeFilter.ACTIVE,
  })
  @IsOptional()
  @IsEnum(UserTypeFilter)
  type?: UserTypeFilter;
}
