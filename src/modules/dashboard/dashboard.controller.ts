import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../../utils/response';
import { DashboardService } from './dashboard.service';

/**
 * Dashboard Controller — thin layer. Delegates all analytics to DashboardService.
 */
export class DashboardController {
  /** GET /api/v1/dashboard/summary */
  static async getSummary(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = await DashboardService.getSummary();
      return sendSuccess(res, data, 'Dashboard summary retrieved');
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/dashboard/by-category */
  static async getByCategory(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = await DashboardService.getByCategory();
      return sendSuccess(res, data, 'Category-wise totals retrieved');
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/dashboard/trends */
  static async getTrends(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const months = Math.min(24, Math.max(1, parseInt(req.query['months'] as string) || 6));
      const data = await DashboardService.getTrends(months);
      return sendSuccess(res, data, 'Monthly trends retrieved');
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/dashboard/recent */
  static async getRecentActivity(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = await DashboardService.getRecentActivity();
      return sendSuccess(res, data, 'Recent activity retrieved');
    } catch (error) {
      next(error);
    }
  }

  /** GET /api/v1/dashboard/stats */
  static async getStats(_req: Request, res: Response, next: NextFunction): Promise<Response | void> {
    try {
      const data = await DashboardService.getStats();
      return sendSuccess(res, data, 'Dashboard stats retrieved');
    } catch (error) {
      next(error);
    }
  }
}
