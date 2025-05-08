import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';

import { AuthResponseDto, UserAuthDto } from './dto';
import { JwtPayload, Tokens } from './types';

import { UsersService } from '../users/users.service';

import { TokenExpireType } from '@common/types';
import { HashHelper, ResponseDtoHelper } from '@common/helpers';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private config: ConfigService,

    private readonly usersService: UsersService,
  ) {}

  async signup(dto: UserAuthDto): Promise<ResponseDtoHelper<AuthResponseDto>> {
    const { email } = dto;
    const userFromDb = await this.usersService.getOneByEmail(email);
    if (userFromDb) {
      throw new BadRequestException('User already exists');
    }

    try {
      const createdUser = await this.usersService.create(dto);
      const tokens = await this.getTokens(
        {
          id: createdUser.id,
        },
        '1d',
        '7d',
      );

      // TODO: save tokens in db

      return ResponseDtoHelper.created({
        id: createdUser?.id,
        email: createdUser?.email,
        accessToken: tokens?.at,
        refreshToken: tokens?.rt,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  async login(dto: UserAuthDto): Promise<ResponseDtoHelper<AuthResponseDto>> {
    const { email, password } = dto;
    const userFromDb = await this.usersService.getOneByEmail(email);
    if (!userFromDb) {
      throw new NotFoundException('User not found');
    }

    const isValidPassword = await HashHelper.verify(
      userFromDb?.password,
      password,
    );
    if (!isValidPassword) {
      throw new BadRequestException('Invalid password');
    }

    try {
      const tokens = await this.getTokens(
        {
          id: userFromDb.id,
        },
        '1d',
        '7d',
      );

      // TODO: save tokens in db
      return ResponseDtoHelper.success({
        id: userFromDb?.id,
        email: userFromDb?.email,
        accessToken: tokens?.at,
        refreshToken: tokens?.rt,
      });
    } catch (error) {
      console.log(error);
      throw error;
    }
  }

  // TODO: add refresh token logic
  // TODO: add logout logic

  async getTokens(
    payload: JwtPayload,
    atExpiresIn: TokenExpireType,
    rtExpiresIn: TokenExpireType,
  ): Promise<Tokens> {
    const [at, rt] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: payload?.id,
          aud: payload?.aud,
          typ: 'Access JWT Token',
        },
        {
          secret: this.config.getOrThrow('JWT_ACCESS_SECRET'),
          expiresIn: atExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          id: payload?.id,
          aud: payload?.aud,
          typ: 'Refresh JWT Token',
        },
        {
          secret: this.config.getOrThrow('JWT_REFRESH_SECRET'),
          expiresIn: rtExpiresIn,
        },
      ),
    ]);

    return {
      at,
      rt,
    };
  }
}
