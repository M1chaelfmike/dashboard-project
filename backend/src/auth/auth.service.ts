
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';

import { UsersService } from '../users/users.service.js';
import { SignupByEmailDto } from './dto/signup-by-email.dto.js';
import { LoginByEmailDto } from './dto/login-by-email.dto.js';
import { UpdateMyProfileDto } from './dto/update-my-profile.dto.js';

function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    error.code === 'P2002'
  );
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signupByEmail(dto: SignupByEmailDto) {
    const email = dto.email.trim().toLowerCase();
    const name = dto.name.trim();

    // 1. Check duplicate email
    const existingUser =
      await this.userService.findByEmail(email);

    if (existingUser) {
      throw new ConflictException(
        'Email already exists.',
      );
    }

    // 2. Hash password using Argon2id
    const passwordHash = await argon2.hash(
      dto.password,
      {
        type: argon2.argon2id,
      },
    );

    // 3. Create a pending user
    try {
      const user = await this.userService.createByEmail(
        name,
        email,
        passwordHash,
      );

      return {
        message:
          'Registration submitted. Awaiting administrator approval.',
        user,
      };
    } catch (error: unknown) {
      if (isUniqueConstraintError(error)) {
        throw new ConflictException(
          'Email already exists.',
        );
      }

      throw error;
    }
  }

  async loginByEmail(dto: LoginByEmailDto) {
    const email = dto.email.trim().toLowerCase();

    // 1. Find user
    const user = await this.userService.findByEmail(
      email,
    );

    if (!user) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    // 2. Verify password
    const isPasswordValid = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        'Invalid email or password.',
      );
    }

    // 3. Check account status
    if (user.status !== 'ACTIVE') {
      throw new ForbiddenException(
        'Account is not active. Please contact an administrator.',
      );
    }

    // 4. Generate JWT containing user ID
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
    });

    // 5. Return safe profile
    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  }

  async updateMyProfile(
      userId: string,
      dto: UpdateMyProfileDto,
  ) {
      const name = dto.name.trim();
      const email = dto.email.trim().toLowerCase();

      try {
          const user = await this.userService.updateMyProfile(
              userId,
              name,
              email,
          );

          return {
              message: 'Profile updated successfully.',
              user,
          };
      } catch (error: unknown) {
          if (isUniqueConstraintError(error)) {
              throw new ConflictException(
                  'Email address is already in use.',
              );
          }

          throw error;
      }
  }

}
