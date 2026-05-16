import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { CurrentUser } from '../context/request-context.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest<TUser = CurrentUser>(
    err: Error | null,
    user: TUser | false,
    info: Error | null,
    context: ExecutionContext,
  ): TUser {
    void context;

    if (err || !user) {
      throw err ?? new UnauthorizedException(info?.message ?? 'Unauthorized');
    }

    return user;
  }
}
