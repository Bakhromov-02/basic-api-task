import { IsString, IsOptional, MaxLength } from 'class-validator';

import { Pagination } from '@common/query-dtos';

export class UserQueryDto extends Pagination {
  /** Case-insensitive partial match on email */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  email?: string;

  /** Case-insensitive partial match on name */
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;
}
