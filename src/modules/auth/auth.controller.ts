import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { registerSchema, loginSchema } from './auth.schema';
import { AuthService } from './auth.service';

/**
 * Auth Controller — thin layer. Parses request, calls service, returns response.
 * All business logic lives in AuthService.
 */
export class AuthController {
  /** POST /api/v1/auth/register */
  static async register(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = registerSchema.parse(req.body);
      const user = await AuthService.register(data);
      return sendSuccess(res, user, 'Account created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/v1/auth/login */
  static async login(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = loginSchema.parse(req.body);
      const ip = req.ip ?? req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await AuthService.login(data, ip, userAgent);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  /** POST /api/v1/auth/logout */
  static async logout(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const token = req.headers.authorization?.split(' ')[1] ?? '';
      await AuthService.logout(token, req.user!.id);
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/auth/me */
  static async getMe(req: Request, res: Response) {
    return sendSuccess(res, req.user, 'Current user profile');
  }
}
