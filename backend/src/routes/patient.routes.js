const express = require('express');
const router = express.Router();
const PatientController = require('../controllers/patient.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Patients
 *   description: Patient Management API Endpoints
 */

/**
 * @swagger
 * /api/v1/patients:
 *   get:
 *     summary: Retrieve patients with search and filtering
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query by name, email, phone, or patient ID
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *         description: Filter by gender (MALE, FEMALE, OTHER)
 *       - in: query
 *         name: bloodGroup
 *         schema:
 *           type: string
 *         description: Filter by blood group (e.g. A+, O-)
 *     responses:
 *       200:
 *         description: List of patients
 */
router.get('/', verifyToken, PatientController.getPatients);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   get:
 *     summary: Retrieve single patient details by ID
 *     tags: [Patients]
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
 *         description: Patient details
 *       404:
 *         description: Patient not found
 */
router.get('/:id', verifyToken, PatientController.getPatientById);

/**
 * @swagger
 * /api/v1/patients:
 *   post:
 *     summary: Create a new patient record (Admin only)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Patient created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate email or phone number
 */
router.post('/', verifyToken, authorizeRoles('ADMIN'), PatientController.createPatient);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   put:
 *     summary: Update existing patient details (Admin only)
 *     tags: [Patients]
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
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 *       409:
 *         description: Email or phone already in use
 */
router.put('/:id', verifyToken, authorizeRoles('ADMIN'), PatientController.updatePatient);

/**
 * @swagger
 * /api/v1/patients/{id}:
 *   delete:
 *     summary: Delete patient record (Admin only)
 *     tags: [Patients]
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
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 */
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), PatientController.deletePatient);

module.exports = router;
