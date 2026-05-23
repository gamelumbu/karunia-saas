import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginDto } from '../services/dto/login.dto';
import { JwtAuthGuard } from '@/common/guard/jwt.guard';
import { RegisterDto } from '../services/dto/register.dto';
import { SelectTenantDto } from '../services/dto/select-tenant.dto';
import type { CurrentUser } from '@/common/context/request-context.service';

type AuthenticatedRequest = Express.Request & {
  user: CurrentUser;
};

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('select-tenant')
  @UseGuards(JwtAuthGuard)
  selectTenant(@Req() req: AuthenticatedRequest, @Body() dto: SelectTenantDto) {
    return this.authService.selectTenant(req.user, dto.tenant_id);
  }

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getProfile(@Req() req: Express.Request) {
    return req.user;
  }

  @Get('tenants')
  @UseGuards(JwtAuthGuard)
  getTenants(@Req() req: AuthenticatedRequest) {
    return this.authService.getUserTenants(req.user.id);
  }
}
