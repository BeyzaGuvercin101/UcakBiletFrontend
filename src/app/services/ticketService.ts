import { apiRequest } from './apiClient';
import type { FlightDto } from './flightService';

export interface TicketDto {
  id: number | string;
  reservationId?: number | string;
  pnr?: string;
  passengerName?: string;
  passengerEmail?: string;
  passengerPhone?: string;
  seatNo?: string;
  price?: number;
  createTime?: string;
  flight?: FlightDto;
  flightId?: number | string;
  status?: string;
  [key: string]: unknown;
}

export const ticketService = {
  getTicketById: (id: number | string) => apiRequest<TicketDto | string>(`/api/tickets/getTicket/${id}`),

  getTicketsByUser: (userId: number | string) => apiRequest<TicketDto[] | string>(`/api/tickets/getByUser/${userId}`),

  getTicketByReservation: (reservationId: number | string) => apiRequest<TicketDto | string>(`/api/tickets/getByReservation/${reservationId}`),

  getAllTickets: () => apiRequest<TicketDto[] | string>('/api/tickets/getAll'),

  deleteTicket: (id: number | string) => apiRequest<string>(`/api/tickets/delete/${id}`, {
    method: 'DELETE',
  }),
};
