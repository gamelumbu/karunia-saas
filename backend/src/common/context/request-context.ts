import { AsyncLocalStorage } from 'async_hooks';
import type { CurrentUser } from './request-context.service';

export type RequestContextStore = {
  user?: CurrentUser;
};

export const requestContext = new AsyncLocalStorage<RequestContextStore>();
