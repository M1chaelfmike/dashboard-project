import {
  IsInt,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

export class UpdateCompanyDto {
    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @Matches(/\S/, { message: 'Company name cannot be blank.' })
    @MaxLength(255)
    companyName?: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsInt()
    @Min(2)
    @Max(4)
    level?: number;

    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @Matches(/\S/, { message: 'Country cannot be blank.' })
    @MaxLength(100)
    country?: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @Matches(/\S/, { message: 'City cannot be blank.' })
    @MaxLength(100)
    city?: string;

    @ValidateIf((_, value) => value !== undefined)
    @IsInt()
    @Min(1)
    @Max(9999)
    foundedYear?: number;

    @ValidateIf((_, value) => value !== undefined)
    @IsInt()
    @Min(0)
    @Max(2147483647)
    annualRevenue?: number;

    @ValidateIf((_, value) => value !== undefined)
    @IsInt()
    @Min(0)
    @Max(2147483647)
    employees?: number;

    @ValidateIf((_, value) => value !== undefined)
    @IsString()
    @Matches(/^[A-Z0-9_-]{1,32}$/)
    parentCompanyCode?: string;
}