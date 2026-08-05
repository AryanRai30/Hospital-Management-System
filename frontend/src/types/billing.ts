export type PaymentStatus =
  | 'UNPAID'
  | 'PARTIALLY_PAID'
  | 'PAID'
  | 'REFUNDED'
  | 'Pending'
  | 'Paid'
  | 'Partially Paid'
  | 'Failed'
  | 'Refunded'
  | 'Cancelled';

export type PaymentMethod =
  | 'Cash'
  | 'UPI'
  | 'Credit Card'
  | 'Debit Card'
  | 'Net Banking'
  | 'Wallet'
  | 'Online Payment Gateway';

export interface PaymentTransaction {
  id: number;
  receipt_number: string;
  bill_id: number;
  patient_id: number;
  amount_paid: number;
  payment_method: string;
  transaction_reference?: string;
  payment_date: string;
  status: string;
}

export interface Bill {
  id: number;
  invoice_number: string;
  patient_id: number;
  doctor_id?: number | null;
  department_id?: number | null;
  appointment_id?: number | null;
  consultation_fee: number;
  lab_charges: number;
  medicine_charges: number;
  procedure_charges: number;
  room_charges: number;
  additional_charges: number;
  total_amount: number;
  discount_amount: number;
  tax_amount: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: PaymentStatus;
  payment_method?: PaymentMethod | string | null;
  transaction_id?: string | null;
  payment_date?: string | null;
  notes?: string | null;
  razorpay_order_id?: string | null;
  razorpay_payment_id?: string | null;
  due_date?: string | null;
  patient_name?: string;
  patient_code?: string;
  patient_email?: string;
  patient_phone?: string;
  doctor_name?: string;
  doctor_email?: string;
  doctor_specialization?: string;
  department_name?: string;
  appointment_number?: string;
  appointment_date?: string;
  appointment_time?: string;
  payments?: PaymentTransaction[];
  created_at?: string;
  updated_at?: string;
}

export interface CreateBillFormData {
  patientId: number | '';
  doctorId?: number | '';
  departmentId?: number | '';
  appointmentId?: number | '';
  consultationFee: number;
  labCharges: number;
  medicineCharges: number;
  procedureCharges: number;
  roomCharges: number;
  additionalCharges: number;
  discountAmount: number;
  taxAmount: number;
  paidAmount: number;
  paymentStatus?: PaymentStatus;
  paymentMethod?: PaymentMethod | string;
  dueDate?: string;
}

export interface BillingStats {
  totalRevenue: number;
  totalPaidBills: number;
  pendingDue: number;
  refundedAmount: number;
}

export interface RazorpayOrderResponse {
  order: {
    id: string;
    amount: number;
    currency: string;
    receipt?: string;
    status?: string;
    key?: string;
  };
  bill?: Bill;
}
