-- =============================================================================
-- AUTHENTICATION & SECURITY MODULE DATABASE MIGRATION
-- Target RDBMS: MySQL 8.0+
-- =============================================================================

USE `hospital_management_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Extend `users` table for email verification, password reset, and account lockout
ALTER TABLE `users`
  ADD COLUMN `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = Unverified, 1 = Verified' AFTER `is_active`,
  ADD COLUMN `email_verification_token` VARCHAR(255) NULL COMMENT 'Token for email verification' AFTER `is_email_verified`,
  ADD COLUMN `email_verification_expires` DATETIME NULL COMMENT 'Expiration timestamp for email verification token' AFTER `email_verification_token`,
  ADD COLUMN `reset_password_token` VARCHAR(255) NULL COMMENT 'Hashed token for password reset' AFTER `email_verification_expires`,
  ADD COLUMN `reset_password_expires` DATETIME NULL COMMENT 'Expiration timestamp for password reset token' AFTER `reset_password_token`,
  ADD COLUMN `failed_login_attempts` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Consecutive failed login counter' AFTER `reset_password_expires`,
  ADD COLUMN `lockout_until` DATETIME NULL COMMENT 'Timestamp until which account is locked out' AFTER `failed_login_attempts`,
  ADD INDEX `idx_users_email_verification` (`email_verification_token`),
  ADD INDEX `idx_users_reset_password` (`reset_password_token`);

-- 2. Create `refresh_tokens` table for JWT session management & token rotation
CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to users table',
  `token_hash` VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hashed refresh token',
  `expires_at` DATETIME NOT NULL COMMENT 'Refresh token expiration time',
  `is_revoked` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Revoked',
  `ip_address` VARCHAR(45) NULL COMMENT 'Client IP address during login',
  `user_agent` VARCHAR(255) NULL COMMENT 'Client User Agent during login',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_refresh_tokens_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_refresh_tokens_user_id` (`user_id`),
  INDEX `idx_refresh_tokens_token_hash` (`token_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Active JWT refresh tokens for session revocation & rotation';

-- 3. Create `login_history` table for tracking login activity
CREATE TABLE IF NOT EXISTS `login_history` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NULL COMMENT 'Foreign key to users table (NULL if account non-existent)',
  `email` VARCHAR(100) NOT NULL COMMENT 'Login attempt email address',
  `status` ENUM('SUCCESS', 'FAILED', 'ACCOUNT_LOCKED') NOT NULL COMMENT 'Result of login attempt',
  `logout_time` DATETIME NULL COMMENT 'Timestamp when user logged out',
  `ip_address` VARCHAR(45) NULL COMMENT 'Client IP address',
  `user_agent` VARCHAR(255) NULL COMMENT 'Client User Agent string',
  `failure_reason` VARCHAR(255) NULL COMMENT 'Detailed reason for failure',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT `fk_login_history_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_login_history_user_id` (`user_id`),
  INDEX `idx_login_history_email` (`email`),
  INDEX `idx_login_history_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Authentication attempt and security audit history';

SET FOREIGN_KEY_CHECKS = 1;
