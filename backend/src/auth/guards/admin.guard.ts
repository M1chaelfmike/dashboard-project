import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import type { AuthenticatedRequest } from './jwt-auth.guard.js';

@Injectable()
export class AdminGuard implements CanActivate {
    canActivate(
        context: ExecutionContext,
    ): boolean {
        const request = context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

    const user = request.currentUser;

    if (!user || user.role !== 'ADMIN') {
        throw new ForbiddenException('Administrator access required.');
    }

    return true;
    }
}