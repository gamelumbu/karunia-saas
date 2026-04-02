import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'email tidak boleh kosong' })
  @IsEmail({}, { message: 'email tidak valid' })
  @ApiProperty({ example: '' })
  email: string;

  @IsNotEmpty({ message: 'password tidak boleh kosong' })
  @IsString()
  @ApiProperty({ example: '' })
  password: string;
}
