import { z } from 'zod';

import { RECORD_TYPE } from '../../constants';

export const createRecordSchema = z.object({
  amount: z.number().positive('Amount must be a positive number'),
  type: z.enum([RECORD_TYPE.INCOME, RECORD_TYPE.EXPENSE]),
  category: z.string().min(1, 'Category is required').max(100).trim(),
  date: z.coerce.date(),
  notes: z.string().max(1000).trim().optional(),
});

export const updateRecordSchema = createRecordSchema.partial();

export const recordQuerySchema = z.object({
  type: z.enum([RECORD_TYPE.INCOME, RECORD_TYPE.EXPENSE]).optional(),
  category: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type CreateRecordInput = z.infer<typeof createRecordSchema>;
export type UpdateRecordInput = z.infer<typeof updateRecordSchema>;
export type RecordQueryInput = z.infer<typeof recordQuerySchema>;
