import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class SelectTenantDto {
  @IsNotEmpty({ message: 'user_id is required' })
  @IsString()
  @ApiProperty({ example: '' })
  user_id: string;

  @IsNotEmpty({ message: 'tenant_id is required' })
  @IsString()
  @ApiProperty({ example: '' })
  tenant_id: string;
}
