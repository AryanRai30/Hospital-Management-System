const express = require('express');
const router = express.Router();
const BillingController = require('../controllers/billing.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Billing & Payments
 *   description: Enterprise Billing & Payment Module Endpoints
 */

// Billing Endpoints
router.get('/', verifyToken, BillingController.getBills);
router.get('/:id', verifyToken, BillingController.getBillById);
router.post('/', verifyToken, authorizeRoles('ADMIN'), BillingController.createBill);
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), BillingController.updateBill);
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), BillingController.deleteBill);

// Payment Gateway Endpoints
router.post('/payments/create-order', verifyToken, BillingController.createPaymentOrder);
router.post('/payments/verify', verifyToken, BillingController.verifyPayment);
router.post('/payments/refund', verifyToken, authorizeRoles('ADMIN'), BillingController.refundPayment);

module.exports = router;
