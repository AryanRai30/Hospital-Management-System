const express = require('express');
const router = express.Router();

const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const doctorRoutes = require('./doctor.routes');

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/doctors', doctorRoutes);

module.exports = router;
