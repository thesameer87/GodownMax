import request from 'supertest';
import app from '../src/index';
import { prisma } from '../src/config/database';

describe('Auth API', () => {
  const testUser = {
    name: 'Test User',
    email: `test_${Date.now()}@example.com`,
    password: 'TestPass@123',
  };
  let accessToken: string;

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testUser.email } });
    await prisma.$disconnect();
  });

  it('POST /api/auth/register - should register a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testUser.email);
    expect(res.body.data.accessToken).toBeDefined();
  });

  it('POST /api/auth/login - should login and return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: testUser.password })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.accessToken).toBeDefined();
    accessToken = res.body.data.accessToken;
  });

  it('POST /api/auth/login - should reject wrong password', async () => {
    await request(app)
      .post('/api/auth/login')
      .send({ email: testUser.email, password: 'WrongPass' })
      .expect(401);
  });

  it('GET /api/auth/me - should return current user', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.data.email).toBe(testUser.email);
  });

  it('GET /api/auth/me - should reject without token', async () => {
    await request(app).get('/api/auth/me').expect(401);
  });
});

describe('Products API', () => {
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@stockflow.com', password: 'Admin@123' });
    accessToken = res.body.data?.accessToken;
  });

  it('GET /api/products - should list products', async () => {
    const res = await request(app)
      .get('/api/products')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('GET /api/products - should filter by search', async () => {
    const res = await request(app)
      .get('/api/products?search=laptop')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
  });
});

describe('Dashboard API', () => {
  let accessToken: string;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@stockflow.com', password: 'Admin@123' });
    accessToken = res.body.data?.accessToken;
  });

  it('GET /api/dashboard/stats - should return stats', async () => {
    const res = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.stats).toBeDefined();
    expect(res.body.data.salesGraph).toBeDefined();
  });
});
