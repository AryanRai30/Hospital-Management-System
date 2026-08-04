const { pool } = require('../config/db.config');

class UserModel {
  /**
   * Find role by name (e.g. 'ADMIN', 'DOCTOR', 'PATIENT', 'RECEPTIONIST', 'PHARMACIST', 'LAB_TECHNICIAN')
   */
  static async getRoleByName(roleName) {
    const [rows] = await pool.query(
      'SELECT id, name, description FROM roles WHERE name = ?',
      [roleName.toUpperCase()]
    );
    return rows[0] || null;
  }

  /**
   * Find role by ID
   */
  static async getRoleById(roleId) {
    const [rows] = await pool.query(
      'SELECT id, name, description FROM roles WHERE id = ?',
      [roleId]
    );
    return rows[0] || null;
  }

  /**
   * Find user by Email with role name
   */
  static async findByEmail(email) {
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email = ?`,
      [email.toLowerCase().trim()]
    );
    return rows[0] || null;
  }

  /**
   * Find user by ID with role name
   */
  static async findById(id) {
    const [rows] = await pool.query(
      `SELECT u.id, u.role_id, u.first_name, u.last_name, u.email, u.phone_number, 
              u.is_active, u.is_email_verified, u.failed_login_attempts, u.lockout_until, 
              u.last_login_at, u.created_at, u.updated_at, r.name as role_name 
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find user with password hash by ID (for password operations)
   */
  static async findByIdWithPassword(id) {
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = ?`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Create a new user record
   */
  static async create({ roleId, firstName, lastName, email, passwordHash, phoneNumber, emailVerificationToken, emailVerificationExpires }) {
    const [result] = await pool.query(
      `INSERT INTO users 
       (role_id, first_name, last_name, email, password_hash, phone_number, is_email_verified, email_verification_token, email_verification_expires) 
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        roleId,
        firstName.trim(),
        lastName.trim(),
        email.toLowerCase().trim(),
        passwordHash,
        phoneNumber || null,
        emailVerificationToken || null,
        emailVerificationExpires || null
      ]
    );

    // If patient role, optionally create patient record entry
    const role = await this.getRoleById(roleId);
    if (role && role.name === 'PATIENT') {
      const patientCode = `PAT-${new Date().getFullYear()}-${String(result.insertId).padStart(4, '0')}`;
      await pool.query(
        `INSERT INTO patients (user_id, patient_code, date_of_birth, gender)
         VALUES (?, ?, '1990-01-01', 'OTHER')
         ON DUPLICATE KEY UPDATE user_id = VALUES(user_id)`,
        [result.insertId, patientCode]
      );
    }

    return this.findById(result.insertId);
  }

  /**
   * Update user last login timestamp
   */
  static async updateLastLogin(id) {
    await pool.query(
      `UPDATE users SET last_login_at = NOW(), failed_login_attempts = 0, lockout_until = NULL WHERE id = ?`,
      [id]
    );
  }

  /**
   * Increment failed login attempts
   */
  static async incrementFailedAttempts(id) {
    await pool.query(
      `UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?`,
      [id]
    );
  }

  /**
   * Lock account until specified timestamp
   */
  static async lockAccount(id, lockoutUntil) {
    await pool.query(
      `UPDATE users SET lockout_until = ? WHERE id = ?`,
      [lockoutUntil, id]
    );
  }

  /**
   * Reset failed attempts and unlock account
   */
  static async resetFailedAttempts(id) {
    await pool.query(
      `UPDATE users SET failed_login_attempts = 0, lockout_until = NULL WHERE id = ?`,
      [id]
    );
  }

  /**
   * Store email verification token
   */
  static async setEmailVerificationToken(id, token, expiresAt) {
    await pool.query(
      `UPDATE users SET email_verification_token = ?, email_verification_expires = ? WHERE id = ?`,
      [token, expiresAt, id]
    );
  }

  /**
   * Find user by email verification token
   */
  static async findByEmailVerificationToken(token) {
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.email_verification_token = ?`,
      [token]
    );
    return rows[0] || null;
  }

  /**
   * Verify email address
   */
  static async markEmailAsVerified(id) {
    await pool.query(
      `UPDATE users SET is_email_verified = 1, email_verification_token = NULL, email_verification_expires = NULL WHERE id = ?`,
      [id]
    );
  }

  /**
   * Store password reset token
   */
  static async setResetPasswordToken(id, tokenHash, expiresAt) {
    await pool.query(
      `UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?`,
      [tokenHash, expiresAt, id]
    );
  }

  /**
   * Find user by password reset token
   */
  static async findByResetToken(tokenHash) {
    const [rows] = await pool.query(
      `SELECT u.*, r.name as role_name 
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.reset_password_token = ?`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  /**
   * Update password hash and clear reset token
   */
  static async updatePassword(id, newPasswordHash) {
    await pool.query(
      `UPDATE users 
       SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL, failed_login_attempts = 0, lockout_until = NULL 
       WHERE id = ?`,
      [newPasswordHash, id]
    );
  }
}

module.exports = UserModel;
