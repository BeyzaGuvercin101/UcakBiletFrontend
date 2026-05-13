import { apiRequest } from './apiClient';

export interface CheckoutPaymentResult {
  checkoutUrl?: string;
  paymentUrl?: string;
  sessionUrl?: string;
  url?: string;
  sessionId?: string;
}

export type CheckoutPaymentResponse = string | CheckoutPaymentResult;

export const paymentService = {
  checkoutPayment: (reservationId: number | string) => apiRequest<CheckoutPaymentResponse>(`/api/payments/checkout/${reservationId}`, {
    method: 'POST',
  }),

  paymentSuccess: (sessionId: string) => {
    return apiRequest<string>('/api/payments/success', {
      query: { session_id: sessionId },
    });
  },

  getPaymentByReservation: (reservationId: number | string) => apiRequest<string>(`/api/payments/reservation/${reservationId}`),

  paymentCancel: (reservationId: number | string) => {
    return apiRequest<string>('/api/payments/cancel', {
      query: { reservationId },
    });
  },
};
