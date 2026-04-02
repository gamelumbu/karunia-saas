import { StatusAktif } from '@/common/enum/StatusAktif';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTenantDto {
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be string' })
  @ApiProperty({ example: ''})
  name: string;

  @IsNotEmpty({ message: 'code is required' })
  @IsString({ message: 'code must be string' })
  @ApiProperty({ example: ''})
  code: string;

  @IsOptional()
  @IsString({ message: 'domain must be string' })
  @ApiPropertyOptional({ example: ''})
  domain?: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return StatusAktif[value.toUpperCase() as keyof typeof StatusAktif];
    }
    return value;
  })
  @IsEnum(StatusAktif, {
    message: ({ value }) =>
      `active_status "${value}" is invalid. Allowed: ${Object.keys(StatusAktif)
        .filter((k) => isNaN(Number(k)))
        .join(', ')}`,
  })
  @ApiProperty({ example: ''})
  active_status: StatusAktif;
}