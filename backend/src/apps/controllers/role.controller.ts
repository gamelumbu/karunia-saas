import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { PermissionGuard } from '@/common/guard/permission.guard';
import { Permissions } from '@/common/decorator/permission.decorator';
import { RoleService } from '../services/role.service';
import { CreateRoleDto } from '../services/dto/role/create-role.dto';
import { SetRolePermissionsDto } from '../services/dto/role/set-role-permissions.dto';

@UseGuards(JwtAuthGuard, PermissionGuard)
@Controller('role')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Get()
  @Permissions('role.read')
  async findAll() {
    return {
      success: true,
      message: 'Roles retrieved successfully',
      data: await this.roleService.findAll(),
    };
  }

  @Get('permissions')
  @Permissions('role.read')
  async findPermissions() {
    return {
      success: true,
      message: 'Permissions retrieved successfully',
      data: await this.roleService.findPermissions(),
    };
  }

  @Post()
  @Permissions('role.create')
  async create(@Body() dto: CreateRoleDto) {
    return {
      success: true,
      message: 'Role created successfully',
      data: await this.roleService.create(dto),
    };
  }

  @Patch(':id/permissions')
  @Permissions('role.update')
  async setPermissions(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: SetRolePermissionsDto,
  ) {
    return {
      success: true,
      message: 'Role permissions updated successfully',
      data: await this.roleService.setPermissions(id, dto),
    };
  }
}
