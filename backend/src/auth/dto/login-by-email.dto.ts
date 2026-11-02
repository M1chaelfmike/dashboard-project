import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

export class LoginByEmailDto {
    @Transform(({ value }) =>
        typeof value === 'string'
        ? value.trim().toLowerCase()
        : value,
    )
    @IsString()
    @IsNotEmpty({ message: 'Email is required.' })
    @IsEmail({}, { message: 'Invalid email format.' })
    @MaxLength(254)
    email: string;

    @IsString()
    @IsNotEmpty({ message: 'Password is required.' })
    @MaxLength(128)
    password: string;
}