
import {
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
} from 'class-validator';

export class ListCompaniesQueryDto {
    @IsOptional()
    @IsString()
    @MaxLength(100)
    search?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[1-4](,[1-4])*$/, {
        message:'levels must be comma-separated values from 1 to 4.',
    })
    levels?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[1-9]\d*$/, {
        message: 'page must be a positive integer.',
    })
    page?: string;

    @IsOptional()
    @IsString()
    @Matches(/^[1-9]\d*$/, {
        message: 'pageSize must be a positive integer.',
    })
    pageSize?: string;
}