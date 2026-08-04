const { pool } = require('../config/db.config');

class LoginHistoryModel {
  /**
   * Record login attempt
   */
  static async record({ userId = null, email, status, ipAddress = null, userAgent = null, failureReason = null }) {
    try {
      const [result] = await pool.query(
        `INSERT INTO login_history (user_id, email, status, ip_address, user_agent, failure_reason)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, email.toLowerCase().trim(), status, ipAddress, userAgent, failureReason]
      );
      return result.insertId;
    } catch (error) {
      console.error('Failed to log login history:', error.message);
      return null;
    }
  }

  /**
   * Record logout timestamp for latest active login session
   */
  static async recordLogout(userId) {
    try {
      await pool.query(
        `UPDATE login_history 
         SET logout_time = NOW() 
         WHERE user_id = ? AND status = 'SUCCESS' AND logout_time IS NULL 
         ORDER BY created_at DESC LIMIT 1`,
        [userId]
      );
    } catch (error) {
      console.error('Failed to record logout timestamp:', error.message);
    }
  }

  /**
   * Get login history for user
   */
  static async getByUserId(userId, limit = 20) {
    const [rows] = await pool.query(
      `SELECT * FROM login_history WHERE user_id = ? ORDER BY created_at DESC LIMIT ?`,
      [userId, limit]
    );
    return rows;
  }
}

module.exports = LoginHistoryModel;
