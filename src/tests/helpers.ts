import type { Role, UserStatus, RecordType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import request from 'supertest';
import { vi } from 'vitest';

import app from '../app';
import { prisma } from '../lib/prisma';
import { AuthService } from '../modules/auth/auth.service';

/**
 * Database cleanup utility.
 * Deletes all records from the database in the correct order to respect FK constraints.
 */
export async function clearDatabase() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename NOT LIKE '_prisma_migrations';`;

  const tables = tablenames
    .map(({ tablename }) => `"${tablename}"`)
    .join(', ');

  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
  } catch (error) {
    console.error('Failed to truncate tables:', error);
  }
}

/**
 * Factory to create a test user directly in the database.
 */
export async function createTestUser(overrides: {
  email: string;
  password?: string;
  role?: Role;
  status?: UserStatus;
  name?: string;
}) {
  const password = await bcrypt.hash(overrides.password || 'Password@123!', 12);
  return prisma.user.create({
    data: {
      email: overrides.email,
      password,
      name: overrides.name || 'Test User',
      role: overrides.role || 'VIEWER',
      status: overrides.status || 'ACTIVE',
    },
  });
}

/**
 * Utility to get an authorization header for a user.
 */
export async function getAuthHeader(userData: { email: string; password?: string }) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({
      email: userData.email,
      password: userData.password || 'Password@123!',
    });

  if (response.status !== 200) {
    throw new Error(`Failed to login: ${JSON.stringify(response.body)}`);
  }

  return { Authorization: `Bearer ${response.body.data.token}` };
}

/**
 * Factory to create a financial record.
 */
export async function createTestRecord(data: {
  amount: number;
  type: RecordType;
  category: string;
  date: Date;
  createdBy: string;
  notes?: string;
}) {
  return prisma.financialRecord.create({
    data,
  });
}

/**
 * Mocking utility for dates if needed.
 */
export function mockDate(date: string | number | Date) {
  vi.setSystemTime(new Date(date));
}
