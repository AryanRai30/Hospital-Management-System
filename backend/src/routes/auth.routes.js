const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User Login Placeholder
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Auth login endpoint placeholder
 */
router.post('/login', authController.login);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: User Register Placeholder
 *     tags: [Authentication]
 *     responses:
 *       201:
 *         description: Auth registration endpoint placeholder
 */
router.post('/register', authController.register);

module.exports = router;
