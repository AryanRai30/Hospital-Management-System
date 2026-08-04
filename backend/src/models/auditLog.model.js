const { pool } = require('../config/db.config');

class AuditLogModel {
  /**
   * Log an immutable audit event
   */
  static async log({ userId = null, action, entityName, entityId = null, oldValues = null, newValues = null, ipAddress = null, userAgent = null }) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, action, entity_name, entity_id, old_values, new_values, ip_address, user_agent)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId,
          action,
          entityName,
          entityId,
          oldValues ? JSON.stringify(oldValues) : null,
          newValues ? JSON.stringify(newValues) : null,
          ipAddress,
          userAgent
        ]
      );
    } catch (error) {
      console.error('Failed to insert audit log:', error.message);
    }
  }

  /**
   * Fetch audit logs for compliance review
   */
  static async getLogs({ userId = null, action = null, limit = 50, offset = 0 }) {
    let sql = `SELECT a.*, u.email as user_email, u.first_name, u.last_name 
               FROM audit_logs a 
               LEFT JOIN users u ON a.user_id = u.id 
               WHERE 1=1`;
    const params = [];

    if (userId) {
      sql += ` AND a.user_id = ?`;
      params.push(userId);
    }

    if (action) {
      sql += ` AND a.action = ?`;
      params.push(action);
    }

    sql += ` ORDER BY a.created_at DESC LIMIT ? OFFSET ?`;
    params.push(Number(limit), Number(offset));

    const [rows] = await pool.query(sql, params);
    return rows;
  }
}

module.exports = AuditLogModel;
