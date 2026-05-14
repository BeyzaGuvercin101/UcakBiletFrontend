import { apiRequest } from './apiClient';

export interface AirportInfo {
  city: string;
  airport: string;
}

export interface FlightDto {
  id: number;
  flightNo: string;
  airline: string;
  departure: AirportInfo | string;
  arrival: AirportInfo | string;
  departureTime: string;
  arrivalTime: string;
  price: number;
  capacity?: number;
  availableSeats: number;
  status: 'SCHEDULED' | 'CANCELLED' | 'DELAYED' | string;
}

export interface SearchFlightsParams {
  departure: string;
  departureAirport?: string;
  arrival: string;
  arrivalAirport?: string;
  departureDate: string;
}

export interface GetAirportsParams {
  departure?: string;
  arrival?: string;
}

export interface AirportOption {
  city: string;
  airport: string;
  code?: string;
  country?: string;
}

export interface SeatDto {
  id: number;
  seatNumber: string;
  flightId: number;
  flightClass: 'FIRST_CLASS' | 'BUSINESS' | 'ECONOMY';
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
  price?: number;
}

export interface ReservationData {
  flightId: number;
  seatId: number;
  userId: number;
  flightClass: 'ECONOMY' | 'BUSINESS' | 'FIRST_CLASS';
  passengerType: 'ADULT' | 'CHILD' | 'STUDENT';
  baggageOption: string;
  wifiOption: string;
  entertainmentOption: string;
  firstName: string;
  lastName: string;
  identityNumber: string;
  passportNumber: string;
  email: string;
  phoneNumber: string;
  gender?: string;
}

/** POST /api/reservations/save yanıtındaki data gövdesi (id ödeme checkout için gerekli) */
export interface SavedReservationDto {
  id: number;
  flightId?: number;
  seatId?: number;
  status?: string;
  totalPrice?: number;
  [key: string]: unknown;
}

export type FlightUpsertRequest = Omit<FlightDto, 'id'> & {
  id?: number;
};

export const flightService = {
  getAirports: (params?: GetAirportsParams) => apiRequest<AirportOption[]>('/api/flights/airports', {
    query: params || {},
  }),

  getAllFlights: () => apiRequest<FlightDto[]>('/api/flights/getAll'),

  getFlightById: (id: number | string) => apiRequest<FlightDto>(`/api/flights/getFlight/${id}`),

  searchFlights: ({ departure, departureAirport, arrival, arrivalAirport, departureDate }: SearchFlightsParams) => (
    apiRequest<FlightDto[]>('/api/flights/search', {
      query: { 
        departure, 
        departureAirport,
        arrival, 
        arrivalAirport,
        departureDate 
      },
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

  saveReservation: (data: ReservationData) => apiRequest<SavedReservationDto>('/api/reservations/save', {
    method: 'POST',
    body: data,
    auth: false,
  }),

  getSeatsByFlight: (flightId: number | string, status: string = 'AVAILABLE', flightClass?: string) => {
    const query: Record<string, string> = { status };
    if (flightClass) {
      query.flightClass = flightClass;
    }
    return apiRequest<SeatDto[]>(`/api/seats/by-flight/${flightId}`, { query });
  },
};
