import { StatusAktif } from '@/common/enum/StatusAktif';
import {
  IsEnum,
  IsHexColor,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be string' })
  @ApiProperty({ example: '' })
  name: string;

  @IsNotEmpty({ message: 'code is required' })
  @IsString({ message: 'code must be string' })
  @ApiProperty({ example: '' })
  code: string;

  @IsOptional()
  @IsString({ message: 'domain must be string' })
  @MaxLength(255)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message:
      'domain must be a URL slug, for example buku-bahagia or toko-kopi',
  })
  @ApiPropertyOptional({ example: 'buku-bahagia' })
  domain?: string;

  @IsOptional()
  @IsString()
  @IsIn(['market', 'editorial', 'compact'])
  @ApiPropertyOptional({ example: 'market', enum: ['market', 'editorial', 'compact'] })
  storefront_template?: string;

  @IsOptional()
  @IsHexColor()
  @ApiPropertyOptional({ example: '#0891b2' })
  storefront_accent_color?: string;

  @Transform(({ value }: { value: unknown }) => {
    if (typeof value === 'string') {
      return StatusAktif[value.toUpperCase() as keyof typeof StatusAktif];
    }
    return value as StatusAktif;
  })
  @IsEnum(StatusAktif, {
    message: ({ value }) =>
      `active_status "${value}" is invalid. Allowed: ${Object.keys(StatusAktif)
        .filter((k) => isNaN(Number(k)))
        .join(', ')}`,
  })
  @ApiPropertyOptional({ example: '' })
  @IsOptional()
  active_status: StatusAktif;
}
