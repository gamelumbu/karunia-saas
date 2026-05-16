import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { defer } from 'rxjs';
import { requestContext } from './request-context';
import type { Request } from 'express';
import type { CurrentUser } from './request-context.service';

type AuthenticatedRequest = Request & {
  user?: CurrentUser;
};

@Injectable()
export class RequestContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    return defer(() =>
      requestContext.run({ user: request.user }, () => next.handle()),
    );
  }
}
