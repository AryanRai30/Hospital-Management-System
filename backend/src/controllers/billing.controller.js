const BillingModel = require('../models/billing.model');
const PaymentGatewayService = require('../services/paymentGateway.service');
const EmailService = require('../services/email.service');
const ApiResponse = require('../utils/apiResponse');
const ApiError = require('../utils/apiError');
const { HTTP_STATUS } = require('../utils/constants');
const logger = require('../utils/logger');

class BillingController {
  /**
   * Get list of bills with role scoping & filters
   * GET /api/v1/billing
   */
  static async getBills(req, res, next) {
    try {
      const { search, status, paymentMethod, patientId, doctorId } = req.query;
      const userRole = req.user ? req.user.role : '';
      const userId = req.user ? req.user.id : null;

      const [bills, stats] = await Promise.all([
        BillingModel.findAll({
          search,
          status,
          paymentMethod,
          patientId,
          doctorId,
          userRole,
          userId
        }),
        userRole === 'ADMIN' ? BillingModel.getFinancialStats() : Promise.resolve(null)
      ]);

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(
          HTTP_STATUS.OK,
          { bills, stats },
          'Bills retrieved successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single bill by ID
   * GET /api/v1/billing/:id
   */
  static async getBillById(req, res, next) {
    try {
      const { id } = req.params;
      const bill = await BillingModel.findById(id);
      if (!bill) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Bill with ID ${id} not found.`);
      }

      // Check role permissions
      const userRole = req.user ? req.user.role : '';
      const userId = req.user ? req.user.id : null;

      if (userRole === 'PATIENT') {
        const patientId = await BillingModel.findPatientByUserId(userId);
        if (bill.patient_id !== patientId) {
          throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Access denied to this billing statement.');
        }
      } else if (userRole === 'DOCTOR') {
        const doctorId = await BillingModel.findDoctorByUserId(userId);
        if (bill.doctor_id !== doctorId) {
          throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Access denied to this billing statement.');
        }
      }

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, bill, 'Bill statement retrieved successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new Bill Invoice (Admin)
   * POST /api/v1/billing
   */
  static async createBill(req, res, next) {
    try {
      const {
        patientId,
        doctorId,
        departmentId,
        appointmentId,
        consultationFee,
        labCharges,
        medicineCharges,
        procedureCharges,
        roomCharges,
        additionalCharges,
        discountAmount,
        taxAmount,
        paidAmount,
        paymentStatus,
        paymentMethod,
        dueDate
      } = req.body;

      if (!patientId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Patient selection is required.');
      }

      const bill = await BillingModel.create({
        patientId,
        doctorId,
        departmentId,
        appointmentId,
        consultationFee,
        labCharges,
        medicineCharges,
        procedureCharges,
        roomCharges,
        additionalCharges,
        discountAmount,
        taxAmount,
        paidAmount,
        paymentStatus,
        paymentMethod,
        dueDate
      });

      // Asynchronous Non-Blocking Email Notification
      setImmediate(async () => {
        try {
          await EmailService.notifyBillingEvent('BILL_GENERATED', bill);
        } catch (emailErr) {
          logger.error(`[EMAIL ERROR] Failed sending bill generation email: ${emailErr.message}`);
        }
      });

      return res
        .status(HTTP_STATUS.CREATED)
        .json(new ApiResponse(HTTP_STATUS.CREATED, bill, 'Bill generated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Edit Bill / Record Offline Payment (Admin)
   * PUT /api/v1/billing/:id
   */
  static async updateBill(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await BillingModel.findById(id);
      if (!existing) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Bill with ID ${id} not found.`);
      }

      const isOfflinePaymentRecord = Boolean(
        req.body.isOfflinePayment || 
        req.body.amount !== undefined ||
        (req.body.paidAmount !== undefined && Number(req.body.paidAmount) > Number(existing.paid_amount))
      );

      let updated;
      if (isOfflinePaymentRecord) {
        const paymentAmount = req.body.amount !== undefined 
          ? Number(req.body.amount) 
          : Math.max(0, Number(req.body.paidAmount || 0) - Number(existing.paid_amount || 0));

        updated = await BillingModel.recordPayment(id, {
          amountPaid: paymentAmount,
          paymentMethod: req.body.paymentMethod || 'Cash',
          transactionId: req.body.referenceNumber || req.body.transactionId || `OFF-${Date.now().toString().substring(6)}`,
          notes: req.body.notes || null
        });

        // Asynchronous Email Notification
        setImmediate(async () => {
          try {
            if (updated.payment_status === 'PARTIALLY_PAID' || updated.payment_status === 'Partially Paid') {
              await EmailService.notifyBillingEvent('PARTIAL_PAYMENT_RECEIVED', updated, { installmentAmount: paymentAmount });
            } else {
              await EmailService.notifyBillingEvent('OFFLINE_PAYMENT_RECORDED', updated, { installmentAmount: paymentAmount });
            }
          } catch (emailErr) {
            logger.error(`[EMAIL ERROR] Failed sending offline payment notification: ${emailErr.message}`);
          }
        });
      } else {
        updated = await BillingModel.update(id, req.body);
      }

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, updated, 'Bill updated successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete Bill (Admin)
   * DELETE /api/v1/billing/:id
   */
  static async deleteBill(req, res, next) {
    try {
      const { id } = req.params;
      const existing = await BillingModel.findById(id);
      if (!existing) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Bill with ID ${id} not found.`);
      }

      await BillingModel.delete(id);

      return res
        .status(HTTP_STATUS.OK)
        .json(new ApiResponse(HTTP_STATUS.OK, null, 'Bill statement deleted successfully'));
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create Gateway Payment Order (Razorpay)
   * POST /api/v1/payments/create-order
   */
  static async createPaymentOrder(req, res, next) {
    try {
      const { billId, amount } = req.body;
      let bill = null;

      if (billId) {
        bill = await BillingModel.findById(billId);
        if (!bill) {
          throw new ApiError(HTTP_STATUS.NOT_FOUND, `Bill with ID ${billId} not found.`);
        }
      }

      const payableAmount = bill ? Number(bill.due_amount || bill.grand_total) : Number(amount);
      if (isNaN(payableAmount) || payableAmount <= 0) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Invalid or zero payment amount.');
      }

      const receipt = bill ? bill.invoice_number : `rec_${Date.now()}`;
      const order = await PaymentGatewayService.createOrder(payableAmount, 'INR', receipt);

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, { order, bill }, 'Payment gateway order created')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify Gateway Payment Signature & Update Bill
   * POST /api/v1/payments/verify
   */
  static async verifyPayment(req, res, next) {
    try {
      const { billId, razorpay_order_id, razorpay_payment_id, razorpay_signature, paymentMethod } = req.body;

      if (!billId) {
        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Bill ID is required for verification.');
      }

      const bill = await BillingModel.findById(billId);
      if (!bill) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Bill with ID ${billId} not found.`);
      }

      const isValid = PaymentGatewayService.verifySignature(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      if (!isValid) {
        // Asynchronously notify payment failure while keeping bill in UNPAID status for retry
        setImmediate(async () => {
          try {
            await EmailService.notifyBillingEvent('PAYMENT_FAILED', bill);
          } catch (e) {
            logger.error(`[PAYMENT FAILED HANDLER] ${e.message}`);
          }
        });

        throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Payment verification failed. Invalid gateway signature. Please try again.');
      }

      // Record successful payment
      const updatedBill = await BillingModel.recordPayment(billId, {
        amountPaid: bill.due_amount || bill.grand_total,
        paymentMethod: paymentMethod || 'Online Payment Gateway',
        transactionId: razorpay_payment_id || `TXN-${Date.now()}`,
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'PAID'
      });

      // Asynchronous Success Email Notification
      setImmediate(async () => {
        try {
          await EmailService.notifyBillingEvent('PAYMENT_SUCCESS', updatedBill);
        } catch (emailErr) {
          logger.error(`[EMAIL ERROR] Failed sending payment success email: ${emailErr.message}`);
        }
      });

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, updatedBill, 'Payment verified and recorded successfully')
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Process Gateway Refund (Admin)
   * POST /api/v1/payments/refund
   */
  static async refundPayment(req, res, next) {
    try {
      const { billId, amount } = req.body;
      const bill = await BillingModel.findById(billId);
      if (!bill) {
        throw new ApiError(HTTP_STATUS.NOT_FOUND, `Bill with ID ${billId} not found.`);
      }

      const refundAmount = Number(amount || bill.paid_amount);
      const refundResult = await PaymentGatewayService.processRefund(
        bill.razorpay_payment_id || bill.transaction_id,
        refundAmount
      );

      const updatedBill = await BillingModel.update(billId, {
        paymentStatus: 'REFUNDED',
        paidAmount: 0,
        dueAmount: bill.grand_total
      });

      // Asynchronous Email Notification
      setImmediate(async () => {
        try {
          await EmailService.notifyBillingEvent('PAYMENT_REFUNDED', updatedBill);
        } catch (emailErr) {
          logger.error(`[EMAIL ERROR] Failed sending refund notification email: ${emailErr.message}`);
        }
      });

      return res.status(HTTP_STATUS.OK).json(
        new ApiResponse(HTTP_STATUS.OK, { bill: updatedBill, refund: refundResult }, 'Refund processed successfully')
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = BillingController;
