-- =============================================================================
-- MIGRATION SCRIPT: Phase 5.5 - Enterprise Billing & Payment Module
-- Non-destructive ALTER TABLE statements for MySQL database
-- =============================================================================

USE `hospital_management_db`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Extend `bills` table columns
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `doctor_id` BIGINT UNSIGNED NULL AFTER `patient_id`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `department_id` BIGINT UNSIGNED NULL AFTER `doctor_id`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `consultation_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `appointment_id`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `lab_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `consultation_fee`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `medicine_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `lab_charges`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `procedure_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `medicine_charges`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `room_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `procedure_charges`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `additional_charges` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `room_charges`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `grand_total` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER `tax_amount`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `payment_method` VARCHAR(50) NULL AFTER `payment_status`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `transaction_id` VARCHAR(100) NULL AFTER `payment_method`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `razorpay_order_id` VARCHAR(100) NULL AFTER `transaction_id`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `razorpay_payment_id` VARCHAR(100) NULL AFTER `razorpay_order_id`;
ALTER TABLE `bills` ADD COLUMN IF NOT EXISTS `razorpay_signature` VARCHAR(255) NULL AFTER `razorpay_payment_id`;

-- 2. Modify payment_status ENUM on `bills` to include all phase 5.5 states
ALTER TABLE `bills` MODIFY COLUMN `payment_status` ENUM('Pending', 'Paid', 'Partially Paid', 'Failed', 'Refunded', 'Cancelled', 'UNPAID', 'PARTIALLY_PAID', 'PAID') NOT NULL DEFAULT 'Pending';

-- 3. Extend `payments` table columns
ALTER TABLE `payments` ADD COLUMN IF NOT EXISTS `doctor_id` BIGINT UNSIGNED NULL AFTER `patient_id`;
ALTER TABLE `payments` ADD COLUMN IF NOT EXISTS `razorpay_order_id` VARCHAR(100) NULL AFTER `transaction_reference`;
ALTER TABLE `payments` ADD COLUMN IF NOT EXISTS `razorpay_payment_id` VARCHAR(100) NULL AFTER `razorpay_order_id`;
ALTER TABLE `payments` ADD COLUMN IF NOT EXISTS `razorpay_signature` VARCHAR(255) NULL AFTER `razorpay_payment_id`;

-- 4. Foreign key constraints (if not already existing)
ALTER TABLE `bills` ADD CONSTRAINT `fk_bills_doctors` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `bills` ADD CONSTRAINT `fk_bills_departments` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

SET FOREIGN_KEY_CHECKS = 1;
