import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCompanyDto {
    @IsString()
    @Matches(/^[A-Z0-9_-]{1,32}$/, {
        message: 'Invalid company code format.',
      })
    companyCode: string;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(255)
    companyName: string;

    @IsInt()
    @Min(2)
    @Max(4)
    level: number;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    country: string;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim() : value,
    )
    @IsString()
    @IsNotEmpty()
    @MaxLength(100)
    city: string;

    @IsInt()
    @Min(1)
    @Max(9999)
    foundedYear: number;

    @IsInt()
    @Min(0)
    @Max(2147483647)
    annualRevenue: number;

    @IsInt()
    @Min(0)
    @Max(2147483647)
    employees: number;

    @IsString()
    @Matches(/^[A-Z0-9_-]{1,32}$/)
    parentCompanyCode: string;
}
