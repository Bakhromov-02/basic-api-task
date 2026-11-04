import request from 'supertest';
import { INestApplication } from '@nestjs/common';

import { PASSWORD, createTestApp, resetDatabase, signup } from './helpers';

describe('Users (e2e)', () => {
  let app: INestApplication;
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(() => resetDatabase(app));

  afterAll(() => app.close());

  describe('GET /api/users/me and /api/users/:id', () => {
    it('returns the current user without sensitive fields', async () => {
      const user = await signup(app);
      const res = await api()
        .get('/api/users/me')
        .set('Authorization', user.auth)
        .expect(200);

      expect(res.body.data).toMatchObject({ id: user.id, email: user.email });
      expect(res.body.data).not.toHaveProperty('password');
      expect(res.body.data).not.toHaveProperty('rtHash');
      expect(res.body.data).not.toHaveProperty('deletedAt');
    });

    it('returns 400 for a non-numeric id and 404 for an unknown one', async () => {
      const user = await signup(app);
      await api()
        .get('/api/users/abc')
        .set('Authorization', user.auth)
        .expect(400);
      await api()
        .get('/api/users/999999')
        .set('Authorization', user.auth)
        .expect(404);
    });
  });

  describe('GET /api/users', () => {
    it('paginates and reports totals', async () => {
      const user = await signup(app);
      await signup(app);
      await signup(app);

      const res = await api()
        .get('/api/users?limit=2&page=2')
        .set('Authorization', user.auth)
        .expect(200);

      expect(res.body).toMatchObject({
        currentPage: 2,
        limit: 2,
        total: 3,
        totalPages: 2,
      });
      expect(res.body.data).toHaveLength(1);
    });

    it('searches by partial email and treats LIKE wildcards literally', async () => {
      const user = await signup(app, 'alice@example.com');
      await signup(app, 'bob@example.com');

      const partial = await api()
        .get('/api/users?email=ALI')
        .set('Authorization', user.auth)
        .expect(200);
      expect(partial.body.data.map((u: { email: string }) => u.email)).toEqual([
        'alice@example.com',
      ]);

      const wildcard = await api()
        .get('/api/users?email=%25')
        .set('Authorization', user.auth)
        .expect(200);
      expect(wildcard.body.total).toBe(0);
    });

    it('validates pagination parameters', async () => {
      const user = await signup(app);
      await api()
        .get('/api/users?limit=1000')
        .set('Authorization', user.auth)
        .expect(400);
      await api()
        .get('/api/users?page=0')
        .set('Authorization', user.auth)
        .expect(400);
    });
  });

  describe('PATCH /api/users/:id', () => {
    it('updates your own name', async () => {
      const user = await signup(app);
      const res = await api()
        .patch(`/api/users/${user.id}`)
        .set('Authorization', user.auth)
        .send({ name: '  Alice  ' })
        .expect(200);

      expect(res.body.data.name).toBe('Alice');
    });

    it("returns 403 for someone else's account", async () => {
      const alice = await signup(app);
      const bob = await signup(app);

      await api()
        .patch(`/api/users/${bob.id}`)
        .set('Authorization', alice.auth)
        .send({ name: 'hacked' })
        .expect(403);
    });

    it('rejects an empty body and fields that cannot be changed', async () => {
      const user = await signup(app);
      await api()
        .patch(`/api/users/${user.id}`)
        .set('Authorization', user.auth)
        .send({})
        .expect(400);
      await api()
        .patch(`/api/users/${user.id}`)
        .set('Authorization', user.auth)
        .send({ email: 'new@example.com' })
        .expect(400);
    });

    it('changing the password updates login and signs out other sessions', async () => {
      const user = await signup(app);
      const newPassword = 'AnotherPassw0rd';

      await api()
        .patch(`/api/users/${user.id}`)
        .set('Authorization', user.auth)
        .send({ password: newPassword })
        .expect(200);

      await api()
        .post('/api/auth/login')
        .send({ email: user.email, password: PASSWORD })
        .expect(401);
      await api()
        .post('/api/auth/login')
        .send({ email: user.email, password: newPassword })
        .expect(200);
      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it("returns 403 for someone else's account", async () => {
      const alice = await signup(app);
      const bob = await signup(app);
      await api()
        .delete(`/api/users/${bob.id}`)
        .set('Authorization', alice.auth)
        .expect(403);
    });

    it('soft-deletes your account, revokes its tokens and frees the email', async () => {
      const user = await signup(app, 'leaving@example.com');
      const other = await signup(app);

      await api()
        .delete(`/api/users/${user.id}`)
        .set('Authorization', user.auth)
        .expect(200);

      // Existing tokens stop working immediately.
      await api()
        .get('/api/users/me')
        .set('Authorization', user.auth)
        .expect(401);
      await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: user.refreshToken })
        .expect(401);

      // The account disappears for others, and the email can be registered again.
      await api()
        .get(`/api/users/${user.id}`)
        .set('Authorization', other.auth)
        .expect(404);
      await signup(app, 'leaving@example.com');
    });
  });
});
