import { Router } from 'express';
import { RecordsController } from './records.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { analystOrAdmin, adminOnly } from '../../middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

/**
 * @swagger
 * /api/v1/records:
 *   get:
 *     summary: List financial records with filtering and pagination (Analyst/Admin)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [INCOME, EXPENSE]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *     responses:
 *       200:
 *         description: Paginated list of records
 *       403:
 *         description: Insufficient permissions
 */
router.get('/', analystOrAdmin, RecordsController.list);

/**
 * @swagger
 * /api/v1/records/{id}:
 *   get:
 *     summary: Get a single financial record by ID (Analyst/Admin)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record details
 *       404:
 *         description: Record not found
 */
router.get('/:id', analystOrAdmin, RecordsController.getById);

/**
 * @swagger
 * /api/v1/records:
 *   post:
 *     summary: Create a new financial record (Admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [INCOME, EXPENSE]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Record created
 *       403:
 *         description: Admin role required
 */
router.post('/', adminOnly, RecordsController.create);

/**
 * @swagger
 * /api/v1/records/{id}:
 *   patch:
 *     summary: Update a financial record (Admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record updated
 *       404:
 *         description: Record not found
 */
router.patch('/:id', adminOnly, RecordsController.update);

/**
 * @swagger
 * /api/v1/records/{id}:
 *   delete:
 *     summary: Soft-delete a financial record (Admin only)
 *     tags: [Records]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Record deleted
 *       404:
 *         description: Record not found
 */
router.delete('/:id', adminOnly, RecordsController.delete);

export default router;
