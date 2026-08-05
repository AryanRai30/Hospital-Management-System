-- =============================================================================
-- DOCTOR MANAGEMENT MODULE DATABASE MIGRATION
-- Target RDBMS: MySQL 8.0+
-- =============================================================================

USE `hospital_management_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Update existing `doctors` table schema (preserving all existing data)
ALTER TABLE `doctors` ADD COLUMN IF NOT EXISTS `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL COMMENT 'Biological gender';
ALTER TABLE `doctors` ADD COLUMN IF NOT EXISTS `date_of_birth` DATE NULL COMMENT 'Doctor date of birth';
ALTER TABLE `doctors` ADD COLUMN IF NOT EXISTS `address` VARCHAR(255) NULL COMMENT 'Residential address';
ALTER TABLE `doctors` ADD COLUMN IF NOT EXISTS `profile_photo` VARCHAR(255) NULL COMMENT 'Profile photo placeholder or URL';

SET FOREIGN_KEY_CHECKS = 1;
