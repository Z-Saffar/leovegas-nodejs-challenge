import { randomUUID } from 'crypto';
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../app';
import { createUserPayload } from '../test/helper';

const loginPayload = (overrides: Partial<Record<string, string>> = {}) => ({
  email: '',
  password: '',
  ...overrides,
});

describe('Auth API', () => {
  describe('POST /auth/login', () => {
    describe('success', () => {
      it('should return 200 and access_token with valid credentials', async () => {
        const userPayload = createUserPayload();
        await request(app).post('/users').send(userPayload);

        const response = await request(app)
          .post('/auth/login')
          .send(loginPayload({
            email: userPayload.email,
            password: userPayload.password,
          }));

        expect(response.status).toBe(200);
        expect(response.body.data).toMatchObject({
          type: 'auth',
          id: expect.any(String),
          attributes: {
            access_token: expect.any(String),
          },
        });
      });
    });

    describe('invalid credentials', () => {
      it('should return 401 when password is wrong', async () => {
        const userPayload = createUserPayload();
        await request(app).post('/users').send(userPayload);

        const response = await request(app)
          .post('/auth/login')
          .send(loginPayload({
            email: userPayload.email,
            password: 'wrongpassword',
          }));

        expect(response.status).toBe(401);
        expect(response.body.errors[0]).toMatchObject({
          status: '401',
          title: 'Unauthorized',
          detail: 'Invalid email or password',
        });
      });

      it('should return 401 when email does not exist', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send(loginPayload({
            email: 'dontexist@example.com',
            password: 'password123',
          }));

        expect(response.status).toBe(401);
        expect(response.body.errors[0]).toMatchObject({
          status: '401',
          title: 'Unauthorized',
          detail: 'Invalid email or password',
        });
      });
    });

    describe('validation errors', () => {
      it('should return 400 when email is missing', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send(loginPayload({ password: 'password123' }));

        expect(response.status).toBe(400);
        expect(response.body.errors[0].detail).toMatch('Email is required');
      });

      it('should return 400 when password is missing', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send(loginPayload({ email: 'user@example.com' }));

        expect(response.status).toBe(400);
        expect(response.body.errors[0].detail).toMatch('Password is required');
      });

      it('should return 400 when email format is invalid', async () => {
        const response = await request(app)
          .post('/auth/login')
          .send(loginPayload({
            email: 'invalid-email',
            password: 'password123',
          }));

        expect(response.status).toBe(400);
        expect(response.body.errors[0].detail).toMatch('Invalid email');
      });
    });
  });
});
