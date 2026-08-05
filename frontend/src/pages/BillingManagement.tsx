import React, { useEffect, useState } from 'react';
import { BillingService, BillingQueryParams } from '../services/billing.service';
import { DoctorService } from '../services/doctor.service';
import { PatientService } from '../services/patient.service';
import { Bill, BillingStats, CreateBillFormData, PaymentStatus, PaymentMethod } from '../types/billing';
import { Doctor } from '../types/doctor';
import { Patient } from '../types/patient';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useAppSelector } from '../hooks/store';
import {
  CreditCard,
  DollarSign,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertCircle,
  RefreshCw,
  X,
  CheckCircle2,
  Stethoscope,
  Building2,
  FileText,
  Printer,
  Download,
  Mail,
  Receipt,
  Wallet,
  TrendingUp,
  RotateCcw,
  Check,
  ShieldCheck,
  Ban
} from 'lucide-react';

const INITIAL_FORM_DATA: CreateBillFormData = {
  patientId: '',
  doctorId: '',
  departmentId: '',
  appointmentId: '',
  consultationFee: 0,
  labCharges: 0,
  medicineCharges: 0,
  procedureCharges: 0,
  roomCharges: 0,
  additionalCharges: 0,
  discountAmount: 0,
  taxAmount: 0,
  paidAmount: 0,
  paymentStatus: 'UNPAID',
  paymentMethod: 'Cash',
  dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
};

export const BillingManagement: React.FC = () => {
  const { user } = useAppSelector((state) => state.auth);
  const userRole = user?.role || '';
  const isAdmin = userRole === 'ADMIN';
  const isDoctor = userRole === 'DOCTOR';
  const isPatient = userRole === 'PATIENT';

  // Data States
  const [bills, setBills] = useState<Bill[]>([]);
  const [stats, setStats] = useState<BillingStats | null>(null);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');

  // Modals
  const [isAddEditModalOpen, setIsAddEditModalOpen] = useState<boolean>(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [formData, setFormData] = useState<CreateBillFormData>(INITIAL_FORM_DATA);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Invoice Viewer Modal
  const [isInvoiceViewerOpen, setIsInvoiceViewerOpen] = useState<boolean>(false);
  const [viewingBill, setViewingBill] = useState<Bill | null>(null);

  // Offline Payment Modal
  const [isOfflineModalOpen, setIsOfflineModalOpen] = useState<boolean>(false);
  const [offlineTargetBill, setOfflineTargetBill] = useState<Bill | null>(null);
  const [offlineAmount, setOfflineAmount] = useState<number>(0);
  const [offlineMethod, setOfflineMethod] = useState<PaymentMethod>('Cash');
  const [offlineTxnId, setOfflineTxnId] = useState<string>('');
  const [offlineNotes, setOfflineNotes] = useState<string>('');
  const [processingOffline, setProcessingOffline] = useState<boolean>(false);

  // Online Payment / Gateway Modal
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [paymentTargetBill, setPaymentTargetBill] = useState<Bill | null>(null);
  const [simulatedGatewayOrderId, setSimulatedGatewayOrderId] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState<boolean>(false);

  // Refund Modal
  const [isRefundModalOpen, setIsRefundModalOpen] = useState<boolean>(false);
  const [refundTargetBill, setRefundTargetBill] = useState<Bill | null>(null);
  const [processingRefund, setProcessingRefund] = useState<boolean>(false);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);
  const [billToDelete, setBillToDelete] = useState<Bill | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);

  // Fetch Data
  const fetchBills = async (
    search = searchQuery,
    status = statusFilter,
    method = methodFilter
  ) => {
    setLoading(true);
    setError(null);
    try {
      const params: BillingQueryParams = {};
      if (search.trim()) params.search = search.trim();
      if (status) params.status = status;
      if (method) params.paymentMethod = method;

      const [billRes, docRes, patRes] = await Promise.all([
        BillingService.getBills(params),
        DoctorService.getDoctors(),
        isAdmin || isDoctor ? PatientService.getPatients() : Promise.resolve({ data: [] })
      ]);

      setBills(billRes.data.bills || []);
      setStats(billRes.data.stats || null);
      setDoctors(docRes.data || []);
      setPatients(patRes.data || []);
    } catch (err: any) {
      setError(
        err?.response?.data?.message || err?.message || 'Failed to load billing records from server.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills('', '', '');
  }, []);

  // Filter Handlers
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    fetchBills(val, statusFilter, methodFilter);
  };

  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setStatusFilter(val);
    fetchBills(searchQuery, val, methodFilter);
  };

  const handleMethodFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setMethodFilter(val);
    fetchBills(searchQuery, statusFilter, val);
  };

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setMethodFilter('');
    fetchBills('', '', '');
  };

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Open Add Bill Modal
  const handleOpenAddModal = () => {
    setEditingBill(null);
    setFormData(INITIAL_FORM_DATA);
    setFormErrors({});
    setActionError(null);
    setIsAddEditModalOpen(true);
  };

  // Open Edit Bill Modal
  const handleOpenEditModal = (bill: Bill) => {
    setEditingBill(bill);
    setFormData({
      patientId: bill.patient_id,
      doctorId: bill.doctor_id || '',
      departmentId: bill.department_id || '',
      appointmentId: bill.appointment_id || '',
      consultationFee: Number(bill.consultation_fee || 0),
      labCharges: Number(bill.lab_charges || 0),
      medicineCharges: Number(bill.medicine_charges || 0),
      procedureCharges: Number(bill.procedure_charges || 0),
      roomCharges: Number(bill.room_charges || 0),
      additionalCharges: Number(bill.additional_charges || 0),
      discountAmount: Number(bill.discount_amount || 0),
      taxAmount: Number(bill.tax_amount || 0),
      paidAmount: Number(bill.paid_amount || 0),
      paymentStatus: bill.payment_status,
      paymentMethod: (bill.payment_method as PaymentMethod) || 'Cash',
      dueDate: bill.due_date ? String(bill.due_date).split('T')[0] : ''
    });
    setFormErrors({});
    setActionError(null);
    setIsAddEditModalOpen(true);
  };

  // Form Validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.patientId) {
      errors.patientId = 'Patient selection is required.';
    }

    const subtotal =
      Number(formData.consultationFee) +
      Number(formData.labCharges) +
      Number(formData.medicineCharges) +
      Number(formData.procedureCharges) +
      Number(formData.roomCharges) +
      Number(formData.additionalCharges);

    if (subtotal <= 0) {
      errors.charges = 'At least one charge line item must be greater than zero.';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit Add/Edit Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionError(null);

    if (!validateForm()) return;

    setSubmitting(true);
    try {
      if (editingBill) {
        await BillingService.updateBill(editingBill.id, formData);
        showToast(`Invoice '${editingBill.invoice_number}' updated successfully.`);
      } else {
        await BillingService.createBill(formData);
        showToast('New billing invoice generated and email sent to patient.');
      }
      setIsAddEditModalOpen(false);
      fetchBills(searchQuery, statusFilter, methodFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Operation failed. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Open Invoice Viewer
  const handleOpenInvoiceViewer = (bill: Bill) => {
    setViewingBill(bill);
    setIsInvoiceViewerOpen(true);
  };

  // Print Invoice
  const handlePrintInvoice = () => {
    window.print();
  };

  // Open Offline Payment Modal
  const handleOpenOfflineModal = (bill: Bill) => {
    setOfflineTargetBill(bill);
    setOfflineAmount(Number(bill.due_amount || bill.grand_total));
    setOfflineMethod('Cash');
    setOfflineTxnId(`OFF-${Date.now().toString().substring(6)}`);
    setOfflineNotes('');
    setActionError(null);
    setIsOfflineModalOpen(true);
  };

  // Submit Offline Payment
  const handleRecordOfflinePayment = async () => {
    if (!offlineTargetBill) return;

    if (offlineAmount <= 0) {
      setActionError('Payment amount must be greater than zero.');
      return;
    }

    setProcessingOffline(true);
    setActionError(null);
    try {
      await BillingService.recordOfflinePayment(offlineTargetBill.id, {
        amount: offlineAmount,
        paymentMethod: offlineMethod,
        referenceNumber: offlineTxnId,
        notes: offlineNotes
      });
      showToast(`Offline payment of ₹${offlineAmount} recorded for '${offlineTargetBill.invoice_number}'.`);
      setIsOfflineModalOpen(false);
      fetchBills(searchQuery, statusFilter, methodFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Failed to record offline payment.'
      );
    } finally {
      setProcessingOffline(false);
    }
  };

  // Open Online Payment / Razorpay Checkout Trigger
  const handleOpenOnlinePayment = async (bill: Bill) => {
    setPaymentTargetBill(bill);
    setActionError(null);
    setIsPaymentModalOpen(true);

    try {
      const res = await BillingService.createPaymentOrder(bill.id);
      setSimulatedGatewayOrderId(res.data.order.id);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Failed to initialize payment gateway order.'
      );
    }
  };

  // Confirm Online Payment Verification (Razorpay)
  const handleConfirmOnlinePayment = async () => {
    if (!paymentTargetBill) return;

    setProcessingPayment(true);
    setActionError(null);
    try {
      const paymentId = `pay_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      const signature = `sig_${Date.now()}`;

      await BillingService.verifyPayment({
        billId: paymentTargetBill.id,
        razorpay_order_id: simulatedGatewayOrderId || `order_${Date.now()}`,
        razorpay_payment_id: paymentId,
        razorpay_signature: signature,
        paymentMethod: 'Online Payment Gateway'
      });

      showToast(`Payment of ₹${paymentTargetBill.due_amount || paymentTargetBill.grand_total} processed successfully.`);
      setIsPaymentModalOpen(false);
      fetchBills(searchQuery, statusFilter, methodFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Payment verification failed.'
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // Open Refund Modal
  const handleOpenRefundModal = (bill: Bill) => {
    setRefundTargetBill(bill);
    setActionError(null);
    setIsRefundModalOpen(true);
  };

  // Confirm Refund
  const handleConfirmRefund = async () => {
    if (!refundTargetBill) return;

    setProcessingRefund(true);
    setActionError(null);
    try {
      await BillingService.refundPayment(refundTargetBill.id);
      showToast(`Refund of ₹${refundTargetBill.paid_amount} processed for '${refundTargetBill.invoice_number}'.`);
      setIsRefundModalOpen(false);
      fetchBills(searchQuery, statusFilter, methodFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Failed to process payment refund.'
      );
    } finally {
      setProcessingRefund(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (bill: Bill) => {
    setBillToDelete(bill);
    setActionError(null);
    setIsDeleteModalOpen(true);
  };

  // Confirm Delete
  const handleConfirmDelete = async () => {
    if (!billToDelete) return;

    setDeleting(true);
    setActionError(null);
    try {
      await BillingService.deleteBill(billToDelete.id);
      showToast(`Invoice '${billToDelete.invoice_number}' deleted.`);
      setIsDeleteModalOpen(false);
      fetchBills(searchQuery, statusFilter, methodFilter);
    } catch (err: any) {
      setActionError(
        err?.response?.data?.message || err?.message || 'Failed to delete invoice record.'
      );
    } finally {
      setDeleting(false);
    }
  };

  const hasActiveFilters = Boolean(searchQuery || statusFilter || methodFilter);

  // Calculate live subtotal and grand total for form
  const subtotal =
    Number(formData.consultationFee || 0) +
    Number(formData.labCharges || 0) +
    Number(formData.medicineCharges || 0) +
    Number(formData.procedureCharges || 0) +
    Number(formData.roomCharges || 0) +
    Number(formData.additionalCharges || 0);

  const calculatedGrandTotal =
    subtotal - Number(formData.discountAmount || 0) + Number(formData.taxAmount || 0);

  return (
    <div className="space-y-6 print:p-0 print:space-y-0">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-5 py-3.5 rounded-xl shadow-2xl border border-slate-800 animate-bounce-in print:hidden">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200/80 shadow-xs print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Billing & Payments</h1>
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              <Receipt className="w-3.5 h-3.5" /> {bills.length} Invoices
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Patient invoice statements, offline receipt management, and online Razorpay payment gateway integration.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchBills(searchQuery, statusFilter, methodFilter)}
            isLoading={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {(isAdmin || userRole === 'RECEPTIONIST') && (
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenAddModal}
              className="flex items-center gap-2 shadow-md shadow-primary-600/20"
            >
              <Plus className="w-4 h-4" />
              Generate New Bill
            </Button>
          )}
        </div>
      </div>

      {/* Financial Metrics Cards (Admin) */}
      {isAdmin && stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          <Card className="p-4 border-slate-200/80 bg-linear-to-br from-emerald-50/50 to-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-emerald-700 uppercase">Total Collected Revenue</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">₹{stats.totalRevenue.toLocaleString()}</p>
            <span className="text-xs text-emerald-600 font-medium">{stats.totalPaidBills} Fully Paid Invoices</span>
          </Card>

          <Card className="p-4 border-slate-200/80 bg-linear-to-br from-amber-50/50 to-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-amber-700 uppercase">Outstanding Due Balance</span>
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">₹{stats.pendingDue.toLocaleString()}</p>
            <span className="text-xs text-amber-600 font-medium">Pending Patient Payments</span>
          </Card>

          <Card className="p-4 border-slate-200/80 bg-linear-to-br from-sky-50/50 to-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-sky-700 uppercase">Paid Settlement Rate</span>
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {bills.length > 0 ? Math.round((stats.totalPaidBills / bills.length) * 100) : 0}%
            </p>
            <span className="text-xs text-sky-600 font-medium">Settled Patient Portfolios</span>
          </Card>

          <Card className="p-4 border-slate-200/80 bg-linear-to-br from-rose-50/50 to-white">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-rose-700 uppercase">Refunded Amount</span>
              <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
                <RotateCcw className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-slate-900 mt-2">₹{stats.refundedAmount.toLocaleString()}</p>
            <span className="text-xs text-rose-600 font-medium">Returned Patient Funds</span>
          </Card>
        </div>
      )}

      {/* Main Content Card: Toolbar + Data Table */}
      <Card className="p-0 overflow-hidden border-slate-200/80 print:hidden">
        {/* Search & Filter Toolbar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search invoice number, patient, doctor, TXN-ID..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full pl-9 pr-7 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    fetchBills('', statusFilter, methodFilter);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-700 font-medium"
              >
                <option value="">All Payment Statuses</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIALLY_PAID">PARTIALLY PAID</option>
                <option value="PAID">PAID</option>
                <option value="REFUNDED">REFUNDED</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={methodFilter}
                onChange={handleMethodFilterChange}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-slate-700 font-medium"
              >
                <option value="">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Credit Card">Credit Card</option>
                <option value="Debit Card">Debit Card</option>
                <option value="Net Banking">Net Banking</option>
                <option value="Online Payment Gateway">Online Gateway (Razorpay)</option>
              </select>
            </div>

            {/* Reset Filters */}
            <div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="w-full h-[38px] text-xs text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1"
                >
                  <X className="w-3.5 h-3.5" /> Clear All Filters
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-5 bg-rose-50 border-b border-rose-100 flex items-center justify-between text-rose-800">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <span className="text-sm font-medium">{error}</span>
            </div>
            <Button
              variant="danger"
              size="sm"
              onClick={() => fetchBills(searchQuery, statusFilter, methodFilter)}
            >
              Retry
            </Button>
          </div>
        )}

        {/* Table Container */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-primary-600" />
              <p className="text-sm font-medium">Fetching active hospital invoices...</p>
            </div>
          ) : bills.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium text-slate-600">
                {hasActiveFilters
                  ? 'No billing statements match your search or filter criteria.'
                  : 'No invoice statements issued yet.'}
              </p>
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={handleClearFilters} className="mt-3">
                  Reset All Filters
                </Button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <th className="py-3.5 px-4 sm:px-6">Invoice & Patient</th>
                  <th className="py-3.5 px-4">Attending Doctor</th>
                  <th className="py-3.5 px-4">Grand Total</th>
                  <th className="py-3.5 px-4">Paid & Due Balance</th>
                  <th className="py-3.5 px-4">Status & Method</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {bills.map((bill) => {
                  const statusMap: Record<string, 'warning' | 'success' | 'info' | 'danger' | 'neutral'> = {
                    UNPAID: 'warning',
                    Pending: 'warning',
                    PAID: 'success',
                    Paid: 'success',
                    PARTIALLY_PAID: 'info',
                    'Partially Paid': 'info',
                    REFUNDED: 'neutral',
                    Refunded: 'neutral',
                    Failed: 'danger',
                    Cancelled: 'danger'
                  };
                  const badgeVariant = statusMap[bill.payment_status] || 'neutral';
                  const grandTotal = Number(bill.grand_total || bill.total_amount || 0);
                  const paidAmount = Number(bill.paid_amount || 0);
                  const dueAmount = Number(bill.due_amount || 0);

                  const isBillPaid = bill.payment_status === 'PAID' || bill.payment_status === 'Paid';
                  const isBillRefunded = bill.payment_status === 'REFUNDED' || bill.payment_status === 'Refunded';

                  return (
                    <tr key={bill.id} className="hover:bg-slate-50/70 transition-colors group">
                      {/* Invoice & Patient */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[11px] font-bold border border-emerald-200">
                            {bill.invoice_number}
                          </span>
                          <div className="font-semibold text-slate-900 mt-1">
                            {bill.patient_name || 'Patient'}
                          </div>
                          {bill.patient_code && (
                            <div className="text-xs text-slate-500 font-mono">{bill.patient_code}</div>
                          )}
                        </div>
                      </td>

                      {/* Doctor & Department */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="font-semibold text-slate-900 flex items-center gap-1">
                            <Stethoscope className="w-3.5 h-3.5 text-primary-600" />
                            {bill.doctor_name || 'General Doctor'}
                          </div>
                          <div className="text-slate-500 mt-0.5">
                            {bill.department_name || 'General OPD'}
                          </div>
                        </div>
                      </td>

                      {/* Grand Total */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 text-sm">
                          ₹{grandTotal.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Disc: ₹{Number(bill.discount_amount || 0)} | Tax: ₹{Number(bill.tax_amount || 0)}
                        </div>
                      </td>

                      {/* Paid & Due Balance */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="text-xs">
                          <div className="text-emerald-700 font-semibold">
                            Paid: ₹{paidAmount.toFixed(2)}
                          </div>
                          <div className={`font-semibold mt-0.5 ${dueAmount > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                            Due: ₹{dueAmount > 0 ? dueAmount.toFixed(2) : '0.00'}
                          </div>
                        </div>
                      </td>

                      {/* Status & Method */}
                      <td className="py-4 px-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <Badge variant={badgeVariant}>{bill.payment_status}</Badge>
                          {bill.payment_method && (
                            <div className="text-[11px] text-slate-500 font-medium">
                              {bill.payment_method}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Invoice Viewer Button */}
                          <button
                            onClick={() => handleOpenInvoiceViewer(bill)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                            title="View / Print Invoice PDF"
                          >
                            <FileText className="w-4 h-4" />
                          </button>

                          {/* Patient Pay Online Action */}
                          {isPatient && !isBillPaid && !isBillRefunded && (
                            <button
                              onClick={() => handleOpenOnlinePayment(bill)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-md shadow-xs flex items-center gap-1 transition-all"
                              title="Pay Online via Razorpay Gateway"
                            >
                              <CreditCard className="w-3.5 h-3.5" /> Pay Online
                            </button>
                          )}

                          {/* Admin Controls */}
                          {isAdmin && (
                            <>
                              {!isBillPaid && !isBillRefunded && (
                                <button
                                  onClick={() => handleOpenOfflineModal(bill)}
                                  className="px-2 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold rounded-md border border-sky-200 flex items-center gap-1 transition-colors"
                                  title="Record Cash / Counter Payment"
                                >
                                  <Wallet className="w-3.5 h-3.5" /> Record Payment
                                </button>
                              )}

                              {isBillPaid && (
                                <button
                                  onClick={() => handleOpenRefundModal(bill)}
                                  className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-semibold rounded-md border border-amber-200 flex items-center gap-1 transition-colors"
                                  title="Process Payment Refund"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" /> Refund
                                </button>
                              )}

                              <button
                                onClick={() => handleOpenEditModal(bill)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition-colors"
                                title="Edit Charges"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                onClick={() => handleOpenDeleteModal(bill)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Statement"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>

      {/* Add / Edit Bill Modal (Admin) */}
      {isAddEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:hidden">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-lg">
                  {editingBill ? `Edit Invoice (${editingBill.invoice_number})` : 'Generate New Billing Invoice'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddEditModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {actionError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* Patient Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Select Patient <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formData.patientId}
                  onChange={(e) => setFormData({ ...formData, patientId: Number(e.target.value) || '' })}
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                    formErrors.patientId
                      ? 'border-rose-300 focus:ring-rose-500/20'
                      : 'border-slate-300 focus:ring-primary-500/20'
                  }`}
                >
                  <option value="">Choose Patient</option>
                  {patients.map((pat) => (
                    <option key={pat.id} value={pat.id}>
                      {pat.full_name || `${pat.first_name} ${pat.last_name}`} ({pat.patient_code})
                    </option>
                  ))}
                </select>
                {formErrors.patientId && <p className="text-xs text-rose-600 mt-1">{formErrors.patientId}</p>}
              </div>

              {/* Doctor Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Attending Doctor & Department
                </label>
                <select
                  value={formData.doctorId}
                  onChange={(e) => {
                    const docId = Number(e.target.value) || '';
                    const doc = doctors.find((d) => d.id === docId);
                    setFormData({
                      ...formData,
                      doctorId: docId,
                      departmentId: doc ? doc.department_id : '',
                      consultationFee: doc ? Number(doc.consultation_fee || 0) : formData.consultationFee
                    });
                  }}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 bg-white"
                >
                  <option value="">Choose Doctor (Optional)</option>
                  {doctors.map((doc) => (
                    <option key={doc.id} value={doc.id}>
                      Dr. {doc.full_name || doc.first_name} ({doc.specialization}) — Fee: ₹{doc.consultation_fee}
                    </option>
                  ))}
                </select>
              </div>

              {/* Itemized Charges Section */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Itemized Charge Breakdown (₹)</h4>
                {formErrors.charges && <p className="text-xs text-rose-600">{formErrors.charges}</p>}

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Consultation Fee</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.consultationFee}
                      onChange={(e) => setFormData({ ...formData, consultationFee: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Lab Charges</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.labCharges}
                      onChange={(e) => setFormData({ ...formData, labCharges: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Medicine Charges</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.medicineCharges}
                      onChange={(e) => setFormData({ ...formData, medicineCharges: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Procedure Charges</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.procedureCharges}
                      onChange={(e) => setFormData({ ...formData, procedureCharges: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Room / Bed Charges</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.roomCharges}
                      onChange={(e) => setFormData({ ...formData, roomCharges: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Additional Charges</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.additionalCharges}
                      onChange={(e) => setFormData({ ...formData, additionalCharges: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg"
                    />
                  </div>
                </div>

                {/* Discounts & Tax */}
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-200">
                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Discount Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.discountAmount}
                      onChange={(e) => setFormData({ ...formData, discountAmount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg text-emerald-700 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-600 mb-1">Tax Amount (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.taxAmount}
                      onChange={(e) => setFormData({ ...formData, taxAmount: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-sm bg-white border border-slate-300 rounded-lg font-semibold"
                    />
                  </div>
                </div>

                {/* Subtotal & Grand Total Summary Bar */}
                <div className="pt-2 flex items-center justify-between text-xs font-bold text-slate-900 border-t border-slate-200">
                  <span>Gross Subtotal: ₹{subtotal.toFixed(2)}</span>
                  <span className="text-sm text-emerald-700">Calculated Grand Total: ₹{calculatedGrandTotal.toFixed(2)}</span>
                </div>
              </div>

              {/* Informational Callout on Creation */}
              {!editingBill ? (
                <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl text-sky-900 text-xs flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-sky-600 flex-shrink-0" />
                  <span>
                    <strong>Production Billing Rule:</strong> Every newly generated invoice is automatically issued with <strong>payment_status = UNPAID</strong>, <strong>paid_amount = ₹0</strong>, and <strong>due_amount = Grand Total</strong>. Payments (full or partial) are recorded online or offline afterwards.
                  </span>
                </div>
              ) : (
                /* Status Selection only on editing existing bill */
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Invoice Status</label>
                  <select
                    value={formData.paymentStatus}
                    onChange={(e) => setFormData({ ...formData, paymentStatus: e.target.value as PaymentStatus })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Paid">Paid</option>
                    <option value="Partially Paid">Partially Paid</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              {/* Actions */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <Button variant="outline" size="md" onClick={() => setIsAddEditModalOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="md" isLoading={submitting}>
                  {editingBill ? 'Save Invoice Changes' : 'Generate & Send Invoice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Online Razorpay Payment Modal (Patient) */}
      {isPaymentModalOpen && paymentTargetBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-base">
                <CreditCard className="w-5 h-5" />
                <span>Razorpay Gateway Checkout</span>
              </div>
              <button onClick={() => setIsPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 border border-slate-200 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>Invoice Number:</span>
                <strong className="font-mono text-slate-900">{paymentTargetBill.invoice_number}</strong>
              </div>
              <div className="flex justify-between">
                <span>Patient Name:</span>
                <strong className="text-slate-900">{paymentTargetBill.patient_name}</strong>
              </div>
              <div className="flex justify-between">
                <span>Gateway Order ID:</span>
                <strong className="font-mono text-primary-600">{simulatedGatewayOrderId || 'Generating...'}</strong>
              </div>
              <div className="pt-2 flex justify-between text-sm font-bold border-t border-slate-200 text-slate-900">
                <span>Amount Payable:</span>
                <span className="text-emerald-600 text-base">₹{(paymentTargetBill.due_amount || paymentTargetBill.grand_total).toFixed(2)}</span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-[11px] text-emerald-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Secured with Razorpay 256-bit HMAC SHA256 Encryption</span>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="outline" size="md" onClick={() => setIsPaymentModalOpen(false)} disabled={processingPayment}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={handleConfirmOnlinePayment}
                isLoading={processingPayment}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Complete ₹{(paymentTargetBill.due_amount || paymentTargetBill.grand_total).toFixed(2)} Payment
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Record Offline Payment Modal (Admin) */}
      {isOfflineModalOpen && offlineTargetBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-sky-600 font-bold text-base">
                <Wallet className="w-5 h-5" />
                <span>Record Counter / Offline Payment</span>
              </div>
              <button onClick={() => setIsOfflineModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Invoice</label>
                <input
                  type="text"
                  disabled
                  value={`${offlineTargetBill.invoice_number} — ${offlineTargetBill.patient_name}`}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-200 rounded-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                <div>
                  <span className="text-slate-500 block">Total Bill:</span>
                  <strong className="text-slate-900 font-bold">₹{Number(offlineTargetBill.grand_total).toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Current Due:</span>
                  <strong className="text-rose-600 font-bold">₹{Number(offlineTargetBill.due_amount || offlineTargetBill.grand_total).toFixed(2)}</strong>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Payment Amount (₹)</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={offlineAmount}
                  onChange={(e) => setOfflineAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-emerald-700 font-bold text-sm"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Enter partial or full amount (Supports partial payments e.g. ₹400 for a ₹1000 bill).
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Offline Payment Method</label>
                <select
                  value={offlineMethod}
                  onChange={(e) => setOfflineMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Cash">Cash (Hospital Counter)</option>
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Credit Card">Credit Card Terminal</option>
                  <option value="Debit Card">Debit Card Terminal</option>
                  <option value="Net Banking">Net Banking Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Reference Number / Txn ID</label>
                <input
                  type="text"
                  value={offlineTxnId}
                  onChange={(e) => setOfflineTxnId(e.target.value)}
                  placeholder="e.g. OFF-981244 or Counter Receipt No."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Payment Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  placeholder="e.g. Counter deposit collected by accounts officer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white resize-none text-slate-800"
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="outline" size="md" onClick={() => setIsOfflineModalOpen(false)} disabled={processingOffline}>
                Cancel
              </Button>
              <Button variant="primary" size="md" onClick={handleRecordOfflinePayment} isLoading={processingOffline}>
                Record Payment & Notify
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Refund Modal (Admin) */}
      {isRefundModalOpen && refundTargetBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                <RotateCcw className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Process Payment Refund</h3>
                <p className="text-xs text-slate-500">Refund transaction to patient</p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <p className="text-sm text-slate-600">
              Are you sure you want to process a full refund of <strong className="text-slate-900">₹{refundTargetBill.paid_amount}</strong> for invoice <strong className="text-slate-900">{refundTargetBill.invoice_number}</strong>?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="outline" size="md" onClick={() => setIsRefundModalOpen(false)} disabled={processingRefund}>
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={handleConfirmRefund} isLoading={processingRefund}>
                Confirm Refund
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal (Admin) */}
      {isDeleteModalOpen && billToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs print:hidden">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 space-y-4 animate-scale-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-900">Delete Invoice Statement</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {actionError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 text-xs">
                {actionError}
              </div>
            )}

            <p className="text-sm text-slate-600">
              Are you sure you want to delete invoice <strong className="text-slate-900">{billToDelete.invoice_number}</strong>?
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <Button variant="outline" size="md" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>
                Cancel
              </Button>
              <Button variant="danger" size="md" onClick={handleConfirmDelete} isLoading={deleting}>
                Delete Invoice
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Printable / Viewable PDF Invoice Modal */}
      {isInvoiceViewerOpen && viewingBill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:static">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-in my-8 print:shadow-none print:border-none print:m-0 print:w-full">
            {/* Toolbar Buttons (Hidden during Print) */}
            <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white print:hidden">
              <div className="flex items-center gap-2 font-bold text-base">
                <Receipt className="w-5 h-5 text-emerald-400" />
                <span>Invoice Statement — {viewingBill.invoice_number}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrintInvoice} className="text-white border-slate-700 hover:bg-slate-800">
                  <Printer className="w-4 h-4 mr-1" /> Print / PDF
                </Button>
                <button onClick={() => setIsInvoiceViewerOpen(false)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Invoice Sheet */}
            <div className="p-8 space-y-6 bg-white text-slate-800 text-sm">
              {/* Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-6">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">🏥 CarePulse Hospital</h1>
                  <p className="text-xs text-slate-500 mt-1">100 Health Sciences Blvd, Medical Center, Suite 400</p>
                  <p className="text-xs text-slate-500">Phone: +1 (555) 019-9000 | Email: billing@hospital.com</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-slate-900 text-white font-mono text-xs font-bold rounded">
                    {viewingBill.invoice_number}
                  </span>
                  <p className="text-xs text-slate-500 mt-2">Date: {viewingBill.created_at ? String(viewingBill.created_at).split('T')[0] : new Date().toISOString().split('T')[0]}</p>
                  <p className="text-xs font-bold text-emerald-700 mt-1 uppercase">Status: {viewingBill.payment_status}</p>
                </div>
              </div>

              {/* Patient & Doctor Meta */}
              <div className="grid grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] text-slate-400 mb-1">Billed To (Patient)</h4>
                  <p className="font-bold text-slate-900 text-sm">{viewingBill.patient_name}</p>
                  <p className="text-slate-600">ID: {viewingBill.patient_code}</p>
                  <p className="text-slate-600">{viewingBill.patient_email}</p>
                </div>

                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] text-slate-400 mb-1">Attending Clinical Doctor</h4>
                  <p className="font-bold text-slate-900 text-sm">{viewingBill.doctor_name || 'Medical Specialist'}</p>
                  <p className="text-slate-600">Department: {viewingBill.department_name || 'General OPD'}</p>
                  <p className="text-slate-600">APT Ref: {viewingBill.appointment_number || 'N/A'}</p>
                </div>
              </div>

              {/* Itemized Charges Table */}
              <div>
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">Itemized Healthcare Services</h4>
                <table className="w-full border-collapse border border-slate-200 text-xs">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                      <th className="py-2.5 px-3 text-left">Item Description</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Number(viewingBill.consultation_fee) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Doctor Outpatient Consultation Fee</td>
                        <td className="py-2 px-3 text-right">₹{Number(viewingBill.consultation_fee).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(viewingBill.lab_charges) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Laboratory Diagnostic & Pathology Tests</td>
                        <td className="py-2 px-3 text-right">₹{Number(viewingBill.lab_charges).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(viewingBill.medicine_charges) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Pharmacy Medication Billed</td>
                        <td className="py-2 px-3 text-right">₹{Number(viewingBill.medicine_charges).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(viewingBill.procedure_charges) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Medical / Surgical Procedure Charges</td>
                        <td className="py-2 px-3 text-right">₹{Number(viewingBill.procedure_charges).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(viewingBill.room_charges) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Hospital Bed / Inpatient Room Charges</td>
                        <td className="py-2 px-3 text-right">₹{Number(viewingBill.room_charges).toFixed(2)}</td>
                      </tr>
                    )}
                    {Number(viewingBill.additional_charges) > 0 && (
                      <tr>
                        <td className="py-2 px-3">Miscellaneous Administrative Charges</td>
                        <td className="py-2 px-3 text-right">₹{Number(viewingBill.additional_charges).toFixed(2)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Totals Summary */}
              <div className="flex justify-end border-t border-slate-200 pt-4">
                <div className="w-64 space-y-1.5 text-xs text-right">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal Charges:</span>
                    <span>₹{Number(viewingBill.total_amount).toFixed(2)}</span>
                  </div>
                  {Number(viewingBill.discount_amount) > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount Concession:</span>
                      <span>-₹{Number(viewingBill.discount_amount).toFixed(2)}</span>
                    </div>
                  )}
                  {Number(viewingBill.tax_amount) > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>Applicable Taxes:</span>
                      <span>+₹{Number(viewingBill.tax_amount).toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-slate-900 border-t border-slate-300 pt-2">
                    <span>Grand Total:</span>
                    <span>₹{Number(viewingBill.grand_total).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-700 font-bold">
                    <span>Paid Settlement:</span>
                    <span>₹{Number(viewingBill.paid_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Outstanding Due:</span>
                    <span>₹{Number(viewingBill.due_amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Official 9-Field Receipt Summary */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px]">1. Invoice Number</span>
                  <strong className="font-mono text-slate-900 font-bold">{viewingBill.invoice_number}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px]">2. Patient</span>
                  <strong className="text-slate-900 font-bold">{viewingBill.patient_name}</strong>
                  <span className="text-[11px] text-slate-500 block">({viewingBill.patient_code})</span>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px]">3. Doctor</span>
                  <strong className="text-slate-900 font-bold">{viewingBill.doctor_name || 'General OPD Specialist'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px]">4. Payment Method</span>
                  <strong className="text-slate-900 font-bold">{viewingBill.payment_method || 'Pending / Counter'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px]">5. Transaction ID</span>
                  <strong className="font-mono text-slate-900 font-bold">{viewingBill.transaction_id || 'N/A'}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px]">6. Payment Date</span>
                  <strong className="text-slate-900 font-bold">
                    {viewingBill.payment_date 
                      ? new Date(viewingBill.payment_date).toLocaleString() 
                      : (viewingBill.updated_at ? new Date(viewingBill.updated_at).toLocaleDateString() : 'N/A')}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px]">7. Amount Paid</span>
                  <strong className="text-emerald-700 font-bold text-sm">₹{Number(viewingBill.paid_amount || 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px]">8. Outstanding Amount</span>
                  <strong className="text-rose-600 font-bold text-sm">₹{Number(viewingBill.due_amount || 0).toFixed(2)}</strong>
                </div>
                <div>
                  <span className="text-slate-400 font-medium block uppercase text-[10px]">9. Invoice Status</span>
                  <span className="inline-block px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-xs">
                    {viewingBill.payment_status}
                  </span>
                </div>
              </div>

              {/* Footer Stamp & Sign */}
              <div className="border-t border-slate-200 pt-6 flex justify-between items-end text-xs text-slate-500">
                <div>
                  <p>Payment Method: <strong>{viewingBill.payment_method || 'N/A'}</strong></p>
                  <p>Transaction Reference: <strong className="font-mono text-slate-700">{viewingBill.transaction_id || 'N/A'}</strong></p>
                  {viewingBill.notes && <p className="mt-1 text-slate-600 italic">Notes: {viewingBill.notes}</p>}
                </div>
                <div className="text-center">
                  <div className="w-32 border-b border-slate-400 mb-1"></div>
                  <p className="font-bold text-slate-700">Authorized Accounts Officer</p>
                  <p className="text-[10px]">CarePulse Hospital</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
