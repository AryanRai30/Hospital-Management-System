-- =============================================================================
-- PATIENT MANAGEMENT MODULE DATABASE MIGRATION
-- Target RDBMS: MySQL 8.0+
-- =============================================================================

USE `hospital_management_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- Extend `patients` table to store medical vitals, history & insurance information
ALTER TABLE `patients` ADD COLUMN IF NOT EXISTS `height_cm` DECIMAL(5, 2) NULL COMMENT 'Height in centimeters';
ALTER TABLE `patients` ADD COLUMN IF NOT EXISTS `weight_kg` DECIMAL(5, 2) NULL COMMENT 'Weight in kilograms';
ALTER TABLE `patients` ADD COLUMN IF NOT EXISTS `allergies` TEXT NULL COMMENT 'Known allergies description';
ALTER TABLE `patients` ADD COLUMN IF NOT EXISTS `medical_conditions` TEXT NULL COMMENT 'Pre-existing medical conditions';
ALTER TABLE `patients` ADD COLUMN IF NOT EXISTS `current_medications` TEXT NULL COMMENT 'Current active medications';
ALTER TABLE `patients` ADD COLUMN IF NOT EXISTS `insurance_provider` VARCHAR(100) NULL COMMENT 'Health insurance company name';
ALTER TABLE `patients` ADD COLUMN IF NOT EXISTS `insurance_policy_number` VARCHAR(100) NULL COMMENT 'Insurance policy or ID number';

SET FOREIGN_KEY_CHECKS = 1;
