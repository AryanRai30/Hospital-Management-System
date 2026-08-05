const { pool } = require('../config/db.config');
const bcrypt = require('bcryptjs');

let patientSchemaVerified = false;

class PatientModel {
  /**
   * Automatically ensure missing columns exist in existing MySQL database table
   */
  static async ensureSchema() {
    if (patientSchemaVerified) return;
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM patients");
      const colNames = columns.map((c) => c.Field);

      if (!colNames.includes('height_cm')) {
        await pool.query(
          "ALTER TABLE patients ADD COLUMN `height_cm` DECIMAL(5, 2) NULL COMMENT 'Height in centimeters'"
        );
      }
      if (!colNames.includes('weight_kg')) {
        await pool.query(
          "ALTER TABLE patients ADD COLUMN `weight_kg` DECIMAL(5, 2) NULL COMMENT 'Weight in kilograms'"
        );
      }
      if (!colNames.includes('allergies')) {
        await pool.query(
          "ALTER TABLE patients ADD COLUMN `allergies` TEXT NULL COMMENT 'Known allergies description'"
        );
      }
      if (!colNames.includes('medical_conditions')) {
        await pool.query(
          "ALTER TABLE patients ADD COLUMN `medical_conditions` TEXT NULL COMMENT 'Pre-existing medical conditions'"
        );
      }
      if (!colNames.includes('current_medications')) {
        await pool.query(
          "ALTER TABLE patients ADD COLUMN `current_medications` TEXT NULL COMMENT 'Current active medications'"
        );
      }
      if (!colNames.includes('insurance_provider')) {
        await pool.query(
          "ALTER TABLE patients ADD COLUMN `insurance_provider` VARCHAR(100) NULL COMMENT 'Health insurance company name'"
        );
      }
      if (!colNames.includes('insurance_policy_number')) {
        await pool.query(
          "ALTER TABLE patients ADD COLUMN `insurance_policy_number` VARCHAR(100) NULL COMMENT 'Insurance policy or ID number'"
        );
      }
      patientSchemaVerified = true;
    } catch (err) {
      // Ignore if table does not exist yet
    }
  }

  /**
   * Fetch all patients with search (name, email, phone, patient_code) & filter (gender, blood_group) support
   */
  static async findAll({ search, gender, bloodGroup } = {}) {
    await this.ensureSchema();

    let sql = `
      SELECT 
        p.id,
        p.user_id,
        p.patient_code,
        p.date_of_birth,
        p.gender,
        p.blood_group,
        p.address,
        p.city,
        p.state,
        p.postal_code,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.height_cm,
        p.weight_kg,
        p.allergies,
        p.medical_conditions,
        p.current_medications,
        p.insurance_provider,
        p.insurance_policy_number,
        p.created_at,
        p.updated_at,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.phone_number,
        u.is_active,
        u.is_active AS status,
        u.is_email_verified
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;

    const params = [];

    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      sql += `
        AND (
          LOWER(CONCAT(u.first_name, ' ', u.last_name)) LIKE ?
          OR LOWER(u.email) LIKE ?
          OR LOWER(u.phone_number) LIKE ?
          OR LOWER(p.patient_code) LIKE ?
        )
      `;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (gender && gender.trim()) {
      sql += ` AND p.gender = ?`;
      params.push(gender.trim().toUpperCase());
    }

    if (bloodGroup && bloodGroup.trim()) {
      sql += ` AND p.blood_group = ?`;
      params.push(bloodGroup.trim());
    }

    sql += ` ORDER BY p.id DESC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Find patient by Patient ID
   */
  static async findById(id) {
    await this.ensureSchema();

    const sql = `
      SELECT 
        p.id,
        p.user_id,
        p.patient_code,
        p.date_of_birth,
        p.gender,
        p.blood_group,
        p.address,
        p.city,
        p.state,
        p.postal_code,
        p.emergency_contact_name,
        p.emergency_contact_phone,
        p.height_cm,
        p.weight_kg,
        p.allergies,
        p.medical_conditions,
        p.current_medications,
        p.insurance_provider,
        p.insurance_policy_number,
        p.created_at,
        p.updated_at,
        u.first_name,
        u.last_name,
        CONCAT(u.first_name, ' ', u.last_name) AS full_name,
        u.email,
        u.phone_number,
        u.is_active,
        u.is_active AS status,
        u.is_email_verified
      FROM patients p
      JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `;

    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Check duplicate email in users table
   */
  static async findUserByEmail(email) {
    const [rows] = await pool.query(
      `SELECT id, email FROM users WHERE email = ?`,
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  }

  /**
   * Check duplicate phone number in users table
   */
  static async findUserByPhone(phone, excludeUserId = null) {
    if (!phone || !phone.trim()) return null;
    let sql = `SELECT id, phone_number FROM users WHERE phone_number = ?`;
    const params = [phone.trim()];
    if (excludeUserId) {
      sql += ` AND id != ?`;
      params.push(excludeUserId);
    }
    const [rows] = await pool.query(sql, params);
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
   * Create a new patient and user record in database transaction
   */
  static async create({
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
  }) {
    await this.ensureSchema();

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // 1. Get PATIENT role ID
      const [roleRows] = await connection.query(
        `SELECT id FROM roles WHERE name = 'PATIENT'`
      );
      if (!roleRows || roleRows.length === 0) {
        throw new Error("Role 'PATIENT' not found in database.");
      }
      const roleId = roleRows[0].id;

      // 2. Hash Password (default 'Patient123!' if not provided)
      const rawPassword = password || 'Patient123!';
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

      // 4. Generate unique Patient Code (MRN)
      const year = new Date().getFullYear();
      const patientCode = `PAT-${year}-${String(userId).padStart(4, '0')}`;

      // 5. Insert into patients table
      const [patientResult] = await connection.query(
        `INSERT INTO patients
         (user_id, patient_code, date_of_birth, gender, blood_group, address, city, state, postal_code, emergency_contact_name, emergency_contact_phone, height_cm, weight_kg, allergies, medical_conditions, current_medications, insurance_provider, insurance_policy_number)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          patientCode,
          dateOfBirth,
          gender.toUpperCase(),
          bloodGroup || null,
          address ? address.trim() : null,
          city ? city.trim() : null,
          state ? state.trim() : null,
          postalCode ? postalCode.trim() : null,
          emergencyContactName ? emergencyContactName.trim() : null,
          emergencyContactPhone ? emergencyContactPhone.trim() : null,
          heightCm !== undefined && heightCm !== '' ? Number(heightCm) : null,
          weightKg !== undefined && weightKg !== '' ? Number(weightKg) : null,
          allergies ? allergies.trim() : null,
          medicalConditions ? medicalConditions.trim() : null,
          currentMedications ? currentMedications.trim() : null,
          insuranceProvider ? insuranceProvider.trim() : null,
          insurancePolicyNumber ? insurancePolicyNumber.trim() : null
        ]
      );
      const patientId = patientResult.insertId;

      await connection.commit();
      return await this.findById(patientId);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  /**
   * Update existing patient and associated user record
   */
  static async update(
    id,
    {
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
    }
  ) {
    await this.ensureSchema();

    const existingPatient = await this.findById(id);
    if (!existingPatient) return null;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const userId = existingPatient.user_id;
      const isActive = status !== undefined && status !== null ? (status ? 1 : 0) : existingPatient.is_active;

      // 1. Update users table
      if (userId) {
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
      }

      // 2. Update patients table
      await connection.query(
        `UPDATE patients
         SET date_of_birth = ?,
             gender = ?,
             blood_group = ?,
             address = ?,
             city = ?,
             state = ?,
             postal_code = ?,
             emergency_contact_name = ?,
             emergency_contact_phone = ?,
             height_cm = ?,
             weight_kg = ?,
             allergies = ?,
             medical_conditions = ?,
             current_medications = ?,
             insurance_provider = ?,
             insurance_policy_number = ?
         WHERE id = ?`,
        [
          dateOfBirth || existingPatient.date_of_birth,
          gender ? gender.toUpperCase() : existingPatient.gender,
          bloodGroup !== undefined ? bloodGroup : existingPatient.blood_group,
          address !== undefined ? (address ? address.trim() : null) : existingPatient.address,
          city !== undefined ? (city ? city.trim() : null) : existingPatient.city,
          state !== undefined ? (state ? state.trim() : null) : existingPatient.state,
          postalCode !== undefined ? (postalCode ? postalCode.trim() : null) : existingPatient.postal_code,
          emergencyContactName !== undefined ? (emergencyContactName ? emergencyContactName.trim() : null) : existingPatient.emergency_contact_name,
          emergencyContactPhone !== undefined ? (emergencyContactPhone ? emergencyContactPhone.trim() : null) : existingPatient.emergency_contact_phone,
          heightCm !== undefined && heightCm !== '' ? Number(heightCm) : existingPatient.height_cm,
          weightKg !== undefined && weightKg !== '' ? Number(weightKg) : existingPatient.weight_kg,
          allergies !== undefined ? (allergies ? allergies.trim() : null) : existingPatient.allergies,
          medicalConditions !== undefined ? (medicalConditions ? medicalConditions.trim() : null) : existingPatient.medical_conditions,
          currentMedications !== undefined ? (currentMedications ? currentMedications.trim() : null) : existingPatient.current_medications,
          insuranceProvider !== undefined ? (insuranceProvider ? insuranceProvider.trim() : null) : existingPatient.insurance_provider,
          insurancePolicyNumber !== undefined ? (insurancePolicyNumber ? insurancePolicyNumber.trim() : null) : existingPatient.insurance_policy_number,
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
   * Delete patient and associated user account
   */
  static async delete(id) {
    await this.ensureSchema();

    const existingPatient = await this.findById(id);
    if (!existingPatient) return false;

    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      if (existingPatient.user_id) {
        // Deleting user record automatically cascades/clears patients table
        await connection.query(`DELETE FROM users WHERE id = ?`, [existingPatient.user_id]);
      } else {
        await connection.query(`DELETE FROM patients WHERE id = ?`, [id]);
      }

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

module.exports = PatientModel;
