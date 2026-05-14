import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Clock, MessageCircle, Mic, MicOff, Plane, Send, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../context/AuthContext';
import { chatService, type ChatPayload, type FlightSearchChatPayload } from '../services/chatService';
import { type FlightDto } from '../services/flightService';
import { voiceService, type VoiceProcessResponse } from '../services/voiceService';
import { AirlineLogo } from '../utils/airlineLogos';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  flights?: FlightDto[];
}

type VoicePayload = VoiceProcessResponse & {
  assistantText?: string;
  response?: string;
  message?: string;
  text?: string;
  aiAnswer?: string;
};

const fallbackResponses: Record<string, string> = {
  default: 'Merhaba! Size uçuş arama, rezervasyon ve bilet işlemlerinde yardımcı olabilirim.',
  merhaba: 'Merhaba! Seferio Air’e hoş geldiniz. Size nasıl yardımcı olabilirim?',
  rezervasyon: 'Rezervasyon için uçuş seçtikten sonra koltuk seçimi ve yolcu bilgileri adımlarını tamamlayabilirsiniz.',
  iade: 'Bilet iadesi için Biletlerim sayfasından ilgili bileti seçip iade işlemini başlatabilirsiniz.',
  bagaj: 'Bagaj seçeneklerini rezervasyon sırasında kabin bagajı veya ek bagaj olarak seçebilirsiniz.',
};

const isFlightSearchPayload = (payload: unknown): payload is FlightSearchChatPayload => Boolean(
  payload &&
  typeof payload === 'object' &&
  (payload as { type?: string }).type === 'flight_search_result' &&
  Array.isArray((payload as { data?: unknown }).data)
);

const getPayload = <T,>(response: T | { payload?: T; data?: T }) => {
  const envelope = response as { payload?: T; data?: T };
  if (envelope.payload) return envelope.payload;
  if (envelope.data) return envelope.data;
  return response as T;
};

const getBotFallback = (message: string) => {
  const normalized = message.toLocaleLowerCase('tr-TR');
  if (normalized.includes('merhaba') || normalized.includes('selam')) return fallbackResponses.merhaba;
  if (normalized.includes('rezervasyon') || normalized.includes('bilet al')) return fallbackResponses.rezervasyon;
  if (normalized.includes('iade') || normalized.includes('iptal')) return fallbackResponses.iade;
  if (normalized.includes('bagaj') || normalized.includes('valiz')) return fallbackResponses.bagaj;
  return fallbackResponses.default;
};

const formatTime = (dateTime: string) => {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

const formatDate = (dateTime: string) => {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const getLocationDisplay = (location: FlightDto['departure']) => {
  if (typeof location === 'string') return location;
  return location?.city || '';
};

const calculateDuration = (departureTime: string, arrivalTime: string) => {
  const departure = new Date(departureTime).getTime();
  const arrival = new Date(arrivalTime).getTime();
  if (Number.isNaN(departure) || Number.isNaN(arrival) || arrival <= departure) return 'Direkt';

  const totalMinutes = Math.round((arrival - departure) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}s ${minutes}dk`;
};

const buildBotMessage = (payload: ChatPayload | undefined, fallbackText: string): Message => {
  if (isFlightSearchPayload(payload)) {
    return {
      id: `${Date.now()}-bot`,
      text: payload.assistantText || fallbackText,
      sender: 'bot',
      timestamp: new Date(),
      flights: payload.data,
    };
  }

  return {
    id: `${Date.now()}-bot`,
    text: typeof payload === 'string' && payload.trim() ? payload : fallbackText,
    sender: 'bot',
    timestamp: new Date(),
  };
};

const buildVoiceBotMessage = (payload: VoicePayload): Message => {
  if (isFlightSearchPayload(payload)) {
    return {
      id: `${Date.now()}-voice-bot`,
      text: payload.assistantText || getVoiceAnswer(payload) || 'Uygun uçuşları listeledim.',
      sender: 'bot',
      timestamp: new Date(),
      flights: payload.data,
    };
  }

  return {
    id: `${Date.now()}-voice-bot`,
    text: getVoiceAnswer(payload) || 'AI cevabı alınamadı. Lütfen tekrar deneyin.',
    sender: 'bot',
    timestamp: new Date(),
  };
};

const getVoiceAnswer = (payload: VoicePayload) => (
  payload.answer ||
  payload.assistantText ||
  payload.response ||
  payload.aiAnswer ||
  payload.message ||
  payload.text ||
  ''
).trim();

export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceConversationId, setVoiceConversationId] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const voiceAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    setMessages([
      {
        id: 'greeting',
        text: user
          ? `Merhaba ${user.name}! Seferio Air müşteri destek botuna hoş geldiniz.`
          : 'Merhaba! Seferio Air müşteri destek botuna hoş geldiniz.',
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  }, [user]);

  useEffect(() => () => {
    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      URL.revokeObjectURL(voiceAudioRef.current.src);
      voiceAudioRef.current = null;
    }
  }, []);

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    setMessages((previous) => [
      ...previous,
      {
        ...message,
        id: `${Date.now()}-${message.sender}-${Math.random().toString(36).slice(2)}`,
        timestamp: new Date(),
      },
    ]);
  };

  const handleSelectFlight = (flight: FlightDto) => {
    const currentParams = new URLSearchParams(window.location.search);
    const selectedClass = currentParams.get('flightClass') || 'economy';
    const params = new URLSearchParams({
      tripType: 'oneWay',
      from: getLocationDisplay(flight.departure),
      to: getLocationDisplay(flight.arrival),
      departDate: formatDate(flight.departureTime),
      adultPassengers: currentParams.get('adultPassengers') || currentParams.get('passengers') || '1',
      childPassengers: currentParams.get('childPassengers') || '0',
      studentPassengers: currentParams.get('studentPassengers') || '0',
      flightClass: selectedClass,
    });

    setOpen(false);
    localStorage.setItem('selectedChatFlight', JSON.stringify(flight));
    window.location.assign(`/booking/${flight.id}?${params.toString()}`);
  };

  const handleSend = async () => {
    const outgoingText = inputValue.trim();
    if (!outgoingText) return;

    addMessage({ text: outgoingText, sender: 'user' });
    setInputValue('');

    try {
      const response = await chatService.chat(outgoingText);
      const payload = getPayload<ChatPayload>(response);
      setMessages((previous) => [...previous, buildBotMessage(payload, getBotFallback(outgoingText))]);
    } catch {
      addMessage({ text: getBotFallback(outgoingText), sender: 'bot' });
    }
  };

  const playVoiceAudio = async (payload: VoicePayload) => {
    const audioBlob = payload.audioUrl
      ? await voiceService.getVoiceAudioByUrl(payload.audioUrl)
      : payload.conversationId
        ? await voiceService.getVoiceAudio(payload.conversationId)
        : null;

    if (!audioBlob) return;

    if (voiceAudioRef.current) {
      voiceAudioRef.current.pause();
      URL.revokeObjectURL(voiceAudioRef.current.src);
    }

    const audioObjectUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioObjectUrl);
    voiceAudioRef.current = audio;
    audio.onended = () => URL.revokeObjectURL(audioObjectUrl);
    await audio.play();
  };

  const handleVoiceClick = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      addMessage({ text: 'Tarayıcınız mikrofon kaydını desteklemiyor.', sender: 'bot' });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });

        try {
          const response = await voiceService.processVoice(audioBlob, voiceConversationId || undefined);
          const payload = getPayload<VoicePayload>(response);
          const transcript = payload.transcript?.trim();

          if (payload.conversationId) setVoiceConversationId(payload.conversationId);
          addMessage({ text: transcript || 'Sesli mesaj gönderildi.', sender: 'user' });
          setMessages((previous) => [...previous, buildVoiceBotMessage(payload)]);

          try {
            await playVoiceAudio(payload);
          } catch {
            addMessage({ text: 'Ses yanıtı oynatılamadı. Metin cevabı ekranda gösterildi.', sender: 'bot' });
          }
        } catch {
          addMessage({ text: 'Sesli yardım yanıtı alınamadı. Backend bağlantısını kontrol edin.', sender: 'bot' });
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      addMessage({ text: 'Mikrofon izni alınamadı. Tarayıcıdan mikrofon iznini açarak tekrar deneyebilirsiniz.', sender: 'bot' });
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button
          className="fixed bottom-6 right-6 z-40 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-2xl shadow-primary/30 transition-all hover:scale-110"
          aria-label="Chatbot aç"
        >
          <MessageCircle className="h-7 w-7" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed bottom-6 right-6 z-50 flex h-[600px] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-border/50 bg-card/95 shadow-2xl backdrop-blur-xl">
          <div className="flex items-center justify-between bg-gradient-to-r from-primary to-accent p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20">
                <MessageCircle className="h-6 w-6" />
              </div>
              <div>
                <Dialog.Title className="text-lg">Seferio Air Destek</Dialog.Title>
                <Dialog.Description className="text-sm opacity-90">7/24 Canlı Yardım</Dialog.Description>
              </div>
            </div>
            <Dialog.Close asChild>
              <button className="rounded-xl p-2 transition-colors hover:bg-white/20" aria-label="Chatbot kapat">
                <X className="h-5 w-5" />
              </button>
            </Dialog.Close>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-muted/20 to-transparent p-5">
            {messages.map((message) => (
              <div key={message.id} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`${message.flights?.length ? 'max-w-[96%]' : 'max-w-[80%]'} rounded-2xl p-4 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg'
                    : 'border border-border/50 bg-card shadow-sm'
                }`}>
                  <p className="text-sm leading-relaxed">{message.text}</p>

                  {message.flights?.length ? (
                    <div className="mt-3 space-y-3">
                      {message.flights.map((flight) => (
                        <div key={flight.id} className="rounded-2xl border border-primary/20 bg-background/90 p-3 shadow-sm">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <div className="flex min-w-0 items-center gap-2">
                              <AirlineLogo airline={flight.airline} size="sm" />
                              <div className="min-w-0">
                                <div className="truncate text-sm text-primary">{flight.airline}</div>
                                <div className="text-xs text-muted-foreground">{flight.flightNo}</div>
                              </div>
                            </div>
                            <span className="shrink-0 rounded-lg bg-primary/10 px-2 py-1 text-xs text-primary">
                              {flight.status === 'SCHEDULED' ? 'Planlı' : flight.status}
                            </span>
                          </div>

                          <div className="grid grid-cols-[72px_1fr_72px] items-center gap-2">
                            <div>
                              <div className="text-xl">{formatTime(flight.departureTime)}</div>
                              <div className="line-clamp-2 text-xs text-muted-foreground">{getLocationDisplay(flight.departure)}</div>
                            </div>
                            <div className="flex flex-col items-center px-1">
                              <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {calculateDuration(flight.departureTime, flight.arrivalTime)}
                              </div>
                              <div className="relative flex w-full items-center">
                                <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                                <Plane className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rotate-90 bg-background text-primary" />
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-xl">{formatTime(flight.arrivalTime)}</div>
                              <div className="line-clamp-2 text-xs text-muted-foreground">{getLocationDisplay(flight.arrival)}</div>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between gap-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Kişi başı</div>
                              <div className="bg-gradient-to-r from-primary to-accent bg-clip-text text-2xl text-transparent">
                                ₺{flight.price.toLocaleString('tr-TR')}
                              </div>
                              <div className="text-xs text-muted-foreground">{flight.availableSeats} koltuk kaldı</div>
                            </div>
                            <Button type="button" size="sm" onClick={() => handleSelectFlight(flight)} className="rounded-xl bg-gradient-to-r from-primary to-accent">
                              Seç
                              <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  <p className={`mt-2 text-xs ${message.sender === 'user' ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {message.timestamp.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="border-t border-border/50 bg-card/50 p-6">
            <div className="flex gap-3">
              <Input
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') handleSend();
                }}
                placeholder="Mesajınızı yazın..."
                className="h-12 flex-1 rounded-2xl"
              />
              <button
                onClick={handleVoiceClick}
                className={`flex h-12 w-12 items-center justify-center rounded-2xl shadow-lg transition-transform ${
                  isRecording ? 'animate-pulse bg-destructive text-white' : 'bg-secondary text-secondary-foreground hover:scale-105'
                }`}
                aria-label={isRecording ? 'Ses kaydını durdur' : 'Sesli yardım'}
                title={isRecording ? 'Ses kaydını durdur' : 'Sesli yardım'}
              >
                {isRecording ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </button>
              <button
                onClick={handleSend}
                className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white shadow-lg transition-transform hover:scale-105"
                aria-label="Mesaj gönder"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
