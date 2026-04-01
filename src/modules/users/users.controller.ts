import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { updateRoleSchema, updateStatusSchema, createUserSchema } from './users.schema';
import { UsersService } from './users.service';

/**
 * Users Controller — thin layer. Delegates all logic to UsersService.
 */
export class UsersController {
  /** GET /api/v1/users */
  static async list(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const { users, meta } = await UsersService.list(req);
      return sendSuccess(res, users, 'Users retrieved successfully', 200, meta);
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/users/:id */
  static async getById(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const user = await UsersService.getById(req.params['id']!);
      return sendSuccess(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/v1/users */
  static async create(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = createUserSchema.parse(req.body);
      const user = await UsersService.create(data, req.user!.id);
      return sendSuccess(res, user, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/v1/users/:id/role */
  static async updateRole(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = updateRoleSchema.parse(req.body);
      const user = await UsersService.updateRole(req.params['id']!, data, req.user!.id);
      return sendSuccess(res, user, `User role updated to ${data.role}`);
    } catch (error) {
      next(error);
    }
  }

  /** PATCH /api/v1/users/:id/status */
  static async updateStatus(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = updateStatusSchema.parse(req.body);
      const user = await UsersService.updateStatus(req.params['id']!, data, req.user!.id);
      return sendSuccess(res, user, `User status updated to ${data.status}`);
    } catch (error) {
      next(error);
    }
  }

  /** DELETE /api/v1/users/:id */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      await UsersService.delete(req.params['id']!, req.user!.id);
      return sendSuccess(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  }
}
