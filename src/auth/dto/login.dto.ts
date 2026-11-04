import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { normalizeEmail } from './signup.dto';

export class LoginDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @Transform(normalizeEmail)
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPassw0rd' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  password: string;
}
