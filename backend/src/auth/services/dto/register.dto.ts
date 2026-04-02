import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'username is required' })
  @IsString()
  @ApiProperty({ example: ''})
  username: string;

  @IsNotEmpty({ message: 'email is required' })
  @IsEmail({}, { message: 'email is invalid' })
  @ApiProperty({ example: ''})
  email: string;

  @IsNotEmpty({ message: 'password is required' })
  @IsString()
  @ApiProperty({ example: ''})
  password: string;

  @IsNotEmpty({ message: 'tenant_name is required' })
  @IsString()
  @ApiProperty({ example: ''})
  tenant_name: string;
}
