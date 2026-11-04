import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { AuthService } from './auth.service';
import {
  AuthResponseDto,
  LoginDto,
  RefreshTokenDto,
  SignupDto,
  TokensResponseDto,
} from './dto';

import { RefreshTokenGuard } from '@common/guards';
import { ResponseDtoHelper } from '@common/helpers';
import { ApiBearerAuthConst } from '@common/constants';
import { RequestUser, RequestUserWithRefreshToken } from '@common/interfaces';
import { ApiCustomResponse, GetUser, Public } from '@common/decorators';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiCustomResponse(AuthResponseDto)
  @Public()
  @Post('signup')
  signup(@Body() dto: SignupDto): Promise<ResponseDtoHelper<AuthResponseDto>> {
    return this.authService.signup(dto);
  }

  @ApiCustomResponse(AuthResponseDto)
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto): Promise<ResponseDtoHelper<AuthResponseDto>> {
    return this.authService.login(dto);
  }

  @ApiCustomResponse(TokensResponseDto)
  @Public()
  @UseGuards(RefreshTokenGuard)
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(
    // Validated for Swagger docs / shape; the guard reads the token itself.
    @Body() _dto: RefreshTokenDto,
    @GetUser() user: RequestUserWithRefreshToken,
  ): Promise<ResponseDtoHelper<TokensResponseDto>> {
    return this.authService.refresh(user.id, user.refreshToken);
  }

  @ApiBearerAuth(ApiBearerAuthConst)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@GetUser() user: RequestUser): Promise<ResponseDtoHelper<null>> {
    return this.authService.logout(user.id);
  }
}
