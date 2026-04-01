import { z } from 'zod';

import { ROLE, STATUS } from '../../constants';

export const createUserSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2).max(100).trim(),
  role: z.enum([ROLE.VIEWER, ROLE.ANALYST, ROLE.ADMIN]).optional(),
});

export const updateRoleSchema = z.object({
  role: z.enum([ROLE.VIEWER, ROLE.ANALYST, ROLE.ADMIN]),
});

export const updateStatusSchema = z.object({
  status: z.enum([STATUS.ACTIVE, STATUS.INACTIVE, STATUS.SUSPENDED]),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
