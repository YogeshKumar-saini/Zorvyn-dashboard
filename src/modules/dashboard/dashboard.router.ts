import { Router } from 'express';

import { authenticate } from '../../middleware/auth.middleware';
import { anyRole, analystOrAdmin } from '../../middleware/rbac.middleware';

import { DashboardController } from './dashboard.controller';

const router = Router();
router.use((req, res, next) => { void authenticate(req, res, next); });

/**
 * @swagger
 * /api/v1/dashboard/summary:
 *   get:
 *     summary: Get high-level financial summary
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard summary with totalIncome, totalExpenses, netBalance
 */
router.get('/summary', (req, res, next) => { void anyRole(req, res, next); }, (req, res, next) => {
  void DashboardController.getSummary(req, res, next);
});

/**
 * @swagger
 * /api/v1/dashboard/by-category:
 *   get:
 *     summary: Get expenses/income grouped by category (Analyst/Admin)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/by-category', (req, res, next) => { void analystOrAdmin(req, res, next); }, (req, res, next) => {
  void DashboardController.getByCategory(req, res, next);
});

/**
 * @swagger
 * /api/v1/dashboard/trends:
 *   get:
 *     summary: Get monthly financial trends (Analyst/Admin)
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
router.get('/trends', (req, res, next) => { void analystOrAdmin(req, res, next); }, (req, res, next) => {
  void DashboardController.getTrends(req, res, next);
});

/**
 * @swagger
 * /api/v1/dashboard/recent:
 *   get:
 *     summary: Get list of most recent financial activities
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/recent', (req, res, next) => { void anyRole(req, res, next); }, (req, res, next) => {
  void DashboardController.getRecentActivity(req, res, next);
});

/**
 * @swagger
 * /api/v1/dashboard/stats:
 *   get:
 *     summary: Get detailed dashboard statistics (Analyst/Admin)
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 */
router.get('/stats', (req, res, next) => { void analystOrAdmin(req, res, next); }, (req, res, next) => {
  void DashboardController.getStats(req, res, next);
});

export default router;
