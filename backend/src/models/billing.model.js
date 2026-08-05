const { pool } = require('../config/db.config');
const logger = require('../utils/logger');

class BillingModel {
  /**
   * Auto-schema verification ensuring columns exist on live MySQL instance
   */
  static async ensureSchema() {
    try {
      const [columns] = await pool.query('SHOW COLUMNS FROM bills');
      const columnNames = columns.map((col) => col.Field);

      if (!columnNames.includes('doctor_id')) {
        await pool.query('ALTER TABLE bills ADD COLUMN doctor_id BIGINT UNSIGNED NULL AFTER patient_id');
      }
      if (!columnNames.includes('department_id')) {
        await pool.query('ALTER TABLE bills ADD COLUMN department_id BIGINT UNSIGNED NULL AFTER doctor_id');
      }
      if (!columnNames.includes('consultation_fee')) {
        await pool.query('ALTER TABLE bills ADD COLUMN consultation_fee DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER appointment_id');
      }
      if (!columnNames.includes('lab_charges')) {
        await pool.query('ALTER TABLE bills ADD COLUMN lab_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER consultation_fee');
      }
      if (!columnNames.includes('medicine_charges')) {
        await pool.query('ALTER TABLE bills ADD COLUMN medicine_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER lab_charges');
      }
      if (!columnNames.includes('procedure_charges')) {
        await pool.query('ALTER TABLE bills ADD COLUMN procedure_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER medicine_charges');
      }
      if (!columnNames.includes('room_charges')) {
        await pool.query('ALTER TABLE bills ADD COLUMN room_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER procedure_charges');
      }
      if (!columnNames.includes('additional_charges')) {
        await pool.query('ALTER TABLE bills ADD COLUMN additional_charges DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER room_charges');
      }
      if (!columnNames.includes('grand_total')) {
        await pool.query('ALTER TABLE bills ADD COLUMN grand_total DECIMAL(10, 2) NOT NULL DEFAULT 0.00 AFTER tax_amount');
      }
      if (!columnNames.includes('payment_method')) {
        await pool.query('ALTER TABLE bills ADD COLUMN payment_method VARCHAR(50) NULL AFTER payment_status');
      }
      if (!columnNames.includes('transaction_id')) {
        await pool.query('ALTER TABLE bills ADD COLUMN transaction_id VARCHAR(100) NULL AFTER payment_method');
      }
      if (!columnNames.includes('razorpay_order_id')) {
        await pool.query('ALTER TABLE bills ADD COLUMN razorpay_order_id VARCHAR(100) NULL AFTER transaction_id');
      }
      if (!columnNames.includes('razorpay_payment_id')) {
        await pool.query('ALTER TABLE bills ADD COLUMN razorpay_payment_id VARCHAR(100) NULL AFTER razorpay_order_id');
      }
      if (!columnNames.includes('razorpay_signature')) {
        await pool.query('ALTER TABLE bills ADD COLUMN razorpay_signature VARCHAR(255) NULL AFTER razorpay_payment_id');
      }
      if (!columnNames.includes('payment_date')) {
        await pool.query('ALTER TABLE bills ADD COLUMN payment_date DATETIME NULL AFTER transaction_id');
      }
      if (!columnNames.includes('notes')) {
        await pool.query('ALTER TABLE bills ADD COLUMN notes TEXT NULL AFTER payment_date');
      }

      // Safely alter ENUM column on bills table to prevent truncation errors
      try {
        await pool.query(
          "ALTER TABLE bills MODIFY COLUMN payment_status ENUM('UNPAID', 'PARTIALLY_PAID', 'PAID', 'REFUNDED', 'Pending', 'Paid', 'Partially Paid', 'Failed', 'Refunded', 'Cancelled') NOT NULL DEFAULT 'UNPAID'"
        );
      } catch (enumErr) {
        logger.warn(`[BILLING SCHEMA ENUM CHECK] ${enumErr.message}`);
      }

      try {
        const [paymentColumns] = await pool.query('SHOW COLUMNS FROM payments');
        const paymentColNames = paymentColumns.map((col) => col.Field);
        if (!paymentColNames.includes('notes')) {
          await pool.query('ALTER TABLE payments ADD COLUMN notes TEXT NULL AFTER transaction_reference');
        }
      } catch (pe) {
        logger.warn(`[PAYMENT SCHEMA CHECK] ${pe.message}`);
      }
    } catch (err) {
      logger.warn(`[BILLING MODEL] Schema check warning: ${err.message}`);
    }
  }

  /**
   * Helper to derive true payment status from actual payment data
   */
  static derivePaymentStatus(bill) {
    if (!bill) return 'UNPAID';
    const current = String(bill.payment_status || '').toUpperCase();
    if (current === 'REFUNDED') return 'REFUNDED';

    const paid = Number(bill.paid_amount || 0);
    const grandTotal = Number(bill.grand_total || 0);

    if (paid >= grandTotal && grandTotal > 0) {
      return 'PAID';
    } else if (paid > 0) {
      return 'PARTIALLY_PAID';
    }
    return 'UNPAID';
  }

  /**
   * Helper to resolve Patient ID from User ID
   */
  static async findPatientByUserId(userId) {
    const [rows] = await pool.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].id : null;
  }

  /**
   * Helper to resolve Doctor ID from User ID
   */
  static async findDoctorByUserId(userId) {
    const [rows] = await pool.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
    return rows.length > 0 ? rows[0].id : null;
  }

  /**
   * Generate next Invoice Number (e.g. INV-2026-0001)
   */
  static async generateInvoiceNumber() {
    const year = new Date().getFullYear();
    const prefix = `INV-${year}-`;
    const [rows] = await pool.query(
      'SELECT invoice_number FROM bills WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1',
      [`${prefix}%`]
    );

    if (rows.length === 0) {
      return `${prefix}0001`;
    }

    const lastNumberStr = rows[0].invoice_number.replace(prefix, '');
    const nextSeq = parseInt(lastNumberStr, 10) + 1;
    return `${prefix}${String(nextSeq).padStart(4, '0')}`;
  }

  /**
   * Find bills with role scoping & search filters
   */
  static async findAll({ search, status, paymentMethod, patientId, doctorId, userRole, userId }) {
    await this.ensureSchema();

    let query = `
      SELECT 
        b.id,
        b.invoice_number,
        b.patient_id,
        b.doctor_id,
        b.department_id,
        b.appointment_id,
        b.consultation_fee,
        b.lab_charges,
        b.medicine_charges,
        b.procedure_charges,
        b.room_charges,
        b.additional_charges,
        b.total_amount,
        b.discount_amount,
        b.tax_amount,
        b.grand_total,
        b.paid_amount,
        b.due_amount,
        b.payment_status,
        b.payment_method,
        b.transaction_id,
        b.razorpay_order_id,
        b.razorpay_payment_id,
        b.payment_date,
        b.notes,
        b.due_date,
        b.created_at,
        b.updated_at,
        p.patient_code,
        CONCAT(up.first_name, ' ', up.last_name) AS patient_name,
        up.email AS patient_email,
        up.phone_number AS patient_phone,
        CONCAT('Dr. ', ud.first_name, ' ', ud.last_name) AS doctor_name,
        ud.email AS doctor_email,
        doc.specialization AS doctor_specialization,
        dept.name AS department_name,
        apt.appointment_number,
        apt.appointment_date,
        apt.appointment_time
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      JOIN users up ON p.user_id = up.id
      LEFT JOIN doctors doc ON b.doctor_id = doc.id
      LEFT JOIN users ud ON doc.user_id = ud.id
      LEFT JOIN departments dept ON b.department_id = dept.id
      LEFT JOIN appointments apt ON b.appointment_id = apt.id
      WHERE 1=1
    `;

    const queryParams = [];

    // Role-based Scoping
    if (userRole === 'PATIENT') {
      const resolvedPatientId = await this.findPatientByUserId(userId);
      query += ` AND b.patient_id = ?`;
      queryParams.push(resolvedPatientId || -1);
    } else if (userRole === 'DOCTOR') {
      const resolvedDoctorId = await this.findDoctorByUserId(userId);
      query += ` AND b.doctor_id = ?`;
      queryParams.push(resolvedDoctorId || -1);
    } else if (patientId) {
      query += ` AND b.patient_id = ?`;
      queryParams.push(patientId);
    } else if (doctorId) {
      query += ` AND b.doctor_id = ?`;
      queryParams.push(doctorId);
    }

    // Search filter (Invoice number, Patient name, Doctor name, Patient Code)
    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      query += ` AND (
        b.invoice_number LIKE ? OR 
        p.patient_code LIKE ? OR 
        CONCAT(up.first_name, ' ', up.last_name) LIKE ? OR
        CONCAT(ud.first_name, ' ', ud.last_name) LIKE ? OR
        b.transaction_id LIKE ?
      )`;
      queryParams.push(term, term, term, term, term);
    }

    // Status filter - supports both new ENUM values (UNPAID, PARTIALLY_PAID, PAID, REFUNDED) and legacy strings
    if (status && status.trim()) {
      const s = status.trim().toUpperCase();
      if (s === 'UNPAID' || s === 'PENDING') {
        query += ` AND b.payment_status IN ('UNPAID', 'Pending')`;
      } else if (s === 'PARTIALLY_PAID' || s === 'PARTIALLY PAID') {
        query += ` AND b.payment_status IN ('PARTIALLY_PAID', 'Partially Paid')`;
      } else if (s === 'PAID') {
        query += ` AND b.payment_status IN ('PAID', 'Paid')`;
      } else if (s === 'REFUNDED') {
        query += ` AND b.payment_status IN ('REFUNDED', 'Refunded')`;
      } else {
        query += ` AND b.payment_status = ?`;
        queryParams.push(status.trim());
      }
    }

    // Payment Method filter
    if (paymentMethod && paymentMethod.trim()) {
      query += ` AND b.payment_method = ?`;
      queryParams.push(paymentMethod.trim());
    }

    query += ` ORDER BY b.id DESC`;

    const [rows] = await pool.query(query, queryParams);

    // Apply derived payment status for complete consistency
    return rows.map((bill) => {
      bill.payment_status = this.derivePaymentStatus(bill);
      return bill;
    });
  }

  /**
   * Find single bill by ID with detailed line items and payment transactions
   */
  static async findById(id) {
    await this.ensureSchema();

    const query = `
      SELECT 
        b.id,
        b.invoice_number,
        b.patient_id,
        b.doctor_id,
        b.department_id,
        b.appointment_id,
        b.consultation_fee,
        b.lab_charges,
        b.medicine_charges,
        b.procedure_charges,
        b.room_charges,
        b.additional_charges,
        b.total_amount,
        b.discount_amount,
        b.tax_amount,
        b.grand_total,
        b.paid_amount,
        b.due_amount,
        b.payment_status,
        b.payment_method,
        b.transaction_id,
        b.razorpay_order_id,
        b.razorpay_payment_id,
        b.razorpay_signature,
        b.payment_date,
        b.notes,
        b.due_date,
        b.created_at,
        b.updated_at,
        p.patient_code,
        CONCAT(up.first_name, ' ', up.last_name) AS patient_name,
        up.email AS patient_email,
        up.phone_number AS patient_phone,
        CONCAT('Dr. ', ud.first_name, ' ', ud.last_name) AS doctor_name,
        ud.email AS doctor_email,
        doc.specialization AS doctor_specialization,
        dept.name AS department_name,
        apt.appointment_number,
        apt.appointment_date,
        apt.appointment_time
      FROM bills b
      JOIN patients p ON b.patient_id = p.id
      JOIN users up ON p.user_id = up.id
      LEFT JOIN doctors doc ON b.doctor_id = doc.id
      LEFT JOIN users ud ON doc.user_id = ud.id
      LEFT JOIN departments dept ON b.department_id = dept.id
      LEFT JOIN appointments apt ON b.appointment_id = apt.id
      WHERE b.id = ?
    `;

    const [rows] = await pool.query(query, [id]);
    if (rows.length === 0) return null;

    const bill = rows[0];
    bill.payment_status = this.derivePaymentStatus(bill);

    // Fetch related payment receipts
    const [payments] = await pool.query(
      `SELECT * FROM payments WHERE bill_id = ? ORDER BY id DESC`,
      [id]
    );

    bill.payments = payments;
    return bill;
  }

  /**
   * Create new Bill Invoice
   * Enforces Requirement 1: When Admin generates a new bill, the invoice is ALWAYS created with:
   * payment_status = "UNPAID", paid_amount = 0, due_amount = grand_total, payment_date = NULL, transaction_id = NULL.
   * Never create a bill directly as PAID.
   */
  static async create(data) {
    await this.ensureSchema();

    const invoiceNumber = await this.generateInvoiceNumber();

    const consultationFee = Number(data.consultationFee || 0);
    const labCharges = Number(data.labCharges || 0);
    const medicineCharges = Number(data.medicineCharges || 0);
    const procedureCharges = Number(data.procedureCharges || 0);
    const roomCharges = Number(data.roomCharges || 0);
    const additionalCharges = Number(data.additionalCharges || 0);

    const subtotal = consultationFee + labCharges + medicineCharges + procedureCharges + roomCharges + additionalCharges;
    const discountAmount = Number(data.discountAmount || data.discount || 0);
    const taxAmount = Number(data.taxAmount || data.tax || 0);
    const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

    // Hardcode strict initial UNPAID state for all newly created bills
    const initialPaidAmount = 0.00;
    const initialDueAmount = grandTotal;
    const initialStatus = 'UNPAID';
    const initialPaymentMethod = null;
    const initialTransactionId = null;
    const initialPaymentDate = null;

    const [result] = await pool.query(
      `INSERT INTO bills (
        invoice_number,
        patient_id,
        doctor_id,
        department_id,
        appointment_id,
        consultation_fee,
        lab_charges,
        medicine_charges,
        procedure_charges,
        room_charges,
        additional_charges,
        total_amount,
        discount_amount,
        tax_amount,
        grand_total,
        paid_amount,
        due_amount,
        payment_status,
        payment_method,
        transaction_id,
        payment_date,
        due_date
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber,
        data.patientId,
        data.doctorId || null,
        data.departmentId || null,
        data.appointmentId || null,
        consultationFee,
        labCharges,
        medicineCharges,
        procedureCharges,
        roomCharges,
        additionalCharges,
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal,
        initialPaidAmount,
        initialDueAmount,
        initialStatus,
        initialPaymentMethod,
        initialTransactionId,
        initialPaymentDate,
        data.dueDate || null
      ]
    );

    return this.findById(result.insertId);
  }

  /**
   * Update existing Bill line items / charges
   */
  static async update(id, data) {
    await this.ensureSchema();

    const existing = await this.findById(id);
    if (!existing) return null;

    const consultationFee = data.consultationFee !== undefined ? Number(data.consultationFee) : Number(existing.consultation_fee);
    const labCharges = data.labCharges !== undefined ? Number(data.labCharges) : Number(existing.lab_charges);
    const medicineCharges = data.medicineCharges !== undefined ? Number(data.medicineCharges) : Number(existing.medicine_charges);
    const procedureCharges = data.procedureCharges !== undefined ? Number(data.procedureCharges) : Number(existing.procedure_charges);
    const roomCharges = data.roomCharges !== undefined ? Number(data.roomCharges) : Number(existing.room_charges);
    const additionalCharges = data.additionalCharges !== undefined ? Number(data.additionalCharges) : Number(existing.additional_charges);

    const subtotal = consultationFee + labCharges + medicineCharges + procedureCharges + roomCharges + additionalCharges;
    const discountAmount = data.discountAmount !== undefined ? Number(data.discountAmount) : Number(existing.discount_amount);
    const taxAmount = data.taxAmount !== undefined ? Number(data.taxAmount) : Number(existing.tax_amount);
    const grandTotal = Math.max(0, subtotal - discountAmount + taxAmount);

    const paidAmount = data.paidAmount !== undefined ? Number(data.paidAmount) : Number(existing.paid_amount);
    let dueAmount = Math.max(0, grandTotal - paidAmount);

    let paymentStatus = 'UNPAID';
    if (paidAmount >= grandTotal && grandTotal > 0 && existing.payment_status !== 'REFUNDED') {
      paymentStatus = 'PAID';
      dueAmount = 0.00;
    } else if (paidAmount > 0 && existing.payment_status !== 'REFUNDED') {
      paymentStatus = 'PARTIALLY_PAID';
    } else if (data.paymentStatus && ['REFUNDED', 'Refunded'].includes(data.paymentStatus)) {
      paymentStatus = 'REFUNDED';
    }

    await pool.query(
      `UPDATE bills SET
        doctor_id = ?,
        department_id = ?,
        appointment_id = ?,
        consultation_fee = ?,
        lab_charges = ?,
        medicine_charges = ?,
        procedure_charges = ?,
        room_charges = ?,
        additional_charges = ?,
        total_amount = ?,
        discount_amount = ?,
        tax_amount = ?,
        grand_total = ?,
        paid_amount = ?,
        due_amount = ?,
        payment_status = ?,
        payment_method = COALESCE(?, payment_method),
        transaction_id = COALESCE(?, transaction_id),
        razorpay_order_id = COALESCE(?, razorpay_order_id),
        razorpay_payment_id = COALESCE(?, razorpay_payment_id),
        razorpay_signature = COALESCE(?, razorpay_signature),
        notes = COALESCE(?, notes)
      WHERE id = ?`,
      [
        data.doctorId !== undefined ? data.doctorId : existing.doctor_id,
        data.departmentId !== undefined ? data.departmentId : existing.department_id,
        data.appointmentId !== undefined ? data.appointmentId : existing.appointment_id,
        consultationFee,
        labCharges,
        medicineCharges,
        procedureCharges,
        roomCharges,
        additionalCharges,
        subtotal,
        discountAmount,
        taxAmount,
        grandTotal,
        paidAmount,
        dueAmount,
        paymentStatus,
        data.paymentMethod || null,
        data.transactionId || null,
        data.razorpayOrderId || null,
        data.razorpayPaymentId || null,
        data.razorpaySignature || null,
        data.notes || null,
        id
      ]
    );

    return this.findById(id);
  }

  /**
   * Record payment transaction against bill (Online or Offline, with Partial Payment support)
   */
  static async recordPayment(id, paymentData) {
    await this.ensureSchema();

    const existing = await this.findById(id);
    if (!existing) return null;

    const newPaymentAmount = Number(paymentData.amountPaid || paymentData.amount || 0);
    const grandTotal = Number(existing.grand_total);
    const currentPaid = Number(existing.paid_amount || 0);
    const newTotalPaid = currentPaid + newPaymentAmount;

    let finalStatus = 'UNPAID';
    let finalPaid = newTotalPaid;
    let finalDue = grandTotal - newTotalPaid;

    if (newTotalPaid >= grandTotal && grandTotal > 0) {
      finalStatus = 'PAID';
      finalPaid = grandTotal;
      finalDue = 0.00;
    } else if (newTotalPaid > 0) {
      finalStatus = 'PARTIALLY_PAID';
      finalPaid = newTotalPaid;
      finalDue = Math.max(0, grandTotal - newTotalPaid);
    } else {
      finalStatus = 'UNPAID';
      finalPaid = 0.00;
      finalDue = grandTotal;
    }

    const transactionId = paymentData.transactionId || paymentData.razorpayPaymentId || `TXN-${Date.now()}`;
    const paymentDate = new Date();

    // Update bill master record with valid ENUM status
    await pool.query(
      `UPDATE bills SET
        paid_amount = ?,
        due_amount = ?,
        payment_status = ?,
        payment_method = COALESCE(?, payment_method),
        transaction_id = ?,
        razorpay_order_id = COALESCE(?, razorpay_order_id),
        razorpay_payment_id = COALESCE(?, razorpay_payment_id),
        razorpay_signature = COALESCE(?, razorpay_signature),
        payment_date = ?,
        notes = COALESCE(?, notes)
      WHERE id = ?`,
      [
        finalPaid,
        finalDue,
        finalStatus,
        paymentData.paymentMethod || 'Cash',
        transactionId,
        paymentData.razorpayOrderId || null,
        paymentData.razorpayPaymentId || null,
        paymentData.razorpaySignature || null,
        paymentDate,
        paymentData.notes || null,
        id
      ]
    );

    // Record receipt transaction in payments table
    const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    
    let methodEnum = 'CASH';
    const pm = (paymentData.paymentMethod || '').toUpperCase();
    if (pm.includes('UPI')) methodEnum = 'UPI';
    else if (pm.includes('CREDIT')) methodEnum = 'CREDIT_CARD';
    else if (pm.includes('DEBIT')) methodEnum = 'DEBIT_CARD';
    else if (pm.includes('NET')) methodEnum = 'NET_BANKING';

    try {
      await pool.query(
        `INSERT INTO payments (
          receipt_number,
          bill_id,
          patient_id,
          amount_paid,
          payment_method,
          transaction_reference,
          status,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          receiptNo,
          id,
          existing.patient_id,
          newPaymentAmount,
          methodEnum,
          transactionId,
          'SUCCESS',
          paymentData.notes || null
        ]
      );
    } catch (e) {
      logger.warn(`[PAYMENT RECEIPT RECORD] ${e.message}`);
    }

    return this.findById(id);
  }

  /**
   * Delete bill record
   */
  static async delete(id) {
    await this.ensureSchema();
    await pool.query('DELETE FROM payments WHERE bill_id = ?', [id]);
    const [result] = await pool.query('DELETE FROM bills WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }

  /**
   * Calculate Financial Dashboard Statistics using actual paid and due amounts
   * Rule 7: Admin Dashboard cards must calculate using actual paid amounts.
   */
  static async getFinancialStats() {
    await this.ensureSchema();

    // Actual revenue collected = sum of paid_amount across all non-refunded/non-cancelled bills
    const [totalRevenueRows] = await pool.query(
      "SELECT SUM(paid_amount) AS totalRevenue FROM bills WHERE payment_status NOT IN ('REFUNDED', 'Refunded', 'Cancelled')"
    );
    const [totalPaidRows] = await pool.query(
      "SELECT COUNT(*) AS totalPaidBills FROM bills WHERE payment_status IN ('PAID', 'Paid')"
    );
    const [pendingDueRows] = await pool.query(
      "SELECT SUM(due_amount) AS pendingDue FROM bills WHERE payment_status NOT IN ('REFUNDED', 'Refunded', 'Cancelled') AND due_amount > 0"
    );
    const [refundedRows] = await pool.query(
      "SELECT SUM(paid_amount) AS refundedAmount FROM bills WHERE payment_status IN ('REFUNDED', 'Refunded')"
    );

    return {
      totalRevenue: Number(totalRevenueRows[0]?.totalRevenue || 0),
      totalPaidBills: Number(totalPaidRows[0]?.totalPaidBills || 0),
      pendingDue: Number(pendingDueRows[0]?.pendingDue || 0),
      refundedAmount: Number(refundedRows[0]?.refundedAmount || 0)
    };
  }
}

module.exports = BillingModel;
