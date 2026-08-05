const express = require('express');
const router = express.Router();
const DoctorController = require('../controllers/doctor.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Doctors
 *   description: Doctor Management API Endpoints
 */

/**
 * @swagger
 * /api/v1/doctors/departments:
 *   get:
 *     summary: Get list of active departments
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of active departments
 */
router.get('/departments', verifyToken, DoctorController.getDepartments);

/**
 * @swagger
 * /api/v1/doctors:
 *   get:
 *     summary: Retrieve all doctors with optional search filtering
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query by doctor name or specialization
 *     responses:
 *       200:
 *         description: List of doctors
 */
router.get('/', verifyToken, DoctorController.getDoctors);

/**
 * @swagger
 * /api/v1/doctors/{id}:
 *   get:
 *     summary: Retrieve single doctor details by ID
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor details
 *       404:
 *         description: Doctor not found
 */
router.get('/:id', verifyToken, DoctorController.getDoctorById);

/**
 * @swagger
 * /api/v1/doctors:
 *   post:
 *     summary: Create a new doctor record (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Doctor created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate email address
 */
router.post('/', verifyToken, authorizeRoles('ADMIN'), DoctorController.createDoctor);

/**
 * @swagger
 * /api/v1/doctors/{id}:
 *   put:
 *     summary: Update existing doctor details (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor updated successfully
 *       404:
 *         description: Doctor not found
 *       409:
 *         description: Email already in use
 */
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), DoctorController.updateDoctor);

/**
 * @swagger
 * /api/v1/doctors/{id}:
 *   delete:
 *     summary: Delete doctor record (Admin only)
 *     tags: [Doctors]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Doctor deleted successfully
 *       404:
 *         description: Doctor not found
 */
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), DoctorController.deleteDoctor);

module.exports = router;
