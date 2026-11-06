
import { Transform } from 'class-transformer';

import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

export class CreateUserDto {
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value)

    @IsString()
    @IsNotEmpty()
    @MinLength(2)
    @MaxLength(100)
    name!: string;

    @Transform(({ value }) =>
        typeof value === 'string'
          ? value.trim().toLowerCase()
          : value,
    )
    @IsString()
    @IsEmail()
    @MaxLength(254)
    email!: string;

    @IsString()
    @MinLength(8)
    @MaxLength(128)
    password!: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsIn(['ADMIN', 'MEMBER'])
    role?: 'ADMIN' | 'MEMBER';
}