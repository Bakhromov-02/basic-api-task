export class TokensResponseDto {
  accessToken: string;
  refreshToken: string;
}

export class AuthResponseDto extends TokensResponseDto {
  id: number;
  email: string;
}
