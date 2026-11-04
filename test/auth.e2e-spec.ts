import request from 'supertest';
import { INestApplication } from '@nestjs/common';

import { PASSWORD, createTestApp, resetDatabase, signup } from './helpers';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => resetDatabase(app));

  afterAll(() => app.close());

  describe('POST /api/auth/signup', () => {
    it('creates an account, normalizes the email and returns tokens', async () => {
      const res = await api()
        .post('/api/auth/signup')
        .send({ email: '  John.Doe@Example.COM ', password: PASSWORD })
        .expect(201);

      expect(res.body.data).toEqual({
        id: expect.any(Number),
        email: 'john.doe@example.com',
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      });
    });

    it('returns 409 for an email that is already registered (case-insensitive)', async () => {
      await signup(app, 'taken@example.com');
      await api()
        .post('/api/auth/signup')
        .send({ email: 'TAKEN@example.com', password: PASSWORD })
        .expect(409);
    });

    it.each([
      ['an invalid email', { email: 'not-an-email', password: PASSWORD }],
      ['a short password', { email: 'short@example.com', password: '1234567' }],
      [
        'an unknown field',
        { email: 'extra@example.com', password: PASSWORD, role: 'admin' },
      ],
      [
        'a non-string password',
        { email: 'obj@example.com', password: { $ne: '' } },
      ],
    ])('rejects %s with 400', async (_case, body) => {
      await api().post('/api/auth/signup').send(body).expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      const user = await signup(app);
      const res = await api()
        .post('/api/auth/login')
        .send({ email: user.email, password: PASSWORD })
        .expect(200);

      expect(res.body.data.accessToken).toEqual(expect.any(String));
    });

    it('gives the same 401 for a wrong password and an unknown email', async () => {
      const user = await signup(app);

      const wrongPassword = await api()
        .post('/api/auth/login')
        .send({ email: user.email, password: 'WrongPassw0rd' })
        .expect(401);
      const unknownEmail = await api()
        .post('/api/auth/login')
        .send({ email: 'ghost@example.com', password: 'WrongPassw0rd' })
        .expect(401);

      expect(wrongPassword.body.message).toBe('Invalid email or password');
      expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
    });
  });

  describe('protected routes', () => {
    it('require an access token', async () => {
      await api().get('/api/users/me').expect(401);
      await api()
        .get('/api/users/me')
        .set('Authorization', 'Bearer not-a-jwt')
        .expect(401);
    });

    it('do not accept a refresh token as an access token', async () => {
      const user = await signup(app);
      await api()
        .get('/api/users/me')
        .set('Authorization', `Bearer ${user.refreshToken}`)
        .expect(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rotates tokens: returns a new pair that works', async () => {
      const user = await signup(app);

      const res = await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(200);

      const { accessToken, refreshToken } = res.body.data;
      expect(refreshToken).not.toBe(user.refreshToken);
      await api()
        .get('/api/users/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });

    it('treats reuse of a rotated refresh token as theft and revokes the session', async () => {
      const user = await signup(app);

      const rotated = await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(200);

      // The old token is replayed...
      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
      // ...so the newest token is revoked too.
      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: rotated.body.data.refreshToken })
        .expect(401);
    });

    it('rejects an access token, a missing token and a forged token', async () => {
      const user = await signup(app);
      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: user.accessToken })
        .expect(401);
      await api().post('/api/auth/refresh').send({}).expect(401);
      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: `${user.refreshToken.slice(0, -2)}xx` })
        .expect(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('revokes the refresh token', async () => {
      const user = await signup(app);

      await api()
        .post('/api/auth/logout')
        .set('Authorization', user.auth)
        .expect(200);
      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
    });
  });
});
