import { apiRequest } from './apiClient';

export interface FlightDto {
  id: number;
  flightNo: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  capacity: number;
  availableSeats: number;
  status: 'SCHEDULED' | 'CANCELLED' | 'DELAYED' | string;
}

export interface SearchFlightsParams {
  departure: string;
  arrival: string;
  departureDate: string;
}

export type FlightUpsertRequest = Omit<FlightDto, 'id'> & {
  id?: number;
};

export const flightService = {
  getAllFlights: () => apiRequest<FlightDto[]>('/api/flights/getAll'),

  getFlightById: (id: number | string) => apiRequest<FlightDto>(`/api/flights/getFlight/${id}`),

  searchFlights: ({ departure, arrival, departureDate }: SearchFlightsParams) => (
    apiRequest<FlightDto[]>('/api/flights/search', {
      query: { departure, arrival, departureDate },
    })
  ),

  saveFlight: (flight: FlightUpsertRequest) => apiRequest<string>('/api/flights/save', {
    method: 'POST',
    body: flight,
  }),

  updateFlight: (id: number | string, flight: FlightUpsertRequest) => apiRequest<string>(`/api/flights/update/${id}`, {
    method: 'PUT',
    body: flight,
  }),

  deleteFlight: (id: number | string) => apiRequest<string>(`/api/flights/delete/${id}`, {
    method: 'DELETE',
  }),
};
