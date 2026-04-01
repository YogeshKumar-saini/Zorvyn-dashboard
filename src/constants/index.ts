/**
 * Application-wide constants — single source of truth for all magic strings.
 * Never hardcode role/status/type strings outside this file.
 */

// ─── User Roles ──────────────────────────────────────────────────────────────
export const ROLE = {
  VIEWER: 'VIEWER',
  ANALYST: 'ANALYST',
  ADMIN: 'ADMIN',
} as const;
export type Role = (typeof ROLE)[keyof typeof ROLE];

// ─── User Statuses ────────────────────────────────────────────────────────────
export const STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  SUSPENDED: 'SUSPENDED',
} as const;
export type UserStatus = (typeof STATUS)[keyof typeof STATUS];

// ─── Financial Record Types ───────────────────────────────────────────────────
export const RECORD_TYPE = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE',
} as const;
export type RecordType = (typeof RECORD_TYPE)[keyof typeof RECORD_TYPE];

// ─── Role Hierarchy (ascending privilege) ────────────────────────────────────
export const ROLE_HIERARCHY: Role[] = [ROLE.VIEWER, ROLE.ANALYST, ROLE.ADMIN];

// ─── JWT / Token ─────────────────────────────────────────────────────────────
export const JWT_COOKIE_NAME = 'zorvyn_token';

// ─── API ─────────────────────────────────────────────────────────────────────
export const API_VERSION = 'v1';
export const API_PREFIX = `/api/${API_VERSION}`;

// ─── Audit Actions ────────────────────────────────────────────────────────────
export const AUDIT_ACTION = {
  CREATE_RECORD: 'CREATE_RECORD',
  UPDATE_RECORD: 'UPDATE_RECORD',
  DELETE_RECORD: 'DELETE_RECORD',
  CREATE_USER: 'CREATE_USER',
  UPDATE_USER_ROLE: 'UPDATE_USER_ROLE',
  UPDATE_USER_STATUS: 'UPDATE_USER_STATUS',
  DELETE_USER: 'DELETE_USER',
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_REGISTER: 'USER_REGISTER',
} as const;
export type AuditAction = (typeof AUDIT_ACTION)[keyof typeof AUDIT_ACTION];
