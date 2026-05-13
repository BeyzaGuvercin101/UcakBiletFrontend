import {
  apiRequest,
  buildApiUrl,
  createAuthHeaders,
  readApiResponse,
  type ApiEnvelope,
} from './apiClient';

export interface VoiceProcessResponse {
  conversationId: string;
  transcript: string;
  answer: string;
  audioUrl?: string;
  audioContentType?: string;
}

const getAudioFileName = (audio: Blob) => {
  if (audio.type.includes('mpeg') || audio.type.includes('mp3')) return 'voice.mp3';
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
    const headers = createAuthHeaders({ Accept: 'audio/mpeg' });

    const response = await fetch(buildApiUrl(`/api/v1/voice/audio/${conversationId}`), {
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
