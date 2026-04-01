import { User } from '@/apps/entities/master/user.entity';
import { ApiProperty } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  current_page: number;

  @ApiProperty({ example: 10 })
  total_pages: number;

  @ApiProperty({ example: 100 })
  total_items: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

export class PaginatedUserResponseDto<T> {
  success: boolean;
  @ApiProperty({ example: 'List User successfully retrieved' })
  message: string;

  @ApiProperty({ type: () => User, isArray: true })
  data: T[];

  @ApiProperty({ type: PaginationMetaDto })
  pagination: PaginationMetaDto;
}