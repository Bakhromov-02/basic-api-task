import { Length, IsEmail, IsString, IsOptional } from 'class-validator';

import { Pagination } from '@common/query-dtos';

export class UserQueryDto extends Pagination {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(3, 50)
  name?: string;
}
