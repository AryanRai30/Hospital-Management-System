-- =============================================================================
-- APPOINTMENT MANAGEMENT MODULE DATABASE MIGRATION
-- Target RDBMS: MySQL 8.0+
-- =============================================================================

USE `hospital_management_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Update `appointments` table schema for symptoms, consultation notes, and appointment mode
ALTER TABLE `appointments` ADD COLUMN IF NOT EXISTS `symptoms` TEXT NULL COMMENT 'Patient reported symptoms';
ALTER TABLE `appointments` ADD COLUMN IF NOT EXISTS `consultation_notes` TEXT NULL COMMENT 'Doctor notes and diagnosis';
ALTER TABLE `appointments` ADD COLUMN IF NOT EXISTS `appointment_mode` ENUM('ONLINE', 'OFFLINE') NOT NULL DEFAULT 'OFFLINE' COMMENT 'Consultation format';
ALTER TABLE `appointments` MODIFY COLUMN `status` ENUM('PENDING', 'SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'PENDING';

SET FOREIGN_KEY_CHECKS = 1;
