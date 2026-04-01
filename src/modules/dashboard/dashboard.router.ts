import { Router } from 'express';
import { DashboardController } from './dashboard.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { anyRole, analystOrAdmin } from '../../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: Get financial summary (income, expenses, net balance)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary with totalIncome, totalExpenses, netBalance
 */
router.get('/summary', anyRole, DashboardController.getSummary);

/**
 * @swagger
 * /api/v1/dashboard/by-category:
 *   get:
 *     summary: Get totals grouped by category (Analyst/Admin)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/by-category', analystOrAdmin, DashboardController.getByCategory);

/**
 * @swagger
 * /api/v1/dashboard/trends:
 *   get:
 *     summary: Get monthly income/expense trends (Analyst/Admin)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 24
 *           default: 6
 */
router.get('/trends', analystOrAdmin, DashboardController.getTrends);

/**
 * @swagger
 * /api/v1/dashboard/recent:
 *   get:
 *     summary: Get last 10 recent transactions
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/recent', anyRole, DashboardController.getRecentActivity);

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     summary: Get record count statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', analystOrAdmin, DashboardController.getStats);

export default router;
