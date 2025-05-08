import { Body, Controller, Post } from '@nestjs/common';

import { AuthResponseDto, UserAuthDto } from './dto';
import { AuthService } from './auth.service';

import { ApiCustomResponse, Public } from '@common/decorators';
import { ResponseDtoHelper } from '@common/helpers';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiCustomResponse(AuthResponseDto)
  @Public()
  @Post('signup')
  signup(
    @Body() dto: UserAuthDto,
  ): Promise<ResponseDtoHelper<AuthResponseDto>> {
    return this.authService.signup(dto);
  }

  @ApiCustomResponse(AuthResponseDto)
  @Public()
  @Post('login')
  login(@Body() dto: UserAuthDto): Promise<ResponseDtoHelper<AuthResponseDto>> {
    return this.authService.login(dto);
  }
}
