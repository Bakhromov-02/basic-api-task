import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class UserAuthDto {
  @ApiProperty({
    example: 'JohnDoe@gmail.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'JohnDoe123',
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}
