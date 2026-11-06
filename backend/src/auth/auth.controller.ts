import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Patch,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';

import type { Response } from 'express';

import { AuthService } from './auth.service.js';
import { SignupByEmailDto } from './dto/signup-by-email.dto.js';
import { LoginByEmailDto } from './dto/login-by-email.dto.js';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto.js';

import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import type { AuthenticatedRequest } from './guards/jwt-auth.guard.js';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService,) {}

    @Post('signup')
    async signupByEmail(@Body(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    ) dto: SignupByEmailDto) {
        return this.authService.signupByEmail(dto);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    async loginByEmail(
        @Body() dto: LoginByEmailDto,
        @Res ({passthrough: true}) response: Response,
    ) {
        const { accessToken, user } = await this.authService.loginByEmail(dto);

        response.cookie('accessToken', accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
            maxAge: 60 * 60 * 1000, // 1 hour
        });

        return {
            message: 'Login successful.',
            user,
        };

    }


    @UseGuards(JwtAuthGuard)
    @Get('me')
    getCurrentUser(@Req() request: AuthenticatedRequest) {
        const user = request.currentUser;

        if(!user){
            throw new UnauthorizedException('User not found.');
        }

        return {
            user,
        };
    }


    @UseGuards(JwtAuthGuard)
    @Patch('me')
    async updateMyProfile(
        @Req() request: AuthenticatedRequest,
        @Body(
            new ValidationPipe({
                transform: true,
                whitelist: true,
                forbidNonWhitelisted: true,
            }),
        )
        dto: UpdateMyProfileDto,
    ) {
        return this.authService.updateMyProfile(
            request.currentUser.id,
            dto,
        );
    }


    @Post('logout')
    @HttpCode(HttpStatus.OK)
    async logout(@Res({ passthrough: true }) response: Response) {

        response.clearCookie('accessToken', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });

        return {
            message: 'Logout successful.',
        };
    }
}

