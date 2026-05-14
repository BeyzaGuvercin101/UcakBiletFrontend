import { apiRequest } from './apiClient';

export interface ReservationDto {
  id: number | string;
  baggageOption?: string;
  createTime?: string | null;
  entertainmentOption?: string;
  flightClass?: string;
  flightId?: number | string;
  flightNum?: string;
  passengerFullName?: string;
  passengerId?: number | string;
  passengerType?: string;
  reservationDate?: string;
  seatId?: number | string;
  seatNumber?: string;
  status?: string;
  totalPrice?: number;
  userEmail?: string;
  userId?: number | string;
  wifiOption?: string;
  [key: string]: unknown;
}

export const reservationService = {
  getReservationById: (reservationId: number | string) =>
    apiRequest<ReservationDto | string>(`/api/reservations/getReservation/${reservationId}`),
};
