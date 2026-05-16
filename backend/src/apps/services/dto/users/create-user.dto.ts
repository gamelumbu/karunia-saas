import { StatusAktif } from '@/common/enum/StatusAktif';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @IsNotEmpty({ message: 'username is required' })
  @IsString({ message: 'username must be string' })
  @ApiProperty({ example: '' })
  username: string;

  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email is invalid' })
  @ApiProperty({ example: '' })
  email: string;

  @IsNotEmpty({ message: 'password is required' })
  @IsString({ message: 'password must be string' })
  @ApiProperty({ example: '' })
  password: string;

  @IsOptional()
  @IsUUID('4', { message: 'role_id must be a valid UUID' })
  @ApiPropertyOptional({ example: '' })
  role_id?: string;

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

  @IsOptional()
  @IsUUID('4', { message: 'tenant_id must be a valid UUID' })
  tenant_id?: string;
}
