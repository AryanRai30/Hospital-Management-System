const express = require('express');
const router = express.Router();
const AdminController = require('../controllers/admin.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * /api/v1/admin/dashboard:
 *   get:
 *     summary: Fetch Admin Dashboard Summary Statistics
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard metrics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Admin dashboard statistics retrieved successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalPatients:
 *                       type: integer
 *                       example: 125
 *                     totalDoctors:
 *                       type: integer
 *                       example: 18
 *                     totalAppointments:
 *                       type: integer
 *                       example: 42
 *                     totalStaff:
 *                       type: integer
 *                       example: 35
 *                     totalDepartments:
 *                       type: integer
 *                       example: 8
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Requires ADMIN role
 */
router.get('/dashboard', verifyToken, authorizeRoles('ADMIN'), AdminController.getDashboardStats);

module.exports = router;
