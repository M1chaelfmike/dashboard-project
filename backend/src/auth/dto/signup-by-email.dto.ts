import { Transform } from 'class-transformer';
import{
    IsEmail, IsNotEmpty, IsString, MinLength, MaxLength,Matches,
    Min,
} from 'class-validator';

export class SignupByEmailDto {
    @Transform(({ value }) =>
      typeof value === 'string'
        ? value.trim()
        : value,
    )
    @IsString({message:'Email must be a string.'})
    @IsNotEmpty({message:'Email is required.'})
    @IsEmail({}, {message:'Invalid email format.'})
    @MaxLength(254, {message:'Email must not exceed 254 characters.'})
    email: string;


    @IsString({message:'Password must be a string.'})
    @IsNotEmpty({message:'Password is required.'})
    @MinLength(8, {message:'Password must be at least 8 characters.'})
    @MaxLength(128, {message:'Password must not exceed 128 characters.'})
    password: string;

    @Transform(({ value }) =>
      typeof value === 'string'
        ? value.trim()
        : value,
    )
    @IsString()
    @MinLength(2)
    @MaxLength(100)
    @Matches(/\S/, {
      message: 'Name cannot be blank.',
    })
    name!: string;




}
