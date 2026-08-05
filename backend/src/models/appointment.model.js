const { pool } = require('../config/db.config');

let appointmentSchemaVerified = false;

class AppointmentModel {
  /**
   * Automatically ensure missing columns & schema alterations exist in existing MySQL table
   */
  static async ensureSchema() {
    if (appointmentSchemaVerified) return;
    try {
      const [columns] = await pool.query("SHOW COLUMNS FROM appointments");
      const colNames = columns.map((c) => c.Field);

      if (!colNames.includes('symptoms')) {
        await pool.query(
          "ALTER TABLE appointments ADD COLUMN `symptoms` TEXT NULL COMMENT 'Detailed patient reported symptoms'"
        );
      }
      if (!colNames.includes('consultation_notes')) {
        await pool.query(
          "ALTER TABLE appointments ADD COLUMN `consultation_notes` TEXT NULL COMMENT 'Doctor notes and diagnosis'"
        );
      }
      if (!colNames.includes('appointment_mode')) {
        await pool.query(
          "ALTER TABLE appointments ADD COLUMN `appointment_mode` ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'OFFLINE' COMMENT 'Consultation format'"
        );
      }

      // Ensure status ENUM supports PENDING
      const statusCol = columns.find((c) => c.Field === 'status');
      if (statusCol && !statusCol.Type.includes('PENDING')) {
        await pool.query(
          "ALTER TABLE appointments MODIFY COLUMN `status` ENUM('PENDING', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING'"
        );
      }

      appointmentSchemaVerified = true;
    } catch (err) {
      // Ignore if table doesn't exist yet
    }
  }

  /**
   * Fetch patient record ID by user ID
   */
  static async findPatientByUserId(userId) {
    const [rows] = await pool.query(`SELECT id FROM patients WHERE user_id = ?`, [userId]);
    return rows[0] ? rows[0].id : null;
  }

  /**
   * Fetch doctor record ID by user ID
   */
  static async findDoctorByUserId(userId) {
    const [rows] = await pool.query(`SELECT id FROM doctors WHERE user_id = ?`, [userId]);
    return rows[0] ? rows[0].id : null;
  }

  /**
   * Check duplicate booking for doctor at same date and time
   */
  static async checkDuplicateBooking(doctorId, date, time, excludeId = null) {
    await this.ensureSchema();
    let sql = `
      SELECT id 
      FROM appointments 
      WHERE doctor_id = ? 
        AND appointment_date = ? 
        AND appointment_time = ? 
        AND status NOT IN ('CANCELLED')
    `;
    const params = [doctorId, date, time];
    if (excludeId) {
      sql += ` AND id != ?`;
      params.push(excludeId);
    }
    const [rows] = await pool.query(sql, params);
    return rows.length > 0;
  }

  /**
   * Fetch appointments with search & filter support and role-scoped permissions
   */
  static async findAll({ search, status, doctorId, patientId, date, userRole, userId } = {}) {
    await this.ensureSchema();

    let sql = `
      SELECT 
        a.id,
        a.appointment_number,
        a.patient_id,
        a.doctor_id,
        a.department_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.type,
        a.appointment_mode,
        a.reason,
        a.symptoms,
        a.consultation_notes,
        a.cancellation_reason,
        a.created_at,
        a.updated_at,
        -- Patient Info
        p.patient_code,
        CONCAT(pu.first_name, ' ', pu.last_name) AS patient_name,
        pu.email AS patient_email,
        pu.phone_number AS patient_phone,
        -- Doctor Info
        CONCAT('Dr. ', du.first_name, ' ', du.last_name) AS doctor_name,
        du.email AS doctor_email,
        d.specialization AS doctor_specialization,
        d.consultation_fee AS doctor_fee,
        -- Department Info
        dept.name AS department_name,
        dept.code AS department_code
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE 1=1
    `;

    const params = [];

    // Role Scoping
    if (userRole === 'PATIENT') {
      const pId = await this.findPatientByUserId(userId);
      if (pId) {
        sql += ` AND a.patient_id = ?`;
        params.push(pId);
      } else {
        // Patient has no patient record, return empty
        return [];
      }
    } else if (userRole === 'DOCTOR') {
      const dId = await this.findDoctorByUserId(userId);
      if (dId) {
        sql += ` AND a.doctor_id = ?`;
        params.push(dId);
      } else {
        return [];
      }
    }

    // Direct Filters
    if (patientId) {
      sql += ` AND a.patient_id = ?`;
      params.push(patientId);
    }

    if (doctorId) {
      sql += ` AND a.doctor_id = ?`;
      params.push(doctorId);
    }

    if (status && status.trim()) {
      sql += ` AND a.status = ?`;
      params.push(status.trim().toUpperCase());
    }

    if (date && date.trim()) {
      sql += ` AND a.appointment_date = ?`;
      params.push(date.trim());
    }

    // Search query
    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      sql += `
        AND (
          LOWER(a.appointment_number) LIKE ?
          OR LOWER(CONCAT(pu.first_name, ' ', pu.last_name)) LIKE ?
          OR LOWER(CONCAT(du.first_name, ' ', du.last_name)) LIKE ?
          OR LOWER(d.specialization) LIKE ?
          OR LOWER(dept.name) LIKE ?
          OR LOWER(a.symptoms) LIKE ?
          OR LOWER(a.reason) LIKE ?
        )
      `;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    sql += ` ORDER BY a.appointment_date DESC, a.appointment_time ASC, a.id DESC`;

    const [rows] = await pool.query(sql, params);
    return rows;
  }

  /**
   * Find appointment by ID
   */
  static async findById(id) {
    await this.ensureSchema();

    const sql = `
      SELECT 
        a.id,
        a.appointment_number,
        a.patient_id,
        a.doctor_id,
        a.department_id,
        a.appointment_date,
        a.appointment_time,
        a.status,
        a.type,
        a.appointment_mode,
        a.reason,
        a.symptoms,
        a.consultation_notes,
        a.cancellation_reason,
        a.created_at,
        a.updated_at,
        -- Patient Info
        p.patient_code,
        CONCAT(pu.first_name, ' ', pu.last_name) AS patient_name,
        pu.email AS patient_email,
        pu.phone_number AS patient_phone,
        -- Doctor Info
        CONCAT('Dr. ', du.first_name, ' ', du.last_name) AS doctor_name,
        du.email AS doctor_email,
        d.specialization AS doctor_specialization,
        d.consultation_fee AS doctor_fee,
        -- Department Info
        dept.name AS department_name,
        dept.code AS department_code
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users pu ON p.user_id = pu.id
      JOIN doctors d ON a.doctor_id = d.id
      JOIN users du ON d.user_id = du.id
      JOIN departments dept ON a.department_id = dept.id
      WHERE a.id = ?
    `;

    const [rows] = await pool.query(sql, [id]);
    return rows[0] || null;
  }

  /**
   * Create a new appointment
   */
  static async create({
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
  }) {
    await this.ensureSchema();

    // Auto-generate appointment code e.g. APT-2026-XXXX
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const appointmentNumber = `APT-${year}-${randomSuffix}`;

    const finalStatus = status || 'PENDING';
    const finalMode = appointmentMode || 'OFFLINE';
    const finalType = type || 'FIRST_VISIT';

    const [result] = await pool.query(
      `INSERT INTO appointments
       (appointment_number, patient_id, doctor_id, department_id, appointment_date, appointment_time, status, type, appointment_mode, reason, symptoms)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        appointmentNumber,
        patientId,
        doctorId,
        departmentId,
        appointmentDate,
        appointmentTime,
        finalStatus,
        finalType,
        finalMode,
        reason || symptoms || null,
        symptoms || reason || null
      ]
    );

    return await this.findById(result.insertId);
  }

  /**
   * Update existing appointment
   */
  static async update(
    id,
    {
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
    }
  ) {
    await this.ensureSchema();

    const existing = await this.findById(id);
    if (!existing) return null;

    await pool.query(
      `UPDATE appointments
       SET doctor_id = ?,
           department_id = ?,
           appointment_date = ?,
           appointment_time = ?,
           appointment_mode = ?,
           status = ?,
           type = ?,
           reason = ?,
           symptoms = ?,
           consultation_notes = ?,
           cancellation_reason = ?
       WHERE id = ?`,
      [
        doctorId || existing.doctor_id,
        departmentId || existing.department_id,
        appointmentDate || existing.appointment_date,
        appointmentTime || existing.appointment_time,
        appointmentMode || existing.appointment_mode,
        status || existing.status,
        type || existing.type,
        reason !== undefined ? reason : existing.reason,
        symptoms !== undefined ? symptoms : existing.symptoms,
        consultationNotes !== undefined ? consultationNotes : existing.consultation_notes,
        cancellationReason !== undefined ? cancellationReason : existing.cancellation_reason,
        id
      ]
    );

    return await this.findById(id);
  }

  /**
   * Delete appointment record
   */
  static async delete(id) {
    await this.ensureSchema();
    const [result] = await pool.query(`DELETE FROM appointments WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }
}

module.exports = AppointmentModel;
