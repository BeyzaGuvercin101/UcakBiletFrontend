import { apiRequest } from './apiClient';
import type { FlightDto } from './flightService';

export interface FlightSearchChatPayload {
  type: 'flight_search_result';
  assistantText: string;
  data: FlightDto[];
}

export type ChatPayload = string | FlightSearchChatPayload;

export const chatService = {
  chat: (message: string) => apiRequest<ChatPayload>('/api/v1/chat', {
    method: 'POST',
    body: { message },
  }),
};
