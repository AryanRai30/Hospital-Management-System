const express = require('express');
const router = express.Router();
const AppointmentController = require('../controllers/appointment.controller');
const { verifyToken, authorizeRoles } = require('../middlewares/auth.middleware');

/**
 * @swagger
 * tags:
 *   name: Appointments
 *   description: Appointment Management API Endpoints
 */

/**
 * @swagger
 * /api/v1/appointments:
 *   get:
 *     summary: Retrieve appointments with role-scoped filters
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query by patient/doctor name, appointment code, or symptoms
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status (PENDING, CONFIRMED, COMPLETED, CANCELLED)
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of appointments
 */
router.get('/', verifyToken, AppointmentController.getAppointments);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   get:
 *     summary: Retrieve single appointment details by ID
 *     tags: [Appointments]
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
 *         description: Appointment details
 *       404:
 *         description: Appointment not found
 */
router.get('/:id', verifyToken, AppointmentController.getAppointmentById);

/**
 * @swagger
 * /api/v1/appointments:
 *   post:
 *     summary: Book a new appointment
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Appointment booked successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Duplicate doctor booking at date/time
 */
router.post('/', verifyToken, AppointmentController.createAppointment);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   put:
 *     summary: Update existing appointment (Status, Reschedule, Doctor, Consultation Notes)
 *     tags: [Appointments]
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
 *         description: Appointment updated successfully
 *       404:
 *         description: Appointment not found
 */
router.put('/:id', verifyToken, AppointmentController.updateAppointment);

/**
 * @swagger
 * /api/v1/appointments/{id}:
 *   delete:
 *     summary: Delete appointment (Admin only)
 *     tags: [Appointments]
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
 *         description: Appointment deleted successfully
 *       404:
 *         description: Appointment not found
 */
router.delete('/:id', verifyToken, authorizeRoles('ADMIN'), AppointmentController.deleteAppointment);

module.exports = router;
