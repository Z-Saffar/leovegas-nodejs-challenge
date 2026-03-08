import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import jwt from 'jsonwebtoken';
import request from 'supertest';
import app from '../app';
import { createUserPayload, getToken } from '../test/helper';

describe('Users API', () => {
  describe('POST /users', () => {
    describe('success', () => {
      it('should return 201 and create a new user with valid payload', async () => {
        const payload = createUserPayload();

        const response = await request(app).post('/users').send(payload);

        expect(response.status).toBe(201);
        expect(response.body.data).toMatchObject({
          type: 'users',
          id: expect.any(String),
          attributes: {
            name: payload.name,
            email: payload.email,
            role: payload.role,
          },
        });
        expect(response.body.data.attributes).not.toHaveProperty('password');
        expect(response.body.data.attributes).not.toHaveProperty('password_hash');
      });

      it('should default role to USER when not provided', async () => {
        const payload = createUserPayload();
        delete (payload as Record<string, unknown>).role;

        const response = await request(app).post('/users').send(payload);

        expect(response.status).toBe(201);
        expect(response.body.data.attributes.role).toBe('USER');
      });
    });

    describe('validation errors', () => {
      it('should return 400 when name is empty', async () => {
        const response = await request(app)
          .post('/users')
          .send(createUserPayload({ name: '' }));

        expect(response.status).toBe(400);
        expect(response.body.errors[0]).toMatchObject({
          status: '400',
          title: 'Bad Request',
          detail: 'Name is required',
        });
      });

      it('should return 400 when email is invalid', async () => {
        const response = await request(app)
          .post('/users')
          .send(createUserPayload({ email: 'invalid-email' }));

        expect(response.status).toBe(400);
        expect(response.body.errors[0].detail).toMatch(/email/i);
      });

      it('should return 400 when password is too short', async () => {
        const response = await request(app)
          .post('/users')
          .send(createUserPayload({ password: 'short' }));

        expect(response.status).toBe(400);
        expect(response.body.errors[0].detail).toMatch(/8 character/i);
      });
    });

    describe('conflict', () => {
      it('should return 409 when email already exists', async () => {
        const email = `dup-${randomUUID()}@example.com`;
        const payload = createUserPayload({ email });

        const firstResponse = await request(app).post('/users').send(payload);
        expect(firstResponse.status).toBe(201);

        const response = await request(app)
          .post('/users')
          .send(createUserPayload({ email, name: 'Duplicate User' }));

        expect(response.status).toBe(409);
        expect(response.body.errors).toHaveLength(1);
        expect(response.body.errors[0]).toMatchObject({
          status: '409',
          title: 'Conflict',
          detail: 'Email already exists',
        });
      });
    });
  });

  describe('GET /users/:id', () => {
    describe('token validation', () => {
      it('should return 401 when token is not provided', async () => {
        const { userId } = await getToken(app);

        const response = await request(app).get(`/users/${userId}`);

        expect(response.status).toBe(401);
        expect(response.body.errors[0]).toMatchObject({
          status: '401',
          title: 'Unauthorized',
        });
      });

      it('should return 401 when token is invalid', async () => {
        const { userId } = await getToken(app);

        const response = await request(app)
          .get(`/users/${userId}`)
          .set('Authorization', 'Bearer invalid-token');

        expect(response.status).toBe(401);
        expect(response.body.errors[0]).toMatchObject({
          status: '401',
          title: 'Unauthorized',
          detail: 'Invalid or expired token',
        });
      });

      it('should return 401 when token is expired', async () => {
        const secret = process.env.JWT_SECRET;
        if (!secret) throw new Error('JWT_SECRET required for test');

        const expiredToken = jwt.sign(
          { userId: 1, role: 'USER', email: 'test@example.com' },
          secret,
          { expiresIn: '-1h' }
        );

        const response = await request(app)
          .get('/users/1')
          .set('Authorization', `Bearer ${expiredToken}`);

        expect(response.status).toBe(401);
        expect(response.body.errors[0]).toMatchObject({
          status: '401',
          title: 'Unauthorized',
          detail: 'Invalid or expired token',
        });
      });
    });

    it('should return 200 when USER gets their own profile', async () => {
      const { token, userId } = await getToken(app);

      const response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toMatchObject({
        type: 'users',
        id: String(userId),
        attributes: {
          name: expect.any(String),
          email: expect.any(String),
          role: 'USER',
        },
      });
    });

    it('should return 200 when ADMIN gets any user', async () => {
      const [targetUser, admin] = await Promise.all([
        getToken(app),
        getToken(app, { role: 'ADMIN' }),
      ]);

      const response = await request(app)
        .get(`/users/${targetUser.userId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(String(targetUser.userId));
    });

    it('should return 403 when USER tries to get another user', async () => {
      const [userA, userB] = await Promise.all([
        getToken(app),
        getToken(app),
      ]);

      const response = await request(app)
        .get(`/users/${userB.userId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(response.status).toBe(403);
      expect(response.body.errors[0]).toMatchObject({
        status: '403',
        title: 'Forbidden',
        detail: 'You can only access your own profile',
      });
    });

    it('should return 404 when user does not exist', async () => {
      const { token } = await getToken(app, { role: 'ADMIN' });
      const userId = 999999;

      const response = await request(app)
        .get(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors[0]).toMatchObject({
        status: '404',
        title: 'Not Found',
        detail: 'User not found',
      });
    });
  });

  describe('PUT /users/:id', () => {
    it('should return 200 when USER updates their own user', async () => {
      const { token, userId } = await getToken(app);
      const updates = { name: 'Updated Name' };

      const response = await request(app)
        .put(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.attributes).toMatchObject(updates);
    });

    it('should return 200 when ADMIN updates another user', async () => {
      const [targetUser, admin] = await Promise.all([
        getToken(app),
        getToken(app, { role: 'ADMIN' }),
      ]);
      const updates = { role: 'ADMIN' };

      const response = await request(app)
        .put(`/users/${targetUser.userId}`)
        .set('Authorization', `Bearer ${admin.token}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.data.attributes.role).toBe('ADMIN');
    });

    it('should return 403 when user tries to change their own role', async () => {
      const { token, userId } = await getToken(app);

      const response = await request(app)
        .put(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ role: 'ADMIN' });

      expect(response.status).toBe(403);
      expect(response.body.errors[0].detail).toMatch(/cannot change your own role/i);
    });

    it('should return 404 when user does not exist', async () => {
      const { token } = await getToken(app, { role: 'ADMIN' });
      const nonExistentId = 999999;

      const response = await request(app)
        .put(`/users/${nonExistentId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Updated' });

      expect(response.status).toBe(404);
      expect(response.body.errors[0].detail).toBe('User not found');
    });
  });

  describe('DELETE /users/:id', () => {
    it('should return 200 when ADMIN deletes another user', async () => {
      const [targetUser, admin] = await Promise.all([
        getToken(app),
        getToken(app, { role: 'ADMIN' }),
      ]);

      const response = await request(app)
        .delete(`/users/${targetUser.userId}`)
        .set('Authorization', `Bearer ${admin.token}`);

      expect(response.status).toBe(200);
    });

    it('should return 403 when ADMIN tries to delete themselves', async () => {
      const { token, userId } = await getToken(app, { role: 'ADMIN' });

      const response = await request(app)
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(403);
      expect(response.body.errors[0].detail).toMatch(/cannot delete your own/i);
    });

    it('should return 403 when USER tries to delete (admin only)', async () => {
      const [userA, userB] = await Promise.all([
        getToken(app),
        getToken(app),
      ]);

      const response = await request(app)
        .delete(`/users/${userB.userId}`)
        .set('Authorization', `Bearer ${userA.token}`);

      expect(response.status).toBe(403);
      expect(response.body.errors[0].detail).toMatch(/admin/i);
    });

    it('should return 404 when user does not exist', async () => {
      const { token } = await getToken(app, { role: 'ADMIN' });
      const userId = 999999;

      const response = await request(app)
        .delete(`/users/${userId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
      expect(response.body.errors[0].detail).toBe('User not found');
    });
  });
});
