import { randomUUID } from 'crypto';
import type { Express } from 'express';
import request from 'supertest';

export const createUserPayload = (overrides: Partial<Record<string, string>> = {}) => ({
  name: 'Test User',
  email: `test-${randomUUID()}@example.com`,
  password: 'password123',
  role: 'USER',
  ...overrides,
});

export type TokenResult = {
  token: string;
  userId: number;
  email: string;
  role: string;
};

export async function getToken(
  app: Express,
  overrides: Partial<Record<string, string>> = {}
): Promise<TokenResult> {
  const userPayload = createUserPayload(overrides);

  const createRes = await request(app).post('/users').send(userPayload);

  if (createRes.status !== 201) {
    throw new Error(`Failed to create user: ${JSON.stringify(createRes.body)}`);
  }

  const loginRes = await request(app).post('/auth/login').send({
    email: userPayload.email,
    password: userPayload.password,
  });

  if (loginRes.status !== 200) {
    throw new Error(`Failed to login: ${JSON.stringify(loginRes.body)}`);
  }

  return {
    token: loginRes.body.data.attributes.access_token,
    userId: Number(loginRes.body.data.id),
    email: userPayload.email,
    role: userPayload.role,
  };
}
