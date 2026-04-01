import type { Request, Response, NextFunction } from 'express';

import { sendSuccess } from '../../utils/response';

import { createRecordSchema, updateRecordSchema, recordQuerySchema } from './records.schema';
import { RecordsService } from './records.service';

/**
 * Records Controller — thin layer. Delegates all logic to RecordsService.
 */
export class RecordsController {
  /** GET /api/v1/records */
  static async list(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const query = recordQuerySchema.parse(req.query);
      const { records, meta } = await RecordsService.list(query, req);
      return sendSuccess(res, records, 'Records retrieved successfully', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/records/:id */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const record = await RecordsService.getById(req.params['id']!);
      return sendSuccess(res, record, 'Record retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/v1/records */
  static async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = createRecordSchema.parse(req.body);
      const record = await RecordsService.create(data, req.user!.id, req.ip);
      return sendSuccess(res, record, 'Record created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/v1/records/:id */
  static async update(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = updateRecordSchema.parse(req.body);
      const record = await RecordsService.update(req.params['id']!, data, req.user!.id);
      return sendSuccess(res, record, 'Record updated successfully');
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/v1/records/:id */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await RecordsService.delete(req.params['id']!, req.user!.id);
      return sendSuccess(res, null, 'Record deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
