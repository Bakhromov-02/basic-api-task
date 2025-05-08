import { ApiProperty } from '@nestjs/swagger';

export class ResponseDtoHelper<T> {
  @ApiProperty({ description: 'HTTP status code', example: 200 })
  statusCode: number;

  @ApiProperty({ description: 'Response message', example: 'Success' })
  message: string;

  @ApiProperty({ description: 'Response data', type: () => Object })
  data: T;

  static created<T>(
    data: T,
    message: string = 'Success',
  ): ResponseDtoHelper<T> {
    return {
      statusCode: 201,
      message,
      data,
    };
  }

  static success<T>(
    data: T,
    message: string = 'Success',
  ): ResponseDtoHelper<T> {
    return {
      statusCode: 200,
      message,
      data,
    };
  }

}