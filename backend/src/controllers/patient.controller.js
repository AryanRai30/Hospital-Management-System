const PatientModel = require('../models/patient.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');

class PatientController {
  /**
   * Get all patients (supports search and filters)
   * GET /api/v1/patients
   */
  static async getPatients(req, res, next) {
    try {
      const { search, gender, bloodGroup } = req.query;
      const patients = await PatientModel.findAll({ search, gender, bloodGroup });
      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, patients, 'Patients retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single patient by ID
   * GET /api/v1/patients/:id
   */
  static async getPatientById(req, res, next) {
    try {
      const { id } = req.params;
      const patient = await PatientModel.findById(id);
      if (!patient) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Patient with ID ${id} not found.`);
      }
      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, patient, 'Patient details retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new patient
   * POST /api/v1/patients
   */
  static async createPatient(req, res, next) {
    try {
      let {
        fullName,
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        city,
        state,
        postalCode,
        emergencyContactName,
        emergencyContactPhone,
        heightCm,
        weightKg,
        allergies,
        medicalConditions,
        currentMedications,
        insuranceProvider,
        insurancePolicyNumber,
        status
      } = req.body;

      // Handle fullName parsing if provided instead of separate firstName/lastName
      if (fullName && (!firstName || !lastName)) {
        const parts = fullName.trim().split(' ');
        firstName = parts[0] || 'Patient';
        lastName = parts.slice(1).join(' ') || 'User';
      }

      // Required fields validation
      if (!firstName || !lastName) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Full Name (First and Last Name) is required.');
      }
      if (!email || !email.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email address is required.');
      }
      if (!phoneNumber || !phoneNumber.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Phone number is required.');
      }
      if (!dateOfBirth) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Date of Birth is required.');
      }
      if (!gender || !['MALE', 'FEMALE', 'OTHER'].includes(gender.trim().toUpperCase())) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Gender must be MALE, FEMALE, or OTHER.');
      }
      if (!emergencyContactName || !emergencyContactName.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Emergency contact name is required.');
      }
      if (!emergencyContactPhone || !emergencyContactPhone.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Emergency contact phone is required.');
      }

      // 1. Check duplicate email
      const existingEmailUser = await PatientModel.findUserByEmail(email);
      if (existingEmailUser) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          `A user account with email '${email}' already exists.`
        );
      }

      // 2. Check duplicate phone number
      const existingPhoneUser = await PatientModel.findUserByPhone(phoneNumber);
      if (existingPhoneUser) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          `A user account with phone number '${phoneNumber}' already exists.`
        );
      }

      const patient = await PatientModel.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        city,
        state,
        postalCode,
        emergencyContactName,
        emergencyContactPhone,
        heightCm,
        weightKg,
        allergies,
        medicalConditions,
        currentMedications,
        insuranceProvider,
        insurancePolicyNumber,
        status: status !== undefined ? status : true
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json(new ApiResponse(HTTP_STATUS.CREATED, patient, 'Patient created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update existing patient
   * PUT /api/v1/patients/:id
   */
  static async updatePatient(req, res, next) {
    try {
      const { id } = req.params;
      const existingPatient = await PatientModel.findById(id);
      if (!existingPatient) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Patient with ID ${id} not found.`);
      }

      let {
        fullName,
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        city,
        state,
        postalCode,
        emergencyContactName,
        emergencyContactPhone,
        heightCm,
        weightKg,
        allergies,
        medicalConditions,
        currentMedications,
        insuranceProvider,
        insurancePolicyNumber,
        status
      } = req.body;

      if (fullName && (!firstName || !lastName)) {
        const parts = fullName.trim().split(' ');
        firstName = parts[0] || existingPatient.first_name;
        lastName = parts.slice(1).join(' ') || existingPatient.last_name;
      }

      firstName = firstName || existingPatient.first_name;
      lastName = lastName || existingPatient.last_name;
      email = email || existingPatient.email;
      phoneNumber = phoneNumber || existingPatient.phone_number;
      dateOfBirth = dateOfBirth || existingPatient.date_of_birth;
      gender = gender || existingPatient.gender;

      // Required validation
      if (!firstName || !lastName) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Full Name is required.');
      }
      if (!email || !email.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email address is required.');
      }
      if (!phoneNumber || !phoneNumber.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Phone number is required.');
      }

      // Check duplicate email for other users
      if (existingPatient.user_id) {
        const emailTaken = await PatientModel.isEmailTakenByOtherUser(email, existingPatient.user_id);
        if (emailTaken) {
          throw new ApiError(
            HTTP_STATUS.CONFLICT,
            `Email address '${email}' is already in use by another user.`
          );
        }

        const phoneTaken = await PatientModel.findUserByPhone(phoneNumber, existingPatient.user_id);
        if (phoneTaken) {
          throw new ApiError(
            HTTP_STATUS.CONFLICT,
            `Phone number '${phoneNumber}' is already in use by another user.`
          );
        }
      }

      const updatedPatient = await PatientModel.update(id, {
        firstName,
        lastName,
        email,
        phoneNumber,
        dateOfBirth,
        gender,
        bloodGroup,
        address,
        city,
        state,
        postalCode,
        emergencyContactName,
        emergencyContactPhone,
        heightCm,
        weightKg,
        allergies,
        medicalConditions,
        currentMedications,
        insuranceProvider,
        insurancePolicyNumber,
        status: status !== undefined ? status : existingPatient.is_active
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, updatedPatient, 'Patient updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete patient
   * DELETE /api/v1/patients/:id
   */
  static async deletePatient(req, res, next) {
    try {
      const { id } = req.params;
      const existingPatient = await PatientModel.findById(id);
      if (!existingPatient) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Patient with ID ${id} not found.`);
      }

      await PatientModel.delete(id);

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, null, 'Patient deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = PatientController;
