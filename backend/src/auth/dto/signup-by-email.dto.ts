import { Transform } from 'class-transformer';
import{
    IsEmail, IsNotEmpty, IsString, MinLength, MaxLength, 
} from 'class-validator';

export class SignupByEmailDto {
    @Transform(({ value }) =>
        typeof value === 'string'
        ? value.trim().toLowerCase()
        : value,
    )
    @IsString({message:'Email must be a string.'})
    @IsNotEmpty({message:'Email is required.'})
    @IsEmail({}, {message:'Invalid email format.'})
    @MaxLength(254, {message:'Email must not exceed 255 characters.'})
    email: string;


    @IsString({message:'Password must be a string.'})
    @IsNotEmpty({message:'Password is required.'})
    @MinLength(8, {message:'Password must be at least 8 characters.'})
    @MaxLength(128, {message:'Password must not exceed 128 characters.'})
    password: string;



    
}