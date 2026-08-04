const { pool } = require('../config/db.config');

class RefreshTokenModel {
  /**
   * Save refresh token hash for user
   */
  static async create({ userId, tokenHash, expiresAt, ipAddress, userAgent }) {
    const [result] = await pool.query(
      `INSERT INTO refresh_tokens (user_id, token_hash, expires_at, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?)`,
      [userId, tokenHash, expiresAt, ipAddress || null, userAgent || null]
    );
    return result.insertId;
  }

  /**
   * Find refresh token entry by token hash
   */
  static async findByTokenHash(tokenHash) {
    const [rows] = await pool.query(
      `SELECT * FROM refresh_tokens WHERE token_hash = ? AND is_revoked = 0`,
      [tokenHash]
    );
    return rows[0] || null;
  }

  /**
   * Revoke a single refresh token by hash
   */
  static async revokeToken(tokenHash) {
    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = 1 WHERE token_hash = ?`,
      [tokenHash]
    );
  }

  /**
   * Revoke all refresh tokens for a user (e.g., on logout all devices / password change)
   */
  static async revokeAllUserTokens(userId) {
    await pool.query(
      `UPDATE refresh_tokens SET is_revoked = 1 WHERE user_id = ?`,
      [userId]
    );
  }

  /**
   * Delete expired or revoked refresh tokens
   */
  static async cleanupExpiredTokens() {
    await pool.query(
      `DELETE FROM refresh_tokens WHERE expires_at < NOW() OR is_revoked = 1`
    );
  }
}

module.exports = RefreshTokenModel;
