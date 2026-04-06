import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { PermissionGuard } from '@/common/guard/permission.guard';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { PaginationUserQueryDto } from '../services/dto/users/pagination-user.dto';
import { PaginatedUserResponseDto } from '../services/dto/users/pagination-response.dto';
import { Permissions } from '@/common/decorator/permission.decorator';
import { User } from '../entities/master/user.entity';
import { CreateUserDto } from '../services/dto/users/create-user.dto';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Permissions('user.read')
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() query: PaginationUserQueryDto,
  ): Promise<PaginatedUserResponseDto<User>> {
    const result = await this.userService.findAll(
      query.page,
      query.limit,
      query.search ?? '',
      query.sortBy ?? 'created_at',
      query.sortOrder ?? 'DESC',
      query.type ?? 'active',
    );

    const totalPages = Math.ceil(result.total / result.limit);

    return {
      success: true,
      message: 'List User successfully retrieved',
      data: result.data,
      pagination: {
        current_page: result.page,
        total_pages: totalPages,
        total_items: result.total,
        limit: result.limit,
      },
    };
  }

  @Post()
  @Permissions('user.create')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createUser: CreateUserDto) {
    const newTenant = await this.userService.create(createUser);

    return {
      success: true,
      message: 'Tenant created successfully',
      data: newTenant,
    };
  }
}
