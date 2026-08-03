# Smart Hospital Management System - Database Design Specification (MySQL 8 - 3NF)

**Author:** Senior Database Architect  
**Database Engine:** MySQL 8.0+ (InnoDB Engine)  
**Normalization Level:** Third Normal Form (3NF)  
**Character Set:** `utf8mb4_unicode_ci`  

---

## 1. Overview & Architectural Principles

This database architecture is engineered for enterprise-grade performance, strict transactional integrity, and compliance with healthcare data management standards (e.g., HIPAA audit trail readiness).

### Key Design Highlights:
1. **Third Normal Form (3NF) Compliance**: All non-key attributes are fully dependent ONLY on the primary key, eliminating data redundancy and update anomalies.
2. **Surrogate Primary Keys**: All tables use `BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY` for consistent join performance and index efficiency.
3. **Referential Integrity**: Every relationship is enforced using foreign keys (`CONSTRAINT fk_...`) with explicit `ON DELETE` and `ON UPDATE` rules (`CASCADE`, `RESTRICT`, `SET NULL`).
4. **Optimized Indexing**: Composite and single-column indexes on high-frequency lookup fields (`email`, `patient_code`, `appointment_number`, `invoice_number`, foreign keys, date ranges, and status flags).
5. **Auditing & Timestamps**: Every table contains standardized `created_at` and `updated_at` timestamps for temporal tracking.
6. **Financial Data Integrity**: Monetary values use fixed-point `DECIMAL(10, 2)` to eliminate floating-point rounding errors.

---

## 2. Entity-Relationship (ER) Diagram

```mermaid
erDiagram
    roles ||--o{ users : "assigned to"
    users ||--o| doctors : "has doctor profile"
    users ||--o| patients : "has patient profile"
    departments ||--o{ doctors : "employs"
    patients ||--o{ appointments : "books"
    doctors ||--o{ appointments : "attends"
    departments ||--o{ appointments : "hosts"
    appointments ||--o| prescriptions : "generates"
    patients ||--o{ prescriptions : "receives"
    doctors ||--o{ prescriptions : "authors"
    prescriptions ||--o{ prescription_items : "contains"
    medicines ||--o{ prescription_items : "prescribed as"
    medicines ||--o{ medicine_stock : "tracked in"
    patients ||--o{ lab_reports : "undergoes"
    doctors ||--o{ lab_reports : "orders"
    users ||--o{ lab_reports : "analyzed by"
    lab_reports ||--o{ lab_report_items : "contains"
    lab_tests ||--o{ lab_report_items : "evaluated by"
    patients ||--o{ bills : "invoiced to"
    appointments ||--o| bills : "billed for"
    bills ||--o{ bill_items : "itemized by"
    bills ||--o{ payments : "settled by"
    patients ||--o{ payments : "paid by"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "triggers"

    roles {
        bigint id PK
        string name UK
        string description
    }

    users {
        bigint id PK
        bigint role_id FK
        string email UK
        string password_hash
        string first_name
        string last_name
        string phone_number UK
        tinyint is_active
    }

    departments {
        bigint id PK
        string name UK
        string code UK
        text description
    }

    doctors {
        bigint id PK
        bigint user_id FK,UK
        bigint department_id FK
        string license_number UK
        string specialization
        decimal consultation_fee
    }

    patients {
        bigint id PK
        bigint user_id FK,UK
        string patient_code UK
        date date_of_birth
        string gender
        string blood_group
    }

    appointments {
        bigint id PK
        string appointment_number UK
        bigint patient_id FK
        bigint doctor_id FK
        bigint department_id FK
        date appointment_date
        time appointment_time
        enum status
    }

    medicines {
        bigint id PK
        string name
        string generic_name
        string category
        decimal unit_price
    }

    medicine_stock {
        bigint id PK
        bigint medicine_id FK
        string batch_number
        int quantity_in_stock
        date expiry_date
    }

    prescriptions {
        bigint id PK
        string prescription_number UK
        bigint appointment_id FK,UK
        bigint patient_id FK
        bigint doctor_id FK
        text diagnosis
    }

    prescription_items {
        bigint id PK
        bigint prescription_id FK
        bigint medicine_id FK
        string dosage
        string frequency
        int duration_days
    }

    lab_tests {
        bigint id PK
        string test_code UK
        string test_name
        string category
        decimal cost
    }

    lab_reports {
        bigint id PK
        string report_number UK
        bigint patient_id FK
        bigint doctor_id FK
        bigint lab_technician_id FK
        enum status
    }

    lab_report_items {
        bigint id PK
        bigint lab_report_id FK
        bigint lab_test_id FK
        string result_value
        tinyint is_abnormal
    }

    bills {
        bigint id PK
        string invoice_number UK
        bigint patient_id FK
        bigint appointment_id FK
        decimal net_amount
        decimal paid_amount
        decimal due_amount
        enum payment_status
    }

    bill_items {
        bigint id PK
        bigint bill_id FK
        enum item_type
        decimal unit_price
        decimal total_price
    }

    payments {
        bigint id PK
        string receipt_number UK
        bigint bill_id FK
        bigint patient_id FK
        decimal amount_paid
        enum payment_method
        enum status
    }

    notifications {
        bigint id PK
        bigint user_id FK
        string title
        text message
        tinyint is_read
    }

    audit_logs {
        bigint id PK
        bigint user_id FK
        string action
        string entity_name
        bigint entity_id
        json old_values
        json new_values
    }
```

---

## 3. Detailed Relationship Explanations

| Parent Entity | Child Entity | Cardinality | Relationship Nature | Cascade Behavior (Delete / Update) |
|---|---|---|---|---|
| `roles` | `users` | 1 to Many (`1:N`) | Each user must belong to exactly 1 role. A role can be assigned to multiple users. | `ON DELETE RESTRICT` / `ON UPDATE CASCADE` |
| `users` | `doctors` | 1 to 1 (`1:1`) | A doctor profile extends a user account. Deleting a user deletes their doctor record. | `ON DELETE CASCADE` / `ON UPDATE CASCADE` |
| `users` | `patients` | 1 to 0/1 (`1:1`) | Optional link; walk-in patients may not have a web login account. | `ON DELETE SET NULL` / `ON UPDATE CASCADE` |
| `departments` | `doctors` | 1 to Many (`1:N`) | Doctors are assigned to 1 clinical department. Cannot delete a department if active doctors exist. | `ON DELETE RESTRICT` / `ON UPDATE CASCADE` |
| `patients` | `appointments` | 1 to Many (`1:N`) | Patients can book multiple appointments over time. | `ON DELETE RESTRICT` / `ON UPDATE CASCADE` |
| `doctors` | `appointments` | 1 to Many (`1:N`) | Doctors conduct multiple scheduled appointments. | `ON DELETE RESTRICT` / `ON UPDATE CASCADE` |
| `appointments` | `prescriptions` | 1 to 1 (`1:1`) | An appointment yields at most 1 unique medical prescription. | `ON DELETE RESTRICT` / `ON UPDATE CASCADE` |
| `prescriptions` | `prescription_items` | 1 to Many (`1:N`) | Composite child table. Deleting a prescription automatically removes line items. | `ON DELETE CASCADE` / `ON UPDATE CASCADE` |
| `medicines` | `prescription_items` | 1 to Many (`1:N`) | Master drug referenced across prescription lines. | `ON DELETE RESTRICT` / `ON UPDATE CASCADE` |
| `medicines` | `medicine_stock` | 1 to Many (`1:N`) | One drug can have multiple inventory batches with distinct expiry dates. | `ON DELETE CASCADE` / `ON UPDATE CASCADE` |
| `lab_reports` | `lab_report_items` | 1 to Many (`1:N`) | Composite child table containing specific laboratory test measurements. | `ON DELETE CASCADE` / `ON UPDATE CASCADE` |
| `bills` | `bill_items` | 1 to Many (`1:N`) | Line items constituting an invoice total. Deleting an invoice removes its items. | `ON DELETE CASCADE` / `ON UPDATE CASCADE` |
| `bills` | `payments` | 1 to Many (`1:N`) | One bill can be settled via multiple partial payments. | `ON DELETE RESTRICT` / `ON UPDATE CASCADE` |

---

## 4. Module & Table Rationale (3NF Decomposition)

### **Authentication Module**
1. **`roles`**: Stores distinct application roles (`ADMIN`, `DOCTOR`, `PATIENT`, etc.). Normalizing roles into a separate entity avoids repeating role strings and enables dynamic permissions.
2. **`users`**: Central account table holding authentication credentials (`email`, `password_hash`). Encapsulating account credentials separately from clinical profiles enforces **1NF/2NF/3NF** and prevents duplicating authentication columns in doctors and patients tables.

### **Hospital Core Module**
3. **`departments`**: Maintains hospital clinical units (`Cardiology`, `Neurology`). Storing department attributes centrally avoids multi-column transitive dependencies inside the `doctors` table.
4. **`doctors`**: Contains medical practitioner specific data (`license_number`, `specialization`, `consultation_fee`). Linked via a strict 1-to-1 foreign key to `users.id`.
5. **`patients`**: Holds patient demographics (`patient_code`, `date_of_birth`, `blood_group`, `emergency_contact`). Linked 1-to-1 optionally to `users.id`.

### **Appointments Module**
6. **`appointments`**: Manages appointment bookings, time slots, and status (`SCHEDULED`, `CONFIRMED`, `COMPLETED`, `CANCELLED`). Resolves the Many-to-Many relationship between `patients` and `doctors`.

### **Prescriptions & Pharmacy Module**
7. **`medicines`**: Drug catalog (`name`, `generic_name`, `category`, `unit_price`). Separates static drug definition from stock batches.
8. **`medicine_stock`**: Inventory tracking per batch (`batch_number`, `quantity_in_stock`, `expiry_date`). Separating stock into a distinct entity satisfies **3NF** since expiration and quantity depend on batch instances, not drug definitions.
9. **`prescriptions`**: Prescription header generated during consultation (`diagnosis`, `doctor_notes`). Linked 1-to-1 with `appointments`.
10. **`prescription_items`**: Line items detailing drug, dosage, frequency, and duration. Resolves Many-to-Many between `prescriptions` and `medicines`.

### **Laboratory Module**
11. **`lab_tests`**: Master catalog of lab tests (`test_code`, `test_name`, `cost`, `normal_range`).
12. **`lab_reports`**: Lab requisition header tracking ordering doctor, technician, patient, and sample timestamps.
13. **`lab_report_items`**: Individual test values and abnormality flags for a lab report. Resolves Many-to-Many between `lab_reports` and `lab_tests`.

### **Billing & Payments Module**
14. **`bills`**: Master invoice tracking gross amount, discounts, taxes, net payable, and payment status (`UNPAID`, `PARTIALLY_PAID`, `PAID`).
15. **`bill_items`**: Itemized charges (`CONSULTATION`, `MEDICINE`, `LAB_TEST`, `ROOM_CHARGE`). Captures point-in-time pricing to preserve audit integrity even if master catalog prices change later.
16. **`payments`**: Payment transaction receipts (`CASH`, `CREDIT_CARD`, `UPI`, `INSURANCE`). Allows tracking partial and split payments per bill.

### **System Modules**
17. **`notifications`**: Targeted user alerts (`APPOINTMENT_REMINDER`, `LAB_RESULT_READY`, `BILL_DUE`) with read receipts.
18. **`audit_logs`**: Immutable security log tracking system events, IP addresses, entity mutations, and `JSON` payload diffs (`old_values`, `new_values`).

---

## 5. File References

- Master SQL Schema File: [schema.sql](file:///c:/Users/ARYAN%20RAI/OneDrive/Desktop/Hospital-Management-System/databases/schema.sql)
- Sample Seed Data File: [sample_data.sql](file:///c:/Users/ARYAN%20RAI/OneDrive/Desktop/Hospital-Management-System/databases/sample_data.sql)
