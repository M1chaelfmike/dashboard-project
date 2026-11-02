import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import argon2 from 'argon2';

import { UsersService } from '../users/users.service.js';
import { SignupByEmailDto } from './dto/signup-by-email.dto.js';
import { LoginByEmailDto } from './dto/login-by-email.dto.js';
function isUniqueConstraintError(error: unknown):boolean{
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
    ){}

    async signupByEmail(dto: SignupByEmailDto){
        const existingUser = await this.userService.findByEmail(
            dto.email
        );

        if(existingUser){
            throw new ConflictException('Email already exsists.');
        }

        const passwordHash = await argon2.hash(dto.password,{
            type: argon2.argon2id,
        });

        try{
            const user = await this.userService.createByEmail(
                dto.email,
                passwordHash,
            );

            return{
                message: 'Registration successful.',
                user,
                };
        }catch(error){
            if(isUniqueConstraintError(error)){
                throw new ConflictException('Email already exists.');
            }
            throw error;
        }
    }   

    async loginByEmail(dto: SignupByEmailDto){
        const user = await this.userService.findByEmail(dto.email);

        if(!user){
            throw new ConflictException('Invalid email or password.');
        }

        const isPasswordValid = await argon2.verify(user.passwordHash, dto.password);

        if(!isPasswordValid){
            throw new ConflictException('Invalid email or password.');
        }

        const accessToken = await this.jwtService.signAsync({
             sub: user.id,
        });

        return {
            accessToken,
            user:{
                id: user.id,
                email: user.email,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
            }
        };

    }

}
