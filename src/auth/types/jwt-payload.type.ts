export type JwtPayload = {
  /** User id */
  sub: number;
  /** Unique token id, so two tokens issued in the same second are never identical */
  jti: string;
};
