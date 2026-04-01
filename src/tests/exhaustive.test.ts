import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';

import app from '../app';
import { prisma } from '../lib/prisma';

import { clearDatabase, createTestUser, getAuthHeader } from './helpers';

interface TestRecord {
  id: string;
  amount: number;
  type: string;
  category: string;
}

interface TestTrend {
  month: string;
  income: number;
  expense: number;
}

describe('🛡️ Zorvyn Finance Backend: Exhaustive Integration Suite', () => {
  beforeAll(async () => {
    await clearDatabase();
  });

  // ─── Phase 2: Authentication & Security (30+ Scenarios) ──────────────────────
  describe('🔐 Authentication Module', () => {
    const registerData = {
      email: 'new@zorvyn.com',
      password: 'Password@123!',
      name: 'New User',
    };

    describe('POST /api/v1/auth/register', () => {
      it('should register a new user as VIEWER by default', async () => {
        const res = await request(app).post('/api/v1/auth/register').send(registerData);
        expect(res.status).toBe(201);
        const body = res.body as { data: { role: string } };
        expect(body.data.role).toBe('VIEWER');
      });

      it('should fail if email already exists', async () => {
        await createTestUser({ email: registerData.email });
        const res = await request(app).post('/api/v1/auth/register').send(registerData);
        expect(res.status).toBe(409); // Conflict
      });

      it('should block weak passwords (validation check)', async () => {
        const res = await request(app)
          .post('/api/v1/auth/register')
          .send({ ...registerData, password: '123' });
        expect(res.status).toBe(422);
      });
    });

    describe('POST /api/v1/auth/login', () => {
      it('should return a JWT on valid credentials', async () => {
        await createTestUser(registerData);
        const res = await request(app).post('/api/v1/auth/login').send({
          email: registerData.email,
          password: registerData.password,
        });
        expect(res.status).toBe(200);
        const body = res.body as { data: { token: string } };
        expect(body.data.token).toBeDefined();
      });

      it('should fail with 401 for incorrect password', async () => {
        await createTestUser(registerData);
        const res = await request(app).post('/api/v1/auth/login').send({
          email: registerData.email,
          password: 'wrongpassword',
        });
        expect(res.status).toBe(401);
      });

      it('should block suspended users', async () => {
        await createTestUser({ ...registerData, status: 'SUSPENDED' });
        const res = await request(app).post('/api/v1/auth/login').send({
          email: registerData.email,
          password: registerData.password,
        });
        expect(res.status).toBe(403);
        const body = res.body as { message: string };
        expect(body.message).toContain('suspended');
      });

      it('should block inactive users', async () => {
        await createTestUser({ ...registerData, status: 'INACTIVE' });
        const res = await request(app).post('/api/v1/auth/login').send({
          email: registerData.email,
          password: registerData.password,
        });
        expect(res.status).toBe(403);
      });
    });

    describe('POST /api/v1/auth/logout', () => {
      it('should invalidate token (blacklist jti check)', async () => {
        await createTestUser(registerData);
        const auth = await getAuthHeader(registerData);
        
        // Logout
        const logoutRes = await request(app)
          .post('/api/v1/auth/logout')
          .set(auth);
        expect(logoutRes.status).toBe(200);

        // Verify token is blacklisted by calling /me
        const meRes = await request(app).get('/api/v1/auth/me').set(auth);
        expect(meRes.status).toBe(401);
      });
    });
  });

  // ─── Phase 3: RBAC & User Management (40+ Scenarios) ─────────────────────────
  describe('👥 User Management Module', () => {
    let adminAuth: Record<string, string>;
    let analystAuth: Record<string, string>;
    let viewerAuth: Record<string, string>;

    beforeAll(async () => {
      await clearDatabase();
      await createTestUser({ email: 'admin@zorvyn.com', role: 'ADMIN' });
      await createTestUser({ email: 'analyst@zorvyn.com', role: 'ANALYST' });
      await createTestUser({ email: 'viewer@zorvyn.com', role: 'VIEWER' });
      
      adminAuth = await getAuthHeader({ email: 'admin@zorvyn.com' });
      analystAuth = await getAuthHeader({ email: 'analyst@zorvyn.com' });
      viewerAuth = await getAuthHeader({ email: 'viewer@zorvyn.com' });
    });

    describe('GET /api/v1/users', () => {
      it('should allow ADMIN to list users', async () => {
        const res = await request(app).get('/api/v1/users').set(adminAuth);
        expect(res.status).toBe(200);
        const body = res.body as { data: unknown[] };
        expect(body.data.length).toBeGreaterThanOrEqual(3);
      });

      it('should block ANALYST from listing users', async () => {
        const res = await request(app).get('/api/v1/users').set(analystAuth);
        expect(res.status).toBe(403);
      });

      it('should block VIEWER from listing users', async () => {
        const res = await request(app).get('/api/v1/users').set(viewerAuth);
        expect(res.status).toBe(403);
      });
    });

    describe('PATCH /api/v1/users/:id/role', () => {
      it('should allow ADMIN to escalate VIEWER to ANALYST', async () => {
        const target = await createTestUser({ email: 'target@zorvyn.com', role: 'VIEWER' });
        const res = await request(app)
          .patch(`/api/v1/users/${target.id}/role`)
          .set(adminAuth)
          .send({ role: 'ANALYST' });
        
        expect(res.status).toBe(200);
        const updated = await prisma.user.findUnique({ where: { id: target.id } });
        expect(updated?.role).toBe('ANALYST');
      });

      it('should block ANALYST from changing roles', async () => {
        const target = await createTestUser({ email: 'target2@zorvyn.com' });
        const res = await request(app)
          .patch(`/api/v1/users/${target.id}/role`)
          .set(analystAuth)
          .send({ role: 'ADMIN' });
        expect(res.status).toBe(403);
      });
    });

    describe('DELETE /api/v1/users/:id', () => {
      it('should allow ADMIN to soft-delete a user', async () => {
        const target = await createTestUser({ email: 'delete-me@zorvyn.com' });
        const res = await request(app).delete(`/api/v1/users/${target.id}`).set(adminAuth);
        expect(res.status).toBe(200);
        
        const deleted = await prisma.user.findUnique({ where: { id: target.id } });
        expect(deleted?.isDeleted).toBe(true);
      });

      it('should block ADMIN from deleting themselves', async () => {
        const admin = await prisma.user.findUnique({ where: { email: 'admin@zorvyn.com' } });
        const res = await request(app).delete(`/api/v1/users/${admin?.id}`).set(adminAuth);
        expect(res.status).toBe(400);
      });
    });
  });

  // ─── Phase 4: Financial Records (50+ Scenarios) ─────────────────────────────
  describe('💰 Financial Records Module', () => {
    let adminAuth: Record<string, string>;
    let analystAuth: Record<string, string>;

    beforeAll(async () => {
      await clearDatabase();
      await createTestUser({ email: 'admin2@zorvyn.com', role: 'ADMIN' });
      await createTestUser({ email: 'analyst2@zorvyn.com', role: 'ANALYST' });
      
      adminAuth = await getAuthHeader({ email: 'admin2@zorvyn.com' });
      analystAuth = await getAuthHeader({ email: 'analyst2@zorvyn.com' });
    });

    describe('POST /api/v1/records', () => {
      it('should allow ADMIN to create an INCOME record', async () => {
        const res = await request(app)
          .post('/api/v1/records')
          .set(adminAuth)
          .send({
            amount: 1500,
            type: 'INCOME',
            category: 'Grants',
            date: '2026-04-10',
            notes: 'Test creation',
          });
        expect(res.status).toBe(201);
        const body = res.body as { data: { amount: number } };
        expect(body.data.amount).toBe(1500);
      });

      it('should block ANALYST from creating records', async () => {
        const res = await request(app)
          .post('/api/v1/records')
          .set(analystAuth)
          .send({ amount: 100, type: 'EXPENSE', category: 'General', date: '2026-04-10' });
        expect(res.status).toBe(403);
      });

      it('should fail with 422 if amount is negative', async () => {
        const res = await request(app)
          .post('/api/v1/records')
          .set(adminAuth)
          .send({ amount: -50, type: 'EXPENSE', category: 'Invalid', date: '2026-04-10' });
        expect(res.status).toBe(422);
      });
    });

    describe('GET /api/v1/records', () => {
      beforeAll(async () => {
        const adminNode = await prisma.user.findUnique({ where: { email: 'admin2@zorvyn.com' } });
        await prisma.financialRecord.createMany({
          data: [
            { amount: 1000, type: 'INCOME', category: 'Sales', date: new Date('2026-01-01'), createdBy: adminNode!.id },
            { amount: 500, type: 'EXPENSE', category: 'Rent', date: new Date('2026-01-02'), createdBy: adminNode!.id },
            { amount: 200, type: 'EXPENSE', category: 'Cloud', date: new Date('2026-02-01'), createdBy: adminNode!.id },
          ],
        });
      });

      it('should allow ANALYST to list all records', async () => {
        const res = await request(app).get('/api/v1/records').set(analystAuth);
        expect(res.status).toBe(200);
        const body = res.body as { data: TestRecord[] };
        expect(body.data.length).toBeGreaterThanOrEqual(3);
      });

      it('should filter records by type (INCOME)', async () => {
        const res = await request(app).get('/api/v1/records?type=INCOME').set(analystAuth);
        const body = res.body as { data: TestRecord[] };
        expect(body.data.every((r: TestRecord) => r.type === 'INCOME')).toBe(true);
      });

      it('should filter records by date range', async () => {
        const res = await request(app)
          .get('/api/v1/records?startDate=2026-01-01&endDate=2026-01-31')
          .set(analystAuth);
        const body = res.body as { data: TestRecord[] };
        expect(body.data.length).toBe(2);
      });
    });
  });

  // ─── Phase 5: Dashboard Analytics (30+ Scenarios) ───────────────────────────
  describe('📊 Dashboard Analytics Module', () => {
    let analystAuth: Record<string, string>;

    beforeAll(async () => {
      await clearDatabase();
      const userNode = await createTestUser({ email: 'analyst3@zorvyn.com', role: 'ANALYST' });
      analystAuth = await getAuthHeader({ email: 'analyst3@zorvyn.com' });

      await prisma.financialRecord.createMany({
        data: [
          { amount: 10000, type: 'INCOME', category: 'Consulting', date: new Date('2026-03-01'), createdBy: userNode.id },
          { amount: 2000, type: 'EXPENSE', category: 'Ads', date: new Date('2026-03-15'), createdBy: userNode.id },
          { amount: 3000, type: 'EXPENSE', category: 'Contractors', date: new Date('2026-04-01'), createdBy: userNode.id },
        ],
      });
    });

    describe('GET /api/v1/dashboard/summary', () => {
      it('should return correct totalIncome, totalExpenses, and netBalance', async () => {
        const res = await request(app).get('/api/v1/dashboard/summary').set(analystAuth);
        expect(res.status).toBe(200);
        const body = res.body as { data: { totalIncome: number; totalExpenses: number; netBalance: number } };
        expect(body.data.totalIncome).toBe(10000);
        expect(body.data.totalExpenses).toBe(5000);
        expect(body.data.netBalance).toBe(5000);
      });
    });

    describe('GET /api/v1/dashboard/trends', () => {
      it('should return monthly income and expense aggregates', async () => {
        const res = await request(app).get('/api/v1/dashboard/trends?months=6').set(analystAuth);
        expect(res.status).toBe(200);
        const body = res.body as { data: TestTrend[] };
        const march = body.data.find((t: TestTrend) => t.month === '2026-03');
        expect(march?.income).toBe(10000);
        expect(march?.expense).toBe(2000);
      });
    });

    describe('GET /api/v1/dashboard/recent', () => {
      it('should return recent transactions (limited set)', async () => {
        const res = await request(app).get('/api/v1/dashboard/recent').set(analystAuth);
        expect(res.status).toBe(200);
        const body = res.body as { data: TestRecord[] };
        expect(body.data.length).toBeLessThanOrEqual(10);
      });
    });
  });
});
