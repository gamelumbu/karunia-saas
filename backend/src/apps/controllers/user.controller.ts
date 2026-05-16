import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { PermissionGuard } from '@/common/guard/permission.guard';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
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
import { UpdateUserDto } from '../services/dto/users/update-user.dto';
import { UserTypeFilter } from '@/common/enum/UserTypeFilter';

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
      query.type ?? UserTypeFilter.ACTIVE,
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
    const newUser = await this.userService.create(createUser);

    return {
      success: true,
      message: 'User created successfully',
      data: newUser,
    };
  }

  @Get(':id')
  @Permissions('user.read')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    const user = await this.userService.findOne(id);
    return {
      success: true,
      message: 'User retrieved successfully',
      data: user,
    };
  }

  @Patch(':id')
  @Permissions('user.update')
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() userUpdate: UpdateUserDto,
  ) {
    const updated = await this.userService.update(id, userUpdate);

    return {
      success: true,
      message: 'Users updated successfully',
      data: updated,
    };
  }

  @Delete(':id')
  @Permissions('user.delete')
  async softDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.userService.softDelete(id);

    return {
      success: true,
      message: 'User deleted successfully',
    };
  }

  @Patch(':id/restore')
  @Permissions('user.restore')
  async restore(@Param('id', new ParseUUIDPipe()) id: string) {
    const restored = await this.userService.restore(id);

    return {
      success: true,
      message: 'User restored successfully',
      data: restored,
    };
  }

  @Delete('permanent/:id')
  @Permissions('user.delete')
  async hardDelete(@Param('id', new ParseUUIDPipe()) id: string) {
    await this.userService.hardDelete(id);

    return {
      success: true,
      message: 'User permanent deleted successfully',
    };
  }
}
