-- =============================================================================
-- SMART HOSPITAL MANAGEMENT SYSTEM SAMPLE DATA INSERTS
-- Target RDBMS: MySQL 8.0+
-- Architect: Senior Database Architect
-- =============================================================================

USE `hospital_management_db`;

-- Disable foreign key checks for bulk seed
SET FOREIGN_KEY_CHECKS = 0;

TRUNCATE TABLE `audit_logs`;
TRUNCATE TABLE `notifications`;
TRUNCATE TABLE `payments`;
TRUNCATE TABLE `bill_items`;
TRUNCATE TABLE `bills`;
TRUNCATE TABLE `lab_report_items`;
TRUNCATE TABLE `lab_reports`;
TRUNCATE TABLE `lab_tests`;
TRUNCATE TABLE `medicine_stock`;
TRUNCATE TABLE `prescription_items`;
TRUNCATE TABLE `medicines`;
TRUNCATE TABLE `prescriptions`;
TRUNCATE TABLE `appointments`;
TRUNCATE TABLE `patients`;
TRUNCATE TABLE `doctors`;
TRUNCATE TABLE `departments`;
TRUNCATE TABLE `users`;
TRUNCATE TABLE `roles`;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- 1. SEED ROLES
-- =============================================================================
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'System Administrator with full access rights'),
(2, 'DOCTOR', 'Medical doctor managing patient diagnosis and prescriptions'),
(3, 'NURSE', 'Nursing staff supporting clinical care'),
(4, 'PATIENT', 'Hospital patient accessing personal health records'),
(5, 'RECEPTIONIST', 'Front-desk administrative staff booking appointments'),
(6, 'PHARMACIST', 'Pharmacy staff managing inventory and dispensing drugs'),
(7, 'LAB_TECHNICIAN', 'Laboratory staff executing diagnostic tests');

-- =============================================================================
-- 2. SEED USERS
-- =============================================================================
-- Password hash sample corresponds to bcrypt hash of 'Password123!'
INSERT INTO `users` (`id`, `role_id`, `first_name`, `last_name`, `email`, `password_hash`, `phone_number`, `is_active`) VALUES
(1, 1, 'Alexander', 'Pierce', 'admin@hospital.com', '$2a$12$eImiTXuWVxfM37uY4JANjO5E/7e/6iNf8E3O/K8L9W0w1m2n3o4p5', '+15550001111', 1),
(2, 2, 'Emily', 'Watson', 'dr.watson@hospital.com', '$2a$12$eImiTXuWVxfM37uY4JANjO5E/7e/6iNf8E3O/K8L9W0w1m2n3o4p5', '+15550002222', 1),
(3, 2, 'Robert', 'Chen', 'dr.chen@hospital.com', '$2a$12$eImiTXuWVxfM37uY4JANjO5E/7e/6iNf8E3O/K8L9W0w1m2n3o4p5', '+15550003333', 1),
(4, 4, 'John', 'Doe', 'john.doe@example.com', '$2a$12$eImiTXuWVxfM37uY4JANjO5E/7e/6iNf8E3O/K8L9W0w1m2n3o4p5', '+15550004444', 1),
(5, 4, 'Sarah', 'Jenkins', 'sarah.j@example.com', '$2a$12$eImiTXuWVxfM37uY4JANjO5E/7e/6iNf8E3O/K8L9W0w1m2n3o4p5', '+15550005555', 1),
(6, 5, 'Jessica', 'Alba', 'receptionist@hospital.com', '$2a$12$eImiTXuWVxfM37uY4JANjO5E/7e/6iNf8E3O/K8L9W0w1m2n3o4p5', '+15550006666', 1),
(7, 6, 'Michael', 'Scott', 'pharmacy@hospital.com', '$2a$12$eImiTXuWVxfM37uY4JANjO5E/7e/6iNf8E3O/K8L9W0w1m2n3o4p5', '+15550007777', 1),
(8, 7, 'David', 'Miller', 'lab.tech@hospital.com', '$2a$12$eImiTXuWVxfM37uY4JANjO5E/7e/6iNf8E3O/K8L9W0w1m2n3o4p5', '+15550008888', 1);

-- =============================================================================
-- 3. SEED DEPARTMENTS
-- =============================================================================
INSERT INTO `departments` (`id`, `name`, `code`, `description`, `is_active`) VALUES
(1, 'Cardiology', 'CARD-01', 'Heart and cardiovascular care center', 1),
(2, 'Neurology', 'NEUR-01', 'Brain, spinal cord, and nervous system care', 1),
(3, 'Pediatrics', 'PED-01', 'Infant, child, and adolescent medical care', 1),
(4, 'Orthopedics', 'ORTH-01', 'Bones, joints, and musculoskeletal care', 1),
(5, 'General Medicine', 'GEN-01', 'Primary care and internal medicine', 1);

-- =============================================================================
-- 4. SEED DOCTORS
-- =============================================================================
INSERT INTO `doctors` (`id`, `user_id`, `department_id`, `license_number`, `specialization`, `qualification`, `experience_years`, `consultation_fee`, `room_number`) VALUES
(1, 2, 1, 'MED-LIC-88901', 'Cardiologist', 'MBBS, MD (Cardiology)', 12, 150.00, 'Suite 301'),
(2, 3, 2, 'MED-LIC-99234', 'Neurologist', 'MBBS, DM (Neurology)', 9, 180.00, 'Suite 405');

-- =============================================================================
-- 5. SEED PATIENTS
-- =============================================================================
INSERT INTO `patients` (`id`, `user_id`, `patient_code`, `date_of_birth`, `gender`, `blood_group`, `address`, `city`, `state`, `postal_code`, `emergency_contact_name`, `emergency_contact_phone`) VALUES
(1, 4, 'PAT-2026-0001', '1990-05-15', 'MALE', 'O+', '742 Evergreen Terrace', 'Springfield', 'OR', '97477', 'Jane Doe', '+15550009999'),
(2, 5, 'PAT-2026-0002', '1985-11-20', 'FEMALE', 'A+', '123 Maple Street', 'Metropolis', 'NY', '10001', 'Mark Jenkins', '+15550008888');

-- =============================================================================
-- 6. SEED APPOINTMENTS
-- =============================================================================
INSERT INTO `appointments` (`id`, `appointment_number`, `patient_id`, `doctor_id`, `department_id`, `appointment_date`, `appointment_time`, `status`, `type`, `reason`) VALUES
(1, 'APT-2026-0001', 1, 1, 1, '2026-08-05', '10:00:00', 'CONFIRMED', 'FIRST_VISIT', 'Routine cardiac evaluation and chest pain assessment'),
(2, 'APT-2026-0002', 2, 2, 2, '2026-08-06', '14:30:00', 'SCHEDULED', 'FOLLOW_UP', 'Chronic migraine follow-up consultation');

-- =============================================================================
-- 7. SEED MEDICINES & STOCK
-- =============================================================================
INSERT INTO `medicines` (`id`, `name`, `generic_name`, `category`, `manufacturer`, `unit`, `unit_price`, `requires_prescription`) VALUES
(1, 'Lipitor 20mg', 'Atorvastatin', 'Cardiovascular', 'Pfizer', 'Tablet', 1.50, 1),
(2, 'Amoxil 500mg', 'Amoxicillin', 'Antibiotic', 'GlaxoSmithKline', 'Capsule', 0.80, 1),
(3, 'Tylenol 500mg', 'Paracetamol', 'Analgesic', 'Johnson & Johnson', 'Tablet', 0.25, 0),
(4, 'Glucophage 500mg', 'Metformin', 'Antidiabetic', 'Merck', 'Tablet', 0.60, 1);

INSERT INTO `medicine_stock` (`id`, `medicine_id`, `batch_number`, `quantity_in_stock`, `reorder_level`, `expiry_date`, `purchase_price`) VALUES
(1, 1, 'BATCH-ATV-2025', 500, 50, '2027-12-31', 0.90),
(2, 2, 'BATCH-AMX-2025', 1200, 100, '2027-06-30', 0.40),
(3, 3, 'BATCH-TYL-2026', 3000, 200, '2028-05-15', 0.10),
(4, 4, 'BATCH-GLU-2025', 800, 80, '2027-09-20', 0.30);

-- =============================================================================
-- 8. SEED PRESCRIPTIONS & ITEMS
-- =============================================================================
INSERT INTO `prescriptions` (`id`, `prescription_number`, `appointment_id`, `patient_id`, `doctor_id`, `diagnosis`, `doctor_notes`, `prescribed_date`) VALUES
(1, 'RX-2026-0001', 1, 1, 1, 'Mild Hyperlipidemia and stress-induced chest tightness', 'Maintain low-sodium diet, exercise 30 mins daily', '2026-08-05');

INSERT INTO `prescription_items` (`id`, `prescription_id`, `medicine_id`, `dosage`, `frequency`, `duration_days`, `instructions`) VALUES
(1, 1, 1, '20mg', '0-0-1 (At Bedtime)', 30, 'Take after dinner with water'),
(2, 1, 3, '500mg', '1-0-1 (As needed)', 5, 'Take if experiencing mild headache or discomfort');

-- =============================================================================
-- 9. SEED LAB TESTS, REPORTS & ITEMS
-- =============================================================================
INSERT INTO `lab_tests` (`id`, `test_code`, `test_name`, `category`, `cost`, `normal_range`, `unit`, `description`) VALUES
(1, 'LIP-01', 'Lipid Profile Panel', 'Biochemistry', 85.00, 'Desirable < 200', 'mg/dL', 'Measures total cholesterol, HDL, LDL, and triglycerides'),
(2, 'CBC-01', 'Complete Blood Count', 'Hematology', 45.00, '4.5 - 11.0', 'x10^3/uL', 'Evaluates overall health and detects broad range of disorders');

INSERT INTO `lab_reports` (`id`, `report_number`, `patient_id`, `doctor_id`, `lab_technician_id`, `appointment_id`, `status`, `sample_collected_at`, `result_date`, `overall_impression`) VALUES
(1, 'LAB-2026-0001', 1, 1, 8, 1, 'COMPLETED', '2026-08-05 10:30:00', '2026-08-05 14:00:00', 'Borderline elevated total cholesterol; HDL levels within healthy limits.');

INSERT INTO `lab_report_items` (`id`, `lab_report_id`, `lab_test_id`, `result_value`, `remarks`, `is_abnormal`) VALUES
(1, 1, 1, '215', 'Total Cholesterol slightly elevated', 1),
(2, 1, 2, '7.2', 'WBC count normal', 0);

-- =============================================================================
-- 10. SEED BILLS, ITEMS & PAYMENTS
-- =============================================================================
INSERT INTO `bills` (`id`, `invoice_number`, `patient_id`, `appointment_id`, `total_amount`, `discount_amount`, `tax_amount`, `net_amount`, `paid_amount`, `due_amount`, `payment_status`, `due_date`) VALUES
(1, 'INV-2026-0001', 1, 1, 235.00, 10.00, 12.00, 237.00, 237.00, 0.00, 'PAID', '2026-08-05');

INSERT INTO `bill_items` (`id`, `bill_id`, `item_type`, `item_description`, `quantity`, `unit_price`, `total_price`) VALUES
(1, 1, 'CONSULTATION', 'Cardiology Outpatient Specialist Consultation Fee', 1, 150.00, 150.00),
(2, 1, 'LAB_TEST', 'Lipid Profile Diagnostic Panel', 1, 85.00, 85.00);

INSERT INTO `payments` (`id`, `receipt_number`, `bill_id`, `patient_id`, `amount_paid`, `payment_method`, `transaction_reference`, `status`) VALUES
(1, 'REC-2026-0001', 1, 1, 237.00, 'CREDIT_CARD', 'TXN-CARD-99882211', 'SUCCESS');

-- =============================================================================
-- 11. SEED NOTIFICATIONS & AUDIT LOGS
-- =============================================================================
INSERT INTO `notifications` (`id`, `user_id`, `title`, `message`, `type`, `is_read`) VALUES
(1, 4, 'Appointment Confirmed', 'Your appointment with Dr. Emily Watson on 2026-08-05 at 10:00 AM is confirmed.', 'APPOINTMENT_REMINDER', 1),
(2, 4, 'Lab Report Available', 'Your Lipid Profile test report (LAB-2026-0001) is ready to view.', 'LAB_RESULT_READY', 0);

INSERT INTO `audit_logs` (`id`, `user_id`, `action`, `entity_name`, `entity_id`, `old_values`, `new_values`, `ip_address`, `user_agent`) VALUES
(1, 1, 'CREATE_USER', 'users', 4, NULL, '{"username": "john.doe", "role": "PATIENT"}', '192.168.1.100', 'Mozilla/5.0 Chrome/124.0.0.0'),
(2, 2, 'CREATE_PRESCRIPTION', 'prescriptions', 1, NULL, '{"rx_number": "RX-2026-0001", "patient_id": 1}', '192.168.1.105', 'Mozilla/5.0 Chrome/124.0.0.0');
