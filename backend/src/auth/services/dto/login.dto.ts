import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'invalid email' })
  @ApiProperty({ example: '' })
  email: string;

  @IsNotEmpty({ message: 'password is required' })
  @IsString()
  @ApiProperty({ example: '' })
  password: string;
}
