import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class SelectTenantDto {
  @IsNotEmpty({ message: 'tenant_id is required' })
  @IsUUID('4', { message: 'tenant_id must be a valid UUID' })
  @ApiProperty({ example: '' })
  tenant_id: string;
}
