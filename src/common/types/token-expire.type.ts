export enum TokenExpireEnum {
  '7d' = '7d',
  '1d' = '1d',
  '1h' = '1h',
  '10m' = '10m',
  '5m' = '5m',
}
export type TokenExpireType = keyof typeof TokenExpireEnum;
