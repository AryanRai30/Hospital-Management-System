const DoctorModel = require('../models/doctor.model');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');

class DoctorController {
  /**
   * Get all doctors (supports search by name or specialization)
   * GET /api/v1/doctors
   */
  static async getDoctors(req, res, next) {
    try {
      const { search } = req.query;
      const doctors = await DoctorModel.findAll({ search });
      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, doctors, 'Doctors retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get doctor by ID
   * GET /api/v1/doctors/:id
   */
  static async getDoctorById(req, res, next) {
    try {
      const { id } = req.params;
      const doctor = await DoctorModel.findById(id);
      if (!doctor) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Doctor with ID ${id} not found.`);
      }
      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, doctor, 'Doctor details retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get active departments list
   * GET /api/v1/doctors/departments
   */
  static async getDepartments(req, res, next) {
    try {
      const departments = await DoctorModel.getDepartments();
      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, departments, 'Departments retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a new doctor
   * POST /api/v1/doctors
   */
  static async createDoctor(req, res, next) {
    try {
      let {
        fullName,
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        gender,
        dateOfBirth,
        specialization,
        departmentId,
        qualification,
        experienceYears,
        consultationFee,
        address,
        status,
        profilePhoto,
        licenseNumber
      } = req.body;

      // Handle fullName parsing if provided instead of separate firstName/lastName
      if (fullName && (!firstName || !lastName)) {
        const parts = fullName.trim().split(' ');
        firstName = parts[0] || 'Doctor';
        lastName = parts.slice(1).join(' ') || 'Staff';
      }

      // Required fields validation
      if (!firstName || !lastName) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Full Name (First and Last Name) is required.');
      }
      if (!email || !email.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email address is required.');
      }
      if (!specialization || !specialization.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Specialization is required.');
      }
      if (!departmentId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Department selection is required.');
      }
      if (!qualification || !qualification.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Qualification is required.');
      }
      if (experienceYears === undefined || experienceYears === null || experienceYears < 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Years of experience is required and must be 0 or greater.');
      }
      if (consultationFee === undefined || consultationFee === null || consultationFee < 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Consultation fee is required and must be 0 or greater.');
      }

      // Check duplicate email
      const existingUser = await DoctorModel.findUserByEmail(email);
      if (existingUser) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          `A user account with email '${email}' already exists.`
        );
      }

      const doctor = await DoctorModel.create({
        firstName,
        lastName,
        email,
        phoneNumber,
        password,
        gender,
        dateOfBirth,
        specialization,
        departmentId,
        qualification,
        experienceYears,
        consultationFee,
        address,
        status: status !== undefined ? status : true,
        profilePhoto,
        licenseNumber
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json(new ApiResponse(HTTP_STATUS.CREATED, doctor, 'Doctor created successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update doctor details
   * PUT /api/v1/doctors/:id
   */
  static async updateDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const existingDoctor = await DoctorModel.findById(id);
      if (!existingDoctor) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Doctor with ID ${id} not found.`);
      }

      let {
        fullName,
        firstName,
        lastName,
        email,
        phoneNumber,
        gender,
        dateOfBirth,
        specialization,
        departmentId,
        qualification,
        experienceYears,
        consultationFee,
        address,
        status,
        profilePhoto,
        licenseNumber
      } = req.body;

      if (fullName && (!firstName || !lastName)) {
        const parts = fullName.trim().split(' ');
        firstName = parts[0] || existingDoctor.first_name;
        lastName = parts.slice(1).join(' ') || existingDoctor.last_name;
      }

      firstName = firstName || existingDoctor.first_name;
      lastName = lastName || existingDoctor.last_name;
      email = email || existingDoctor.email;
      specialization = specialization || existingDoctor.specialization;
      departmentId = departmentId || existingDoctor.department_id;
      qualification = qualification || existingDoctor.qualification;
      experienceYears = experienceYears !== undefined ? experienceYears : existingDoctor.experience_years;
      consultationFee = consultationFee !== undefined ? consultationFee : existingDoctor.consultation_fee;

      // Required validation
      if (!firstName || !lastName) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Full Name is required.');
      }
      if (!email || !email.trim()) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Email address is required.');
      }

      // Check duplicate email for other users
      const emailTaken = await DoctorModel.isEmailTakenByOtherUser(email, existingDoctor.user_id);
      if (emailTaken) {
        throw new ApiError(
          HTTP_STATUS.CONFLICT,
          `Email address '${email}' is already in use by another user.`
        );
      }

      const updatedDoctor = await DoctorModel.update(id, {
        firstName,
        lastName,
        email,
        phoneNumber: phoneNumber !== undefined ? phoneNumber : existingDoctor.phone_number,
        gender: gender !== undefined ? gender : existingDoctor.gender,
        dateOfBirth: dateOfBirth !== undefined ? dateOfBirth : existingDoctor.date_of_birth,
        specialization,
        departmentId,
        qualification,
        experienceYears,
        consultationFee,
        address: address !== undefined ? address : existingDoctor.address,
        status: status !== undefined ? status : existingDoctor.is_active,
        profilePhoto: profilePhoto !== undefined ? profilePhoto : existingDoctor.profile_photo,
        licenseNumber: licenseNumber !== undefined ? licenseNumber : existingDoctor.license_number
      });

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, updatedDoctor, 'Doctor updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete doctor
   * DELETE /api/v1/doctors/:id
   */
  static async deleteDoctor(req, res, next) {
    try {
      const { id } = req.params;
      const existingDoctor = await DoctorModel.findById(id);
      if (!existingDoctor) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Doctor with ID ${id} not found.`);
      }

      await DoctorModel.delete(id);

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, null, 'Doctor deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

module.exports = DoctorController;
