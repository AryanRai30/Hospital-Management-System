const express = require('express');
const router = express.Router();
const healthController = require('../controllers/health.controller');

/**
 * @swagger
 * /api/v1/health:
 *   get:
 *     summary: System Health Check
 *     tags: [System]
 *     responses:
 *       200:
 *         description: System operational and database status
 */
router.get('/', healthController.checkHealth);

module.exports = router;
