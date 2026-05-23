import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateOrderItemDto {
  @ApiProperty({ example: '' })
  @IsUUID('4')
  product_id: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'Budi' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(255)
  customer_name: string;

  @ApiProperty({ example: 'budi@example.com' })
  @IsEmail()
  @MaxLength(255)
  customer_email: string;

  @ApiPropertyOptional({ example: '08123456789' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  customer_phone?: string;

  @ApiProperty({ example: 'Jl. Merdeka No. 1, Jakarta' })
  @IsNotEmpty()
  @IsString()
  shipping_address: string;

  @ApiPropertyOptional({ example: 'DKI Jakarta' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shipping_province?: string;

  @ApiPropertyOptional({ example: 'Jakarta Selatan' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shipping_city?: string;

  @ApiPropertyOptional({ example: 'Kebayoran Baru' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  shipping_district?: string;

  @ApiPropertyOptional({ example: '12110' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  shipping_postal_code?: string;

  @ApiPropertyOptional({ example: 'REGULER' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  shipping_method?: string;

  @ApiPropertyOptional({ example: 'COD' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  payment_method?: string;

  @ApiProperty({ type: [CreateOrderItemDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
