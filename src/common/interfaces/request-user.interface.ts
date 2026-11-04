export interface RequestUser {
  id: number;
}

export interface RequestUserWithRefreshToken extends RequestUser {
  refreshToken: string;
}
