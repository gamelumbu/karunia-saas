import { StatusAktif } from '@/common/enum/StatusAktif';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateTenantDto {
  @IsNotEmpty({ message: 'name is required' })
  @IsString({ message: 'name must be string' })
  name: string;

  @IsNotEmpty({ message: 'code is required' })
  @IsString({ message: 'code must be string' })
  code: string;

  @IsOptional()
  @IsString({ message: 'domain must be string' })
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
  active_status: StatusAktif;
}