const { pool } = require('../config/db.config');
const bcrypt = require('bcryptjs');

let schemaVerified = false;

class DoctorModel {
  /**
   * Automatically ensure missing columns exist in existing MySQL database table
   */
  static async ensureSchema() {
    if (schemaVerified) return;
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM doctors");
      const colNames = columns.map((c) => c.Field);

      if (!colNames.includes('gender')) {
        await pool.query(
          "ALTER TABLE doctors ADD COLUMN `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL COMMENT 'Biological gender'"
        );
      }
      if (!colNames.includes('date_of_birth')) {
        await pool.query(
          "ALTER TABLE doctors ADD COLUMN `date_of_birth` DATE NULL COMMENT 'Doctor date of birth'"
        );
      }
      if (!colNames.includes('address')) {
        await pool.query(
          "ALTER TABLE doctors ADD COLUMN `address` VARCHAR(255) NULL COMMENT 'Residential address'"
        );
      }
      if (!colNames.includes('profile_photo')) {
        await pool.query(
          "ALTER TABLE doctors ADD COLUMN `profile_photo` VARCHAR(255) NULL COMMENT 'Profile photo placeholder or URL'"
        );
      }
      schemaVerified = true;
    } catch (err) {
      // Ignore if table does not exist or connection failed
    }
  }

  /**
   * Fetch all active & inactive doctors with search support
   */
  static async findAll({ search } = {}) {
    await this.ensureSchema();

    let sql = `
      SELECT 
        d.id,
        d.user_id,
        d.department_id,
        d.license_number,
        d.specialization,
        d.qualification,
        d.experience_years,
        d.consultation_fee,
        d.room_number,
        d.gender,
        d.date_of_birth,
        d.address,
        d.profile_photo,
        d.created_at,
        d.updated_at,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.phone_number,
        u.is_active,
        u.is_active AS status,
        u.is_email_verified,
        dept.name AS department_name,
        dept.code AS department_code
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN departments dept ON d.department_id = dept.id
    `;

    const params = [];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      sql += `
        WHERE LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE ?
           OR LOWER(d.specialization) LIKE ?
           OR LOWER(u.email) LIKE ?
           OR LOWER(dept.name) LIKE ?
           OR LOWER(d.qualification) LIKE ?
      `;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ` ORDER BY d.id DESC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Find doctor by Doctor ID
   */
  static async findById(id) {
    await this.ensureSchema();

    const sql = `
      SELECT 
        d.id,
        d.user_id,
        d.department_id,
        d.license_number,
        d.specialization,
        d.qualification,
        d.experience_years,
        d.consultation_fee,
        d.room_number,
        d.gender,
        d.date_of_birth,
        d.address,
        d.profile_photo,
        d.created_at,
        d.updated_at,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.phone_number,
        u.is_active,
        u.is_active AS status,
        u.is_email_verified,
        dept.name AS department_name,
        dept.code AS department_code
      FROM doctors d
      JOIN users u ON d.user_id = u.id
      JOIN departments dept ON d.department_id = dept.id
      WHERE d.id = ?
    `;

    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Check if email exists in users table
   */
  static async findUserByEmail(email) {
    const [rows] = await pool.query(
      `SELECT id, email FROM users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  }

  /**
   * Check duplicate email excluding a specific user ID
   */
  static async isEmailTakenByOtherUser(email, userId) {
    const [rows] = await pool.query(
      `SELECT id FROM users WHERE email = ? AND id != ?`,
      [email.toLowerCase().trim(), userId]
    );
    return rows.length > 0;
  }

  /**
   * Get active departments list
   */
  static async getDepartments() {
    const [rows] = await pool.query(
      `SELECT id, name, code, description FROM departments WHERE is_active = 1 ORDER BY name ASC`
    );
    return rows;
  }

  /**
   * Create a new doctor and user record in database transaction
   */
  static async create({
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
  }) {
    await this.ensureSchema();

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Get DOCTOR role ID
      const [roleRows] = await connection.query(
        `SELECT id FROM roles WHERE name = 'DOCTOR'`
      );
      if (!roleRows || roleRows.length === 0) {
        throw new Error("Role 'DOCTOR' not found in database.");
      }
      const roleId = roleRows[0].id;

      // 2. Hash Password (default 'Doctor123!' if not provided)
      const rawPassword = password || 'Doctor123!';
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(rawPassword, salt);

      const isActive = status !== undefined && status !== null ? (status ? 1 : 0) : 1;

      // 3. Insert into users table
      const [userResult] = await connection.query(
        `INSERT INTO users 
         (role_id, first_name, last_name, email, password_hash, phone_number, is_active, is_email_verified)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          roleId,
          firstName.trim(),
          lastName.trim(),
          email.toLowerCase().trim(),
          passwordHash,
          phoneNumber ? phoneNumber.trim() : null,
          isActive
        ]
      );
      const userId = userResult.insertId;

      // 4. Generate license number if missing
      const finalLicenseNumber = licenseNumber
        ? licenseNumber.trim()
        : `DOC-LIC-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`;

      // 5. Insert into doctors table
      const [doctorResult] = await connection.query(
        `INSERT INTO doctors
         (user_id, department_id, license_number, specialization, qualification, experience_years, consultation_fee, gender, date_of_birth, address, profile_photo)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          departmentId,
          finalLicenseNumber,
          specialization.trim(),
          qualification.trim(),
          Number(experienceYears) || 0,
          Number(consultationFee) || 0,
          gender || null,
          dateOfBirth || null,
          address ? address.trim() : null,
          profilePhoto ? profilePhoto.trim() : null
        ]
      );
      const doctorId = doctorResult.insertId;

      await connection.commit();
      return await this.findById(doctorId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update existing doctor and associated user record
   */
  static async update(
    id,
    {
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
    }
  ) {
    await this.ensureSchema();

    const existingDoctor = await this.findById(id);
    if (!existingDoctor) return null;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const userId = existingDoctor.user_id;
      const isActive = status !== undefined && status !== null ? (status ? 1 : 0) : existingDoctor.is_active;

      // 1. Update users table
      await connection.query(
        `UPDATE users 
         SET first_name = ?, last_name = ?, email = ?, phone_number = ?, is_active = ?
         WHERE id = ?`,
        [
          firstName.trim(),
          lastName.trim(),
          email.toLowerCase().trim(),
          phoneNumber ? phoneNumber.trim() : null,
          isActive,
          userId
        ]
      );

      // 2. Update doctors table
      await connection.query(
        `UPDATE doctors
         SET department_id = ?,
             specialization = ?,
             qualification = ?,
             experience_years = ?,
             consultation_fee = ?,
             gender = ?,
             date_of_birth = ?,
             address = ?,
             profile_photo = ?
             ${licenseNumber ? ', license_number = ?' : ''}
         WHERE id = ?`,
        licenseNumber
          ? [
              departmentId,
              specialization.trim(),
              qualification.trim(),
              Number(experienceYears) || 0,
              Number(consultationFee) || 0,
              gender || null,
              dateOfBirth || null,
              address ? address.trim() : null,
              profilePhoto ? profilePhoto.trim() : null,
              licenseNumber.trim(),
              id
            ]
          : [
              departmentId,
              specialization.trim(),
              qualification.trim(),
              Number(experienceYears) || 0,
              Number(consultationFee) || 0,
              gender || null,
              dateOfBirth || null,
              address ? address.trim() : null,
              profilePhoto ? profilePhoto.trim() : null,
              id
            ]
      );

      await connection.commit();
      return await this.findById(id);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Delete doctor and associated user account
   */
  static async delete(id) {
    await this.ensureSchema();

    const existingDoctor = await this.findById(id);
    if (!existingDoctor) return false;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Deleting user automatically cascades to doctors table
      await connection.query(`DELETE FROM users WHERE id = ?`, [existingDoctor.user_id]);

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
}

module.exports = DoctorModel;
