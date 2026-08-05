const AppointmentModel = require('../models/appointment.model');
const DoctorModel = require('../models/doctor.model');
const EmailService = require('../services/email.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

class AppointmentController {
  /**
   * Get appointments list scoped to user role & query parameters
   * GET /api/v1/appointments
   */
  static async getAppointments(req, res, next) {
    try {
      const { search, status, doctorId, patientId, date } = req.query;
      const userRole = req.user ? req.user.role : '';
      const userId = req.user ? req.user.id : null;

      const appointments = await AppointmentModel.findAll({
        search,
        status,
        doctorId,
        patientId,
        date,
        userRole,
        userId
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, appointments, 'Appointments retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single appointment by ID
   * GET /api/v1/appointments/:id
   */
  static async getAppointmentById(req, res, next) {
    try {
      const { id } = req.params;
      const appointment = await AppointmentModel.findById(id);
      if (!appointment) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Appointment with ID ${id} not found.`);
      }

      // Check role access
      const userRole = req.user ? req.user.role : '';
      const userId = req.user ? req.user.id : null;

      if (userRole === 'PATIENT') {
        const patientId = await AppointmentModel.findPatientByUserId(userId);
        if (appointment.patient_id !== patientId) {
          throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Access denied to this appointment record.');
        }
      } else if (userRole === 'DOCTOR') {
        const doctorId = await AppointmentModel.findDoctorByUserId(userId);
        if (appointment.doctor_id !== doctorId) {
          throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Access denied to this appointment record.');
        }
      }

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, appointment, 'Appointment details retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Book / Create a new appointment
   * POST /api/v1/appointments
   */
  static async createAppointment(req, res, next) {
    try {
      let {
        patientId,
        doctorId,
        departmentId,
        appointmentDate,
        appointmentTime,
        appointmentMode,
        type,
        reason,
        symptoms,
        status
      } = req.body;

      const userRole = req.user ? req.user.role : '';
      const userId = req.user ? req.user.id : null;

      // Auto-resolve patientId if requested by a Patient user
      if (userRole === 'PATIENT') {
        const resolvedPatientId = await AppointmentModel.findPatientByUserId(userId);
        if (!resolvedPatientId) {
          throw new ApiError(
            HTTP_STATUS.BAD_REQUEST,
            'No patient profile linked to your user account. Please contact support.'
          );
        }
        patientId = resolvedPatientId;
        status = 'PENDING'; // Patients book in PENDING state
      }

      // Validations
      if (!patientId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Patient selection is required.');
      }
      if (!doctorId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Doctor selection is required.');
      }
      if (!appointmentDate) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Appointment date is required.');
      }
      if (!appointmentTime) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Appointment time slot is required.');
      }

      // Validate date (cannot book past dates)
      const selectedDate = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(selectedDate.getTime())) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid appointment date format.');
      }
      if (selectedDate < today) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Appointment date cannot be in the past.');
      }

      // Resolve departmentId from selected doctor if missing
      if (!departmentId) {
        const doctor = await DoctorModel.findById(doctorId);
        if (doctor) {
          departmentId = doctor.department_id;
        } else {
          throw new ApiError(HTTP_STATUS.BAD_REQUEST, `Doctor with ID ${doctorId} not found.`);
        }
      }

      // Check duplicate booking for the same doctor at the same date and time
      const isDuplicate = await AppointmentModel.checkDuplicateBooking(
        doctorId,
        appointmentDate,
        appointmentTime
      );
      if (isDuplicate) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          'The selected doctor already has an active appointment scheduled at this exact date and time.'
        );
      }

      const appointment = await AppointmentModel.create({
        patientId,
        doctorId,
        departmentId,
        appointmentDate,
        appointmentTime,
        appointmentMode,
        type,
        reason,
        symptoms,
        status: status || 'PENDING'
      });

      // Asynchronous Non-Blocking Email Dispatch
      setImmediate(async () => {
        try {
          let eventType = 'PATIENT_BOOKED';
          if (userRole === 'ADMIN') {
            eventType = 'ADMIN_CREATED';
          } else if (userRole === 'DOCTOR') {
            eventType = 'DOCTOR_CREATED_FOLLOWUP';
          }
          const fullAppointment = await AppointmentModel.findById(appointment.id);
          await EmailService.notifyAppointmentEvent(eventType, fullAppointment);
        } catch (emailErr) {
          logger.error(`[EMAIL ERROR] Failed sending appointment creation notifications: ${emailErr.message}`);
        }
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json(new ApiResponse(HTTP_STATUS.CREATED, appointment, 'Appointment booked successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update appointment details, status, or consultation notes
   * PUT /api/v1/appointments/:id
   */
  static async updateAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await AppointmentModel.findById(id);
      if (!existing) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Appointment with ID ${id} not found.`);
      }

      const userRole = req.user ? req.user.role : '';
      const userId = req.user ? req.user.id : null;

      let {
        doctorId,
        departmentId,
        appointmentDate,
        appointmentTime,
        appointmentMode,
        status,
        type,
        reason,
        symptoms,
        consultationNotes,
        cancellationReason
      } = req.body;

      // Role Permission Checks
      if (userRole === 'PATIENT') {
        const patientId = await AppointmentModel.findPatientByUserId(userId);
        if (existing.patient_id !== patientId) {
          throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Access denied to update this appointment.');
        }
        // Patients can only cancel pending appointments
        if (status === 'CANCELLED') {
          if (existing.status !== 'PENDING') {
            throw new ApiError(
              HTTP_STATUS.BAD_REQUEST,
              'Only pending appointments can be cancelled by patient.'
            );
          }
        } else {
          throw new ApiError(
            HTTP_STATUS.FORBIDDEN,
            'Patients are only allowed to cancel pending appointments.'
          );
        }
      } else if (userRole === 'DOCTOR') {
        const docId = await AppointmentModel.findDoctorByUserId(userId);
        if (existing.doctor_id !== docId) {
          throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Access denied to update this appointment.');
        }
        // Doctors can accept ('CONFIRMED'), reject ('CANCELLED'), or complete ('COMPLETED')
      }

      // Check slot duplicate if doctor or date/time is changed
      const targetDoctorId = doctorId || existing.doctor_id;
      const targetDate = appointmentDate || existing.appointment_date;
      const targetTime = appointmentTime || existing.appointment_time;

      if (
        targetDoctorId !== existing.doctor_id ||
        targetDate !== existing.appointment_date ||
        targetTime !== existing.appointment_time
      ) {
        // Validate date
        const selectedDate = new Date(targetDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (selectedDate < today) {
          throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Rescheduled date cannot be in the past.');
        }

        const isDuplicate = await AppointmentModel.checkDuplicateBooking(
          targetDoctorId,
          targetDate,
          targetTime,
          id
        );
        if (isDuplicate) {
          throw new ApiError(
            HTTP_STATUS.CONFLICT,
            'The doctor already has an active appointment scheduled at the new date and time.'
          );
        }
      }

      // Resolve department if doctor changed
      if (doctorId && doctorId !== existing.doctor_id && !departmentId) {
        const doctor = await DoctorModel.findById(doctorId);
        if (doctor) {
          departmentId = doctor.department_id;
        }
      }

      const isDateOrTimeChanged =
        (appointmentDate && String(appointmentDate).split('T')[0] !== String(existing.appointment_date).split('T')[0]) ||
        (appointmentTime && appointmentTime !== existing.appointment_time);

      const updated = await AppointmentModel.update(id, {
        doctorId,
        departmentId,
        appointmentDate,
        appointmentTime,
        appointmentMode,
        status,
        type,
        reason,
        symptoms,
        consultationNotes,
        cancellationReason
      });

      // Asynchronous Non-Blocking Email Dispatch
      setImmediate(async () => {
        try {
          let eventType = null;

          if (userRole === 'ADMIN') {
            if (status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
              eventType = 'ADMIN_APPROVED';
            } else if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
              eventType = 'ADMIN_CANCELLED';
            } else if (isDateOrTimeChanged) {
              eventType = 'ADMIN_RESCHEDULED';
            }
          } else if (userRole === 'DOCTOR') {
            if (status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
              eventType = 'DOCTOR_ACCEPTED';
            } else if (status === 'COMPLETED' && existing.status !== 'COMPLETED') {
              eventType = 'DOCTOR_COMPLETED';
            } else if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
              eventType = 'DOCTOR_CANCELLED';
            } else if (isDateOrTimeChanged) {
              eventType = 'DOCTOR_RESCHEDULED';
            }
          } else if (userRole === 'PATIENT') {
            if (status === 'CANCELLED' && existing.status !== 'CANCELLED') {
              eventType = 'PATIENT_CANCELLED';
            }
          }

          if (eventType) {
            const fullAppointment = await AppointmentModel.findById(id);
            await EmailService.notifyAppointmentEvent(eventType, fullAppointment);
          }
        } catch (emailErr) {
          logger.error(`[EMAIL ERROR] Failed sending appointment update notifications: ${emailErr.message}`);
        }
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, updated, 'Appointment updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete appointment
   * DELETE /api/v1/appointments/:id
   */
  static async deleteAppointment(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await AppointmentModel.findById(id);
      if (!existing) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Appointment with ID ${id} not found.`);
      }

      await AppointmentModel.delete(id);

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, null, 'Appointment deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = AppointmentController;
