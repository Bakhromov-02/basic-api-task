import { ApiProperty } from '@nestjs/swagger';
import { IsJWT } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh token received from signup, login or a previous refresh',
  })
  @IsJWT()
  refreshToken: string;
}
