import { StatusAktif } from '@/common/enum/StatusAktif';
import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateUserDto {
  @IsNotEmpty({ message: 'username is required' })
  @IsString({ message: 'username must be string' })
  username: string;

  @IsNotEmpty({ message: 'email is required' })
  @IsString({ message: 'email must be string' })
  email: string;

  @IsNotEmpty({ message: 'password is required' })
  @IsString({ message: 'password must be string' })
  password?: string;

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

  @IsNotEmpty({ message: 'tenant_id is required'})
  @IsUUID('4', { message: 'tenant_id harus berupa UUID yang valid' })
  tenant_id: string;
}