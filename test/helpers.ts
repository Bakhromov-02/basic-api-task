import request from 'supertest';
import { DataSource } from 'typeorm';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

import { AppModule } from '../src/app.module';
import { configureApp } from '../src/app.setup';

export const PASSWORD = 'StrongPassw0rd';

/** Boots the real application (same global pipes, guards and filters as production). */
export const createTestApp = async (): Promise<INestApplication> => {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();
  const app = moduleRef.createNestApplication({ logger: false });
  configureApp(app);
  await app.init();
  return app;
};

export const resetDatabase = (app: INestApplication) =>
  app.get(DataSource).query('TRUNCATE "users" RESTART IDENTITY CASCADE');

export type TestUser = {
  id: number;
  email: string;
  accessToken: string;
  refreshToken: string;
  auth: string;
};

let counter = 0;

export const signup = async (
  app: INestApplication,
  email?: string,
): Promise<TestUser> => {
  counter += 1;
  const res = await request(app.getHttpServer())
    .post('/api/auth/signup')
    .send({ email: email ?? `user${counter}@example.com`, password: PASSWORD })
    .expect(201);

  const { id, email: savedEmail, accessToken, refreshToken } = res.body.data;
  return {
    id,
    email: savedEmail,
    accessToken,
    refreshToken,
    auth: `Bearer ${accessToken}`,
  };
};
