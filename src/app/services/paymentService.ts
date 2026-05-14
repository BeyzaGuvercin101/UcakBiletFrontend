import { apiRequest } from './apiClient';

/** POST /api/payments/checkout/{reservationId} yanıtı */
export interface CheckoutSessionDto {
  paymentId?: number;
  reservationId?: number;
  sessionId?: string;
  sessionUrl?: string;
  status?: string;
}

export type CheckoutPaymentResponse = string | CheckoutSessionDto;

export const paymentService = {
  /** Boş gövde, Authorization: Bearer (apiRequest varsayılanı auth: true) */
  checkoutPayment: (reservationId: number | string) =>
    apiRequest<CheckoutPaymentResponse>(`/api/payments/checkout/${reservationId}`, {
      method: 'POST',
      auth: true,
    }),

  paymentSuccess: (sessionId: string) =>
    apiRequest<{
      amount?: number;
      flightNum?: string;
      id?: number;
      reservationId?: number;
      status?: string;
      passengerFullName?: string;
      [key: string]: unknown;
    }>('/api/payments/success', {
      method: 'GET',
      auth: true,
      query: { session_id: sessionId },
    }),

  getPaymentByReservation: (reservationId: number | string) => apiRequest<string>(`/api/payments/reservation/${reservationId}`),

  paymentCancel: (reservationId: number | string) => {
    return apiRequest<string>('/api/payments/cancel', {
      query: { reservationId },
    });
  },
};
