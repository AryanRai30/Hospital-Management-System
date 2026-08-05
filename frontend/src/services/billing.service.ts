import { api } from './api';
import {
  ApiResponse,
  Bill,
  BillingStats,
  CreateBillFormData,
  RazorpayOrderResponse
} from '../types';

export interface BillingQueryParams {
  search?: string;
  status?: string;
  paymentMethod?: string;
  patientId?: number | string;
  doctorId?: number | string;
}

export class BillingService {
  /**
   * Fetch bills list and stats
   */
  static async getBills(
    params?: BillingQueryParams
  ): Promise<ApiResponse<{ bills: Bill[]; stats: BillingStats | null }>> {
    const response = await api.get<ApiResponse<{ bills: Bill[]; stats: BillingStats | null }>>(
      '/billing',
      { params: params || {} }
    );
    return response.data;
  }

  /**
   * Fetch single bill details by ID
   */
  static async getBillById(id: number): Promise<ApiResponse<Bill>> {
    const response = await api.get<ApiResponse<Bill>>(`/billing/${id}`);
    return response.data;
  }

  /**
   * Create new bill statement (Admin)
   */
  static async createBill(data: CreateBillFormData): Promise<ApiResponse<Bill>> {
    const response = await api.post<ApiResponse<Bill>>('/billing', data);
    return response.data;
  }

  /**
   * Update bill charges or metadata (Admin)
   */
  static async updateBill(id: number, data: Partial<CreateBillFormData> & { isOfflinePayment?: boolean; amount?: number; referenceNumber?: string; notes?: string }): Promise<ApiResponse<Bill>> {
    const response = await api.put<ApiResponse<Bill>>(`/billing/${id}`, data);
    return response.data;
  }

  /**
   * Record offline payment (Admin)
   */
  static async recordOfflinePayment(
    id: number,
    data: {
      amount: number;
      paymentMethod: string;
      referenceNumber?: string;
      notes?: string;
    }
  ): Promise<ApiResponse<Bill>> {
    const response = await api.put<ApiResponse<Bill>>(`/billing/${id}`, {
      ...data,
      isOfflinePayment: true
    });
    return response.data;
  }

  /**
   * Delete bill statement (Admin)
   */
  static async deleteBill(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete<ApiResponse<null>>(`/billing/${id}`);
    return response.data;
  }

  /**
   * Create Razorpay Payment Gateway Order
   */
  static async createPaymentOrder(billId: number, amount?: number): Promise<ApiResponse<RazorpayOrderResponse>> {
    const response = await api.post<ApiResponse<RazorpayOrderResponse>>('/payments/create-order', {
      billId,
      amount
    });
    return response.data;
  }

  /**
   * Verify Razorpay Payment Signature
   */
  static async verifyPayment(payload: {
    billId: number;
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    paymentMethod?: string;
  }): Promise<ApiResponse<Bill>> {
    const response = await api.post<ApiResponse<Bill>>('/payments/verify', payload);
    return response.data;
  }

  /**
   * Process Gateway Refund (Admin)
   */
  static async refundPayment(billId: number, amount?: number): Promise<ApiResponse<{ bill: Bill; refund: any }>> {
    const response = await api.post<ApiResponse<{ bill: Bill; refund: any }>>('/payments/refund', {
      billId,
      amount
    });
    return response.data;
  }
}
