import { createHash, randomUUID, timingSafeEqual } from 'crypto';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Tokens } from './types';
import { AuthResponseDto, LoginDto, SignupDto, TokensResponseDto } from './dto';

import { UsersService } from '../users/users.service';

import { HashHelper, ResponseDtoHelper } from '@common/helpers';

const sha256 = (value: string) =>
  createHash('sha256').update(value).digest('hex');

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
};

@Injectable()
export class AuthService {
  // Used to keep login timing the same whether or not the email exists.
  private dummyHash?: Promise<string>;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly usersService: UsersService,
  ) {}

  async signup(dto: SignupDto): Promise<ResponseDtoHelper<AuthResponseDto>> {
    if (await this.usersService.getOneByEmail(dto.email)) {
      throw new ConflictException('Email is already registered');
    }

    const user = await this.usersService.create(dto);
    const tokens = await this.issueTokens(user.id);

    return ResponseDtoHelper.created({
      id: user.id,
      email: user.email,
      ...tokens,
    });
  }

  async login(dto: LoginDto): Promise<ResponseDtoHelper<AuthResponseDto>> {
    const user = await this.usersService.getOneByEmail(dto.email);

    this.dummyHash ??= HashHelper.hash(randomUUID());
    const hash = user?.password ?? (await this.dummyHash);
    const isValidPassword = await HashHelper.verify(hash, dto.password);

    // Same error for unknown email and wrong password, so accounts can't be enumerated.
    if (!user || !isValidPassword) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id);
    return ResponseDtoHelper.success({
      id: user.id,
      email: user.email,
      ...tokens,
    });
  }

  /**
   * Refresh token rotation: every refresh returns a new pair and invalidates the old refresh token.
   * Reusing an already-rotated token is treated as theft and logs the user out everywhere.
   */
  async refresh(
    userId: number,
    refreshToken: string,
  ): Promise<ResponseDtoHelper<TokensResponseDto>> {
    const user = await this.usersService.findWithRefreshTokenHash(userId);
    if (!user?.rtHash) {
      throw new UnauthorizedException('Access denied');
    }

    if (!safeEqual(user.rtHash, sha256(refreshToken))) {
      await this.usersService.setRefreshTokenHash(user.id, null);
      throw new UnauthorizedException('Access denied');
    }

    return ResponseDtoHelper.success(await this.issueTokens(user.id));
  }

  async logout(userId: number): Promise<ResponseDtoHelper<null>> {
    await this.usersService.setRefreshTokenHash(userId, null);
    return ResponseDtoHelper.success(null, 'Logged out');
  }

  private async issueTokens(userId: number): Promise<Tokens> {
    const sign = (secretKey: string, expiresKey: string, fallback: string) =>
      this.jwtService.signAsync(
        { sub: userId, jti: randomUUID() },
        {
          secret: this.config.getOrThrow<string>(secretKey),
          expiresIn: this.config.get<string>(
            expiresKey,
            fallback,
          ) as JwtSignOptions['expiresIn'],
        },
      );

    const [accessToken, refreshToken] = await Promise.all([
      sign('JWT_ACCESS_SECRET', 'JWT_ACCESS_EXPIRES_IN', '15m'),
      sign('JWT_REFRESH_SECRET', 'JWT_REFRESH_EXPIRES_IN', '7d'),
    ]);

    await this.usersService.setRefreshTokenHash(userId, sha256(refreshToken));
    return { accessToken, refreshToken };
  }
}
