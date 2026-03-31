import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'email tidak boleh kosong' })
  @IsEmail({}, { message: 'email tidak valid' })
  email: string;

  @IsNotEmpty({ message: 'password tidak boleh kosong' })
  @IsString()
  password: string;
}
