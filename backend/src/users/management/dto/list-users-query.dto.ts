
import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class ListUsersQueryDto {
  // Search by user name
  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string;

  // Multi-select roles
  @IsOptional()
  @IsString()
  @Matches(/^(ADMIN|MEMBER)(,(ADMIN|MEMBER))*$/, {
    message: 'Invalid roles format.',
  })
  roles?: string;

  // Multi-select account statuses
  @IsOptional()
  @IsString()
  @Matches(
    /^(PENDING_APPROVAL|ACTIVE|SUSPENDED|REJECTED)(,(PENDING_APPROVAL|ACTIVE|SUSPENDED|REJECTED))*$/,
    {
      message: 'Invalid statuses format.',
    },
  )
  statuses?: string;

  // Page number
  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/, {
    message: 'page must be a positive integer.',
  })
  page?: string;

  // Page size
  @IsOptional()
  @IsString()
  @Matches(/^[1-9]\d*$/, {
    message: 'pageSize must be a positive integer.',
  })
  pageSize?: string;
}
