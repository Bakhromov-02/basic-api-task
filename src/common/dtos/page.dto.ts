import { ApiProperty } from '@nestjs/swagger';

export class PageDto<T> {
  @ApiProperty({
    description: 'Array of items',
    type: () => Object,
    isArray: true,
  })
  data: T[];

  @ApiProperty({ description: 'Current page number', example: 1 })
  currentPage: number;

  @ApiProperty({ description: 'Total number of items', example: 5 })
  totalPages: number;
}