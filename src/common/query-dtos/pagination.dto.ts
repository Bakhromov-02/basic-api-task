import { Transform } from 'class-transformer';
import { IsOptional, Max, Min } from 'class-validator';

export class Pagination {
  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @Min(1)
  page?: number;

  @Transform(({ value }) => parseInt(value))
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;
}
