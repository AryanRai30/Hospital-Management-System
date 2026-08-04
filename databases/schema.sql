-- =============================================================================
-- SMART HOSPITAL MANAGEMENT SYSTEM DATABASE SCHEMA
-- Target RDBMS: MySQL 8.0+
-- Standard: Third Normal Form (3NF)
-- Architect: Senior Database Architect
-- =============================================================================

CREATE DATABASE IF NOT EXISTS `hospital_management_db` 
  DEFAULT CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

USE `hospital_management_db`;

-- Disable foreign key checks temporarily during table drops/creations
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS `audit_logs`;
DROP TABLE IF EXISTS `login_history`;
DROP TABLE IF EXISTS `refresh_tokens`;
DROP TABLE IF EXISTS `notifications`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `bill_items`;
DROP TABLE IF EXISTS `bills`;
DROP TABLE IF EXISTS `lab_report_items`;
DROP TABLE IF EXISTS `lab_reports`;
DROP TABLE IF EXISTS `lab_tests`;
DROP TABLE IF EXISTS `medicine_stock`;
DROP TABLE IF EXISTS `prescription_items`;
DROP TABLE IF EXISTS `medicines`;
DROP TABLE IF EXISTS `prescriptions`;
DROP TABLE IF EXISTS `appointments`;
DROP TABLE IF EXISTS `patients`;
DROP TABLE IF EXISTS `doctors`;
DROP TABLE IF EXISTS `departments`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- MODULE 1: AUTHENTICATION & ACCESS CONTROL
-- =============================================================================

-- Table: roles
-- Defines system roles for Role-Based Access Control (RBAC).
CREATE TABLE `roles` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Unique role code, e.g., ADMIN, DOCTOR',
  `description` VARCHAR(255) NULL COMMENT 'Human readable role description',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_roles_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='System user roles for access control';

-- Table: users
-- Core authentication user credentials and baseline profile.
CREATE TABLE `users` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `role_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to roles table',
  `first_name` VARCHAR(50) NOT NULL COMMENT 'User first name',
  `last_name` VARCHAR(50) NOT NULL COMMENT 'User last name',
  `email` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Unique login email address',
  `password_hash` VARCHAR(255) NOT NULL COMMENT 'Bcrypt hashed password',
  `phone_number` VARCHAR(20) NULL UNIQUE COMMENT 'Contact phone number',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = Active, 0 = Inactive',
  `is_email_verified` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = Unverified, 1 = Verified',
  `email_verification_token` VARCHAR(255) NULL COMMENT 'Token for email verification',
  `email_verification_expires` DATETIME NULL COMMENT 'Expiration timestamp for email verification token',
  `reset_password_token` VARCHAR(255) NULL COMMENT 'Hashed token for password reset',
  `reset_password_expires` DATETIME NULL COMMENT 'Expiration timestamp for password reset token',
  `failed_login_attempts` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Consecutive failed login counter',
  `lockout_until` DATETIME NULL COMMENT 'Timestamp until which account is locked out',
  `last_login_at` DATETIME NULL COMMENT 'Timestamp of last successful authentication',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_users_roles` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role_id` (`role_id`),
  INDEX `idx_users_is_active` (`is_active`),
  INDEX `idx_users_email_verification` (`email_verification_token`),
  INDEX `idx_users_reset_password` (`reset_password_token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='System user credentials and base account profile';

-- Table: refresh_tokens
-- Active JWT refresh tokens for session revocation & rotation.
CREATE TABLE `refresh_tokens` (
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

-- Table: login_history
-- Authentication attempt and security audit history.
CREATE TABLE `login_history` (
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

-- =============================================================================
-- MODULE 2: HOSPITAL ENTITIES & INFRASTRUCTURE
-- =============================================================================

-- Table: departments
-- Hospital clinical and administrative departments.
CREATE TABLE `departments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL UNIQUE COMMENT 'Department name e.g., Cardiology',
  `code` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Department code e.g., CARD-01',
  `description` TEXT NULL COMMENT 'Department domain & overview',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Status flag',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_departments_name` (`name`),
  INDEX `idx_departments_code` (`code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Hospital organizational and clinical departments';

-- Table: doctors
-- Medical staff details extending users entity.
CREATE TABLE `doctors` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL UNIQUE COMMENT '1-to-1 reference to users table',
  `department_id` BIGINT UNSIGNED NOT NULL COMMENT 'Assigned clinical department',
  `license_number` VARCHAR(50) NOT NULL UNIQUE COMMENT 'Medical council license number',
  `specialization` VARCHAR(100) NOT NULL COMMENT 'Doctor specialization e.g., Neurologist',
  `qualification` VARCHAR(100) NOT NULL COMMENT 'Degrees e.g. MBBS, MD',
  `experience_years` INT UNSIGNED NOT NULL DEFAULT 0 COMMENT 'Years of active practice',
  `consultation_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Outpatient consultation fee',
  `room_number` VARCHAR(20) NULL COMMENT 'Consultation office/chamber room',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_doctors_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_doctors_departments` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_doctors_user_id` (`user_id`),
  INDEX `idx_doctors_department_id` (`department_id`),
  INDEX `idx_doctors_specialization` (`specialization`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Doctor professional profiles and department assignments';

-- Table: patients
-- Patient demographic and medical record metadata.
CREATE TABLE `patients` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NULL UNIQUE COMMENT 'Optional 1-to-1 link to online user account',
  `patient_code` VARCHAR(30) NOT NULL UNIQUE COMMENT 'Unique Medical Record Number (MRN)',
  `date_of_birth` DATE NOT NULL COMMENT 'Patient date of birth',
  `gender` ENUM('MALE', 'FEMALE', 'OTHER') NOT NULL COMMENT 'Biological gender',
  `blood_group` ENUM('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') NULL COMMENT 'Blood type',
  `address` VARCHAR(255) NULL COMMENT 'Street address',
  `city` VARCHAR(50) NULL COMMENT 'City',
  `state` VARCHAR(50) NULL COMMENT 'State/Province',
  `postal_code` VARCHAR(20) NULL COMMENT 'ZIP or postal code',
  `emergency_contact_name` VARCHAR(100) NULL COMMENT 'Emergency contact person',
  `emergency_contact_phone` VARCHAR(20) NULL COMMENT 'Emergency contact phone',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_patients_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_patients_patient_code` (`patient_code`),
  INDEX `idx_patients_user_id` (`user_id`),
  INDEX `idx_patients_dob` (`date_of_birth`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Patient master demographics and medical record references';

-- =============================================================================
-- MODULE 3: APPOINTMENTS
-- =============================================================================

-- Table: appointments
-- Outpatient and consultation appointment bookings.
CREATE TABLE `appointments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `appointment_number` VARCHAR(30) NOT NULL UNIQUE COMMENT 'Unique appointment code e.g. APT-2026-0001',
  `patient_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to patients table',
  `doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to doctors table',
  `department_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to departments table',
  `appointment_date` DATE NOT NULL COMMENT 'Scheduled date',
  `appointment_time` TIME NOT NULL COMMENT 'Scheduled time slot',
  `status` ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW') NOT NULL DEFAULT 'SCHEDULED' COMMENT 'Appointment status lifecycle',
  `type` ENUM('FIRST_VISIT', 'FOLLOW_UP', 'ROUTINE_CHECKUP', 'EMERGENCY') NOT NULL DEFAULT 'FIRST_VISIT' COMMENT 'Visit classification',
  `reason` VARCHAR(255) NULL COMMENT 'Reason for consultation',
  `cancellation_reason` VARCHAR(255) NULL COMMENT 'Notes if cancelled',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_appointments_patients` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointments_doctors` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_appointments_departments` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_appointments_number` (`appointment_number`),
  INDEX `idx_appointments_patient_id` (`patient_id`),
  INDEX `idx_appointments_doctor_id` (`doctor_id`),
  INDEX `idx_appointments_date_status` (`appointment_date`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Patient consultation appointment schedules';

-- =============================================================================
-- MODULE 4: PRESCRIPTIONS & PHARMACY
-- =============================================================================

-- Table: medicines
-- Pharmacy medicine catalog.
CREATE TABLE `medicines` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL COMMENT 'Brand/Trade medicine name',
  `generic_name` VARCHAR(100) NOT NULL COMMENT 'Chemical/Generic compound name',
  `category` VARCHAR(50) NOT NULL COMMENT 'Category e.g. Antibiotic, Analgesic',
  `manufacturer` VARCHAR(100) NOT NULL COMMENT 'Pharmaceutical company name',
  `unit` VARCHAR(20) NOT NULL COMMENT 'Unit form e.g., Tablet, Capsule, Syrup',
  `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Retail price per unit',
  `requires_prescription` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '1 = RX mandatory',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_medicines_name` (`name`),
  INDEX `idx_medicines_generic_name` (`generic_name`),
  INDEX `idx_medicines_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master catalog of pharmaceutical drugs and medicines';

-- Table: medicine_stock
-- Inventory batches and stock tracking per medicine.
CREATE TABLE `medicine_stock` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `medicine_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to medicines table',
  `batch_number` VARCHAR(50) NOT NULL COMMENT 'Manufacturer batch/lot identifier',
  `quantity_in_stock` INT NOT NULL DEFAULT 0 COMMENT 'Current available physical quantity',
  `reorder_level` INT NOT NULL DEFAULT 10 COMMENT 'Threshold for low-stock alerting',
  `expiry_date` DATE NOT NULL COMMENT 'Batch expiration date',
  `purchase_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Wholesale cost price',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_medicine_stock_medicines` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_medicine_stock_medicine_id` (`medicine_id`),
  INDEX `idx_medicine_stock_expiry` (`expiry_date`),
  INDEX `idx_medicine_stock_batch` (`batch_number`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pharmacy inventory batch stock and expiry tracking';

-- Table: prescriptions
-- Medical prescriptions authored by doctors during appointments.
CREATE TABLE `prescriptions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `prescription_number` VARCHAR(30) NOT NULL UNIQUE COMMENT 'Unique RX code e.g. RX-2026-0001',
  `appointment_id` BIGINT UNSIGNED NOT NULL UNIQUE COMMENT '1-to-1 link to consultation appointment',
  `patient_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to patients table',
  `doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to doctors table',
  `diagnosis` TEXT NOT NULL COMMENT 'Clinical diagnostic findings',
  `doctor_notes` TEXT NULL COMMENT 'Dietary/Lifestyle recommendations',
  `prescribed_date` DATE NOT NULL COMMENT 'Prescription issued date',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_prescriptions_appointments` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_prescriptions_patients` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_prescriptions_doctors` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_prescriptions_number` (`prescription_number`),
  INDEX `idx_prescriptions_patient_id` (`patient_id`),
  INDEX `idx_prescriptions_doctor_id` (`doctor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Prescription master header records';

-- Table: prescription_items
-- Specific drug line items attached to a prescription.
CREATE TABLE `prescription_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `prescription_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to prescriptions table',
  `medicine_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to medicines table',
  `dosage` VARCHAR(50) NOT NULL COMMENT 'Dosage strength e.g., 500mg',
  `frequency` VARCHAR(50) NOT NULL COMMENT 'Administration frequency e.g., 1-0-1 After Meals',
  `duration_days` INT UNSIGNED NOT NULL COMMENT 'Number of days to administer',
  `instructions` VARCHAR(255) NULL COMMENT 'Special consumption instructions',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_prescription_items_prescriptions` FOREIGN KEY (`prescription_id`) REFERENCES `prescriptions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_prescription_items_medicines` FOREIGN KEY (`medicine_id`) REFERENCES `medicines` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_rx_items_prescription_id` (`prescription_id`),
  INDEX `idx_rx_items_medicine_id` (`medicine_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Prescription drug line items';

-- =============================================================================
-- MODULE 5: LABORATORY & DIAGNOSTICS
-- =============================================================================

-- Table: lab_tests
-- Master diagnostic test catalog.
CREATE TABLE `lab_tests` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `test_code` VARCHAR(20) NOT NULL UNIQUE COMMENT 'Diagnostic code e.g., CBC-01',
  `test_name` VARCHAR(100) NOT NULL COMMENT 'Test name e.g. Complete Blood Count',
  `category` VARCHAR(50) NOT NULL COMMENT 'Category e.g., Hematology, Biochemistry',
  `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Standard charge for test',
  `normal_range` VARCHAR(100) NULL COMMENT 'Healthy baseline reference range',
  `unit` VARCHAR(20) NULL COMMENT 'Measurement unit e.g., g/dL, mg/dL',
  `description` TEXT NULL COMMENT 'Test procedure description',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_lab_tests_code` (`test_code`),
  INDEX `idx_lab_tests_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master catalog of laboratory diagnostic tests';

-- Table: lab_reports
-- Lab test requisition and report header.
CREATE TABLE `lab_reports` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `report_number` VARCHAR(30) NOT NULL UNIQUE COMMENT 'Unique report identifier e.g. LAB-2026-0001',
  `patient_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to patients table',
  `doctor_id` BIGINT UNSIGNED NOT NULL COMMENT 'Ordering doctor foreign key',
  `lab_technician_id` BIGINT UNSIGNED NULL COMMENT 'Technician performing analysis',
  `appointment_id` BIGINT UNSIGNED NULL COMMENT 'Associated consultation appointment',
  `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING' COMMENT 'Report status workflow',
  `sample_collected_at` DATETIME NULL COMMENT 'Time specimen sample collected',
  `result_date` DATETIME NULL COMMENT 'Time results generated',
  `overall_impression` TEXT NULL COMMENT 'Pathologist overall summary',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_lab_reports_patients` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_reports_doctors` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_reports_technicians` FOREIGN KEY (`lab_technician_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_reports_appointments` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_lab_reports_number` (`report_number`),
  INDEX `idx_lab_reports_patient_id` (`patient_id`),
  INDEX `idx_lab_reports_doctor_id` (`doctor_id`),
  INDEX `idx_lab_reports_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Laboratory diagnostic report headers';

-- Table: lab_report_items
-- Individual test results recorded under a report.
CREATE TABLE `lab_report_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `lab_report_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to lab_reports table',
  `lab_test_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to lab_tests table',
  `result_value` VARCHAR(100) NOT NULL COMMENT 'Observed measurement/result',
  `remarks` VARCHAR(255) NULL COMMENT 'Technician specific notes',
  `is_abnormal` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = Result outside normal range',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_lab_report_items_reports` FOREIGN KEY (`lab_report_id`) REFERENCES `lab_reports` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_lab_report_items_tests` FOREIGN KEY (`lab_test_id`) REFERENCES `lab_tests` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_lab_report_items_report_id` (`lab_report_id`),
  INDEX `idx_lab_report_items_test_id` (`lab_test_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Individual test result line items';

-- =============================================================================
-- MODULE 6: BILLING & PAYMENTS
-- =============================================================================

-- Table: bills
-- Financial invoices issued to patients.
CREATE TABLE `bills` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `invoice_number` VARCHAR(30) NOT NULL UNIQUE COMMENT 'Unique invoice number e.g. INV-2026-0001',
  `patient_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to patients table',
  `appointment_id` BIGINT UNSIGNED NULL COMMENT 'Associated appointment if applicable',
  `total_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Gross item total',
  `discount_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Concession/discount applied',
  `tax_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Applicable tax amount',
  `net_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Net payable amount',
  `paid_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Cumulative amount paid',
  `due_amount` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Outstanding balance',
  `payment_status` ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED') NOT NULL DEFAULT 'UNPAID' COMMENT 'Payment state',
  `due_date` DATE NOT NULL COMMENT 'Payment deadline date',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bills_patients` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_bills_appointments` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_bills_invoice_number` (`invoice_number`),
  INDEX `idx_bills_patient_id` (`patient_id`),
  INDEX `idx_bills_payment_status` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Master billing invoice statements';

-- Table: bill_items
-- Detailed line items contained inside an invoice.
CREATE TABLE `bill_items` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `bill_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to bills table',
  `item_type` ENUM('CONSULTATION', 'MEDICINE', 'LAB_TEST', 'ROOM_CHARGE', 'OTHER') NOT NULL COMMENT 'Item category',
  `item_description` VARCHAR(255) NOT NULL COMMENT 'Item description name',
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Quantity billed',
  `unit_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Price per unit',
  `total_price` DECIMAL(10, 2) NOT NULL DEFAULT 0.00 COMMENT 'Line item calculated total',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_bill_items_bills` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_bill_items_bill_id` (`bill_id`),
  INDEX `idx_bill_items_type` (`item_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Line items for patient billing invoices';

-- Table: payments
-- Payment transaction receipts recorded against bills.
CREATE TABLE `payments` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `receipt_number` VARCHAR(30) NOT NULL UNIQUE COMMENT 'Unique payment receipt e.g. REC-2026-0001',
  `bill_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to bills table',
  `patient_id` BIGINT UNSIGNED NOT NULL COMMENT 'Foreign key to patients table',
  `amount_paid` DECIMAL(10, 2) NOT NULL COMMENT 'Transaction payment amount',
  `payment_method` ENUM('CASH', 'CREDIT_CARD', 'DEBIT_CARD', 'UPI', 'NET_BANKING', 'INSURANCE') NOT NULL COMMENT 'Payment mode',
  `transaction_reference` VARCHAR(100) NULL COMMENT 'Bank/PG reference identifier',
  `payment_date` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'Timestamp payment processed',
  `status` ENUM('SUCCESS', 'FAILED', 'PENDING', 'REFUNDED') NOT NULL DEFAULT 'SUCCESS' COMMENT 'Transaction result status',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_payments_bills` FOREIGN KEY (`bill_id`) REFERENCES `bills` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_patients` FOREIGN KEY (`patient_id`) REFERENCES `patients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_payments_receipt_number` (`receipt_number`),
  INDEX `idx_payments_bill_id` (`bill_id`),
  INDEX `idx_payments_patient_id` (`patient_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Patient payment settlement transaction receipts';

-- =============================================================================
-- MODULE 7: SYSTEM NOTIFICATIONS & AUDIT LOGGING
-- =============================================================================

-- Table: notifications
-- User notifications for appointments, lab results, and billing alerts.
CREATE TABLE `notifications` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT 'Target recipient user ID',
  `title` VARCHAR(100) NOT NULL COMMENT 'Notification headline',
  `message` TEXT NOT NULL COMMENT 'Notification body message',
  `type` ENUM('APPOINTMENT_REMINDER', 'LAB_RESULT_READY', 'BILL_DUE', 'SYSTEM_ALERT', 'GENERAL') NOT NULL DEFAULT 'GENERAL' COMMENT 'Notification type',
  `is_read` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = Unread, 1 = Read',
  `read_at` DATETIME NULL COMMENT 'Time read by user',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_notifications_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_notifications_user_id` (`user_id`),
  INDEX `idx_notifications_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='System user alerts and push notification records';

-- Table: audit_logs
-- Immutable compliance audit trail tracking user actions.
CREATE TABLE `audit_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT UNSIGNED NULL COMMENT 'User performing action (NULL if system auto)',
  `action` VARCHAR(50) NOT NULL COMMENT 'Action code e.g. CREATE_APPOINTMENT, UPDATE_PATIENT',
  `entity_name` VARCHAR(50) NOT NULL COMMENT 'Target database table e.g. appointments',
  `entity_id` BIGINT UNSIGNED NULL COMMENT 'Target entity primary key ID',
  `old_values` JSON NULL COMMENT 'State snapshot prior to update/delete',
  `new_values` JSON NULL COMMENT 'State snapshot after create/update',
  `ip_address` VARCHAR(45) NULL COMMENT 'Client IPv4/IPv6 address',
  `user_agent` VARCHAR(255) NULL COMMENT 'Client web browser / application agent',
  `created_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `fk_audit_logs_users` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_audit_logs_user_id` (`user_id`),
  INDEX `idx_audit_logs_action` (`action`),
  INDEX `idx_audit_logs_entity` (`entity_name`),
  INDEX `idx_audit_logs_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Immutable security and compliance audit trail events';
