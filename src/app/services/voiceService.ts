import {
  apiRequest,
  buildApiUrl,
  createAuthHeaders,
  readApiResponse,
  type ApiEnvelope,
} from './apiClient';
import type { FlightDto } from './flightService';

export interface VoiceProcessResponse {
  conversationId: string;
  transcript: string;
  answer?: string;
  type?: 'flight_search_result' | string;
  assistantText?: string;
  data?: FlightDto[];
  audioUrl?: string;
  audioContentType?: string;
}

const getAudioFileName = (audio: Blob) => {
  if (audio.type.includes('mpeg') || audio.type.includes('mp3')) return 'voice.mp3';
  if (audio.type.includes('ogg') || audio.type.includes('opus')) return 'voice.ogg';
  if (audio.type.includes('m4a') || audio.type.includes('mp4') || audio.type.includes('aac')) return 'voice.m4a';
  if (audio.type.includes('wav')) return 'voice.wav';
  return 'voice.webm';
};

export const voiceService = {
  processVoice: async (audio: Blob, conversationId?: string): Promise<ApiEnvelope<VoiceProcessResponse>> => {
    const formData = new FormData();
    formData.append('audio', audio, getAudioFileName(audio));

    const response = await fetch(buildApiUrl('/api/v1/voice/process', { conversationId }), {
      method: 'POST',
      headers: createAuthHeaders(),
      body: formData,
    });

    return readApiResponse<VoiceProcessResponse>(response);
  },

  getVoiceAudio: async (conversationId: string) => {
    const headers = createAuthHeaders({ Accept: 'audio/mpeg,audio/ogg,audio/wav,*/*' });

    const response = await fetch(buildApiUrl(`/api/v1/voice/audio/${conversationId}`), {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Ses dosyasi alinamadi: ${response.status}`);
    }

    return response.blob();
  },

  getVoiceAudioByUrl: async (audioUrl: string) => {
    const headers = createAuthHeaders({ Accept: 'audio/mpeg,audio/ogg,audio/wav,*/*' });
    const url = audioUrl.startsWith('http') ? audioUrl : buildApiUrl(audioUrl);

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(`Ses dosyasi alinamadi: ${response.status}`);
    }

    return response.blob();
  },

  deleteVoiceConversation: (conversationId?: string) => (
    apiRequest<string>('/api/v1/voice/conversation', {
      method: 'DELETE',
      query: { conversationId },
    })
  ),
};
