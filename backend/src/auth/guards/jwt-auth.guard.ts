import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { isUUID } from 'class-validator';
import type { Request } from 'express';

import { UsersService } from '../../users/users.service.js';

type AuthenicateUser = NonNullable<
    Awaited<ReturnType<UsersService['findById']>>
>;

export type AuthenticatedRequest = Request & {
    currentUser: AuthenicateUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
    constructor(
        private readonly jwtService: JwtService,
        private readonly usersService: UsersService,
    ) {}

    async canActivate(
        context: ExecutionContext,
    ): Promise<boolean> {
        const request = context
        .switchToHttp()
        .getRequest<AuthenticatedRequest>();

        const token: unknown = request.cookies?.accessToken;
        
        if(typeof token !== 'string'){
            throw new UnauthorizedException('Authentication required.',);
        }

        let payload: {sub?:unknown};

        try{
            payload = await this.jwtService.verifyAsync<{
            sub?: unknown;}
            >(token,{
                algorithms: ['HS256'],
            });

        } catch (error) {
            throw new UnauthorizedException('Invalid or expired token.',);
        }

        if(typeof payload?.sub !== 'string' || !isUUID(payload.sub)){
            throw new UnauthorizedException('Invalid authentication token.',);
        }

        const user = await this.usersService.findById(payload.sub);

        if(!user){
            throw new UnauthorizedException('User not found.',);
        }

        request.currentUser = user;

        return true;
    }

}