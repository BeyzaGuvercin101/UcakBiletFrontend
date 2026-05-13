import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { ArrowRight, Clock, MessageCircle, Mic, MicOff, Plane, Send, X } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useAuth } from '../context/AuthContext';
import { chatService, type ChatPayload, type FlightSearchChatPayload } from '../services/chatService';
import { flightService, type FlightDto } from '../services/flightService';
import { voiceService, type VoiceProcessResponse } from '../services/voiceService';
import { AirlineLogo } from '../utils/airlineLogos';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  flights?: FlightDto[];
}

const botResponses: Record<string, string> = {
  default: 'Merhaba! Size nasıl yardımcı olabilirim? Uçuş rezervasyonu, bilet iadesi veya genel sorularınız için buradayım.',
  merhaba: 'Merhaba! Seferio Air\'e hoş geldiniz. Size nasıl yardımcı olabilirim?',
  rezervasyon: 'Rezervasyon yapmak için ana sayfadan kalkış ve varış noktalarınızı seçerek başlayabilirsiniz. Hangi destinasyona uçmak istersiniz?',
  iade: 'Bilet iadesi için "Biletlerim" sayfasından biletinizi seçip "İade Et" butonuna tıklayabilirsiniz. Uçuştan 24 saat öncesine kadar tam iade yapılmaktadır.',
  fiyat: 'Uçuş fiyatları destinasyon, tarih ve havayoluna göre değişmektedir. Ana sayfadan arama yaparak güncel fiyatları görebilirsiniz.',
  bagaj: 'Bagaj hakları havayoluna göre değişmektedir. Genellikle ekonomi sınıfta 20 kg bagaj hakkı verilmektedir. Rezervasyon sırasında detaylı bilgi alabilirsiniz.',
  iptal: 'Uçuş iptalleri durumunda size e-posta ile bilgilendirme yapılır ve otomatik olarak tam iade işlemi başlatılır.',
  iletişim: 'Müşteri hizmetlerimize 7/24 0850 XXX XX XX numaralı telefondan ulaşabilirsiniz.',
};

const isFlightSearchPayload = (payload: ChatPayload | undefined): payload is FlightSearchChatPayload => {
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    payload.type === 'flight_search_result' &&
    Array.isArray(payload.data)
  );
};

const formatTime = (dateTime: string) => {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '--:--';

  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (dateTime: string) => {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return dateTime;
  return date.toISOString().slice(0, 10);
};

const calculateDuration = (departureTime: string, arrivalTime: string) => {
  const departure = new Date(departureTime).getTime();
  const arrival = new Date(arrivalTime).getTime();

  if (Number.isNaN(departure) || Number.isNaN(arrival) || arrival <= departure) {
    return 'Direkt';
  }

  const totalMinutes = Math.round((arrival - departure) / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}s ${minutes}dk`;
};

const flightSearchLocations = [
  { name: 'İstanbul', aliases: ['istanbul', 'ist', 'saw', 'sabiha gokcen', 'istanbul havalimani'] },
  { name: 'Ankara', aliases: ['ankara', 'esb', 'esenboga'] },
  { name: 'İzmir', aliases: ['izmir', 'adb', 'adnan menderes'] },
  { name: 'Antalya', aliases: ['antalya', 'ayt'] },
  { name: 'Paris', aliases: ['paris', 'cdg', 'orly'] },
  { name: 'Londra', aliases: ['londra', 'london', 'lhr', 'gatwick'] },
  { name: 'Berlin', aliases: ['berlin', 'ber'] },
  { name: 'Roma', aliases: ['roma', 'rome', 'fco'] },
  { name: 'Dubai', aliases: ['dubai', 'dxb'] },
  { name: 'New York', aliases: ['new york', 'jfk', 'ewr'] },
  { name: 'Tokyo', aliases: ['tokyo', 'nrt', 'hnd'] },
];

const baseChatFlightPrices: Record<string, number> = {
  'İstanbul': 1800,
  'Ankara': 800,
  'İzmir': 750,
  'Antalya': 900,
  'Paris': 2450,
  'Londra': 3200,
  'Berlin': 2300,
  'Roma': 2800,
  'Dubai': 2200,
  'New York': 5800,
  'Tokyo': 5500,
  default: 2500,
};

const normalizeSearchText = (value: string) =>
  value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

const extractCity = (location: string) => location.split(' (')[0].trim();

const formatLocalIsoDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatLocalDateTime = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:00`;
};

const getTodayIsoDate = () => formatLocalIsoDate(new Date());

const toIsoDate = (day: number, month: number, year?: number) => {
  if (day < 1 || day > 31 || month < 1 || month > 12) return '';

  const currentYear = new Date().getFullYear();
  const resolvedYear = year || currentYear;
  const date = new Date(resolvedYear, month - 1, day);

  if (Number.isNaN(date.getTime())) return '';
  if (date.getDate() !== day || date.getMonth() !== month - 1) return '';

  if (!year) {
    const today = new Date(getTodayIsoDate());
    if (date < today) {
      date.setFullYear(resolvedYear + 1);
    }
  }

  return formatLocalIsoDate(date);
};

const parseDateFromMessage = (message: string) => {
  const normalized = normalizeSearchText(message);
  const isoDate = normalized.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2].padStart(2, '0')}-${isoDate[3].padStart(2, '0')}`;
  }

  const numericDate = normalized.match(/\b(\d{1,2})[./](\d{1,2})(?:[./](20\d{2}))?\b/);
  if (numericDate) {
    return toIsoDate(Number(numericDate[1]), Number(numericDate[2]), numericDate[3] ? Number(numericDate[3]) : undefined);
  }

  const months: Record<string, number> = {
    ocak: 1,
    subat: 2,
    mart: 3,
    nisan: 4,
    mayis: 5,
    haziran: 6,
    temmuz: 7,
    agustos: 8,
    eylul: 9,
    ekim: 10,
    kasim: 11,
    aralik: 12,
  };
  const monthDate = normalized.match(/\b(\d{1,2})\s+(ocak|subat|mart|nisan|mayis|haziran|temmuz|agustos|eylul|ekim|kasim|aralik)(?:\s+(20\d{2}))?\b/);
  if (monthDate) {
    return toIsoDate(Number(monthDate[1]), months[monthDate[2]], monthDate[3] ? Number(monthDate[3]) : undefined);
  }

  return '';
};

const parseTimeFromMessage = (message: string) => {
  const normalized = normalizeSearchText(message);
  const exactTime = normalized.match(/(?:saat\s*)?\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (exactTime) {
    return `${exactTime[1].padStart(2, '0')}:${exactTime[2]}`;
  }

  const hourOnly = normalized.match(/\bsaat\s+([01]?\d|2[0-3])\b/);
  if (hourOnly) {
    return `${hourOnly[1].padStart(2, '0')}:00`;
  }

  return '';
};

const timeToMinutes = (time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const findLocationMentions = (message: string) => {
  const normalized = normalizeSearchText(message);

  return flightSearchLocations
    .flatMap((location) =>
      location.aliases.map((alias) => {
        const normalizedAlias = normalizeSearchText(alias);
        const shortCodeMatch = normalizedAlias.length <= 3
          ? normalized.match(new RegExp(`\\b${escapeRegExp(normalizedAlias)}\\b`))
          : null;

        return {
          name: location.name,
          index: shortCodeMatch?.index ?? (normalizedAlias.length <= 3 ? -1 : normalized.indexOf(normalizedAlias)),
        };
      })
    )
    .filter((mention) => mention.index >= 0)
    .sort((a, b) => a.index - b.index)
    .filter((mention, index, all) => all.findIndex((item) => item.name === mention.name) === index);
};

const getCurrentSearchParams = () => {
  const params = new URLSearchParams(window.location.search);
  const from = params.get('from') || '';
  const to = params.get('to') || '';

  return {
    from: from ? extractCity(from) : '',
    to: to ? extractCity(to) : '',
    departureDate: params.get('departDate') || '',
  };
};

const parseFlightSearchRequest = (message: string) => {
  const normalized = normalizeSearchText(message);
  const hasFlightIntent = ['ucus', 'sefer', 'bilet', 'rota'].some((keyword) => normalized.includes(keyword));
  if (!hasFlightIntent) return null;

  const mentions = findLocationMentions(message);
  const currentSearch = getCurrentSearchParams();
  const from = mentions[0]?.name || currentSearch.from;
  const to = mentions.find((mention) => mention.name !== from)?.name || currentSearch.to;
  const departureDate = parseDateFromMessage(message) || currentSearch.departureDate || getTodayIsoDate();
  const requestedTime = parseTimeFromMessage(message);

  if (!from || !to || from === to) return null;

  return { from, to, departureDate, requestedTime };
};

const buildMockFlightDateTime = (date: string, time: string) => `${date}T${time}:00`;

const addMinutesToDateTime = (dateTime: string, minutes: number) => {
  const date = new Date(dateTime);
  date.setMinutes(date.getMinutes() + minutes);
  return formatLocalDateTime(date);
};

const generateChatMockFlights = (from: string, to: string, date: string): FlightDto[] => {
  const basePrice = baseChatFlightPrices[to] || baseChatFlightPrices.default;
  const baseFlights = [
    { id: 9001, flightNo: 'SF101', airline: 'Turkish Airlines', departTime: '07:15', durationMinutes: 80, multiplier: 0.7, seats: 5 },
    { id: 9002, flightNo: 'SF214', airline: 'Pegasus Airlines', departTime: '10:30', durationMinutes: 75, multiplier: 0.9, seats: 12 },
    { id: 9003, flightNo: 'SF330', airline: 'AJet', departTime: '14:00', durationMinutes: 85, multiplier: 0.8, seats: 8 },
    { id: 9004, flightNo: 'SF480', airline: 'SunExpress', departTime: '18:45', durationMinutes: 90, multiplier: 1, seats: 20 },
  ];

  return baseFlights.map((flight) => {
    const departureTime = buildMockFlightDateTime(date, flight.departTime);
    return {
      id: flight.id,
      flightNo: flight.flightNo,
      airline: flight.airline,
      departure: from,
      arrival: to,
      departureTime,
      arrivalTime: addMinutesToDateTime(departureTime, flight.durationMinutes),
      price: Math.round(basePrice * flight.multiplier),
      capacity: 144,
      availableSeats: flight.seats,
      status: 'SCHEDULED',
    };
  });
};

const filterFlightsByRequestedTime = (flights: FlightDto[], requestedTime: string) => {
  if (!requestedTime) return flights;
  const requestedMinutes = timeToMinutes(requestedTime);
  const filteredFlights = flights.filter((flight) => {
    const departureMinutes = timeToMinutes(formatTime(flight.departureTime));
    return departureMinutes >= requestedMinutes;
  });

  return filteredFlights.length ? filteredFlights : flights;
};

export default function Chatbot() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [voiceConversationId, setVoiceConversationId] = useState('');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    const greeting = user
      ? `Merhaba ${user.name}! Seferio Air müşteri destek botuna hoş geldiniz. Size nasıl yardımcı olabilirim?`
      : 'Merhaba! Seferio Air müşteri destek botuna hoş geldiniz. Size nasıl yardımcı olabilirim?';

    setMessages([
      {
        id: '1',
        text: greeting,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  }, [user]);

  const getBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLocaleLowerCase('tr-TR');

    if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam')) {
      return botResponses.merhaba;
    }
    if (lowerMessage.includes('rezervasyon') || lowerMessage.includes('bilet al')) {
      return botResponses.rezervasyon;
    }
    if (lowerMessage.includes('iade') || lowerMessage.includes('iptal')) {
      return botResponses.iade;
    }
    if (lowerMessage.includes('fiyat') || lowerMessage.includes('ücret')) {
      return botResponses.fiyat;
    }
    if (lowerMessage.includes('bagaj') || lowerMessage.includes('valiz')) {
      return botResponses.bagaj;
    }
    if (lowerMessage.includes('uçuş iptal')) {
      return botResponses.iptal;
    }
    if (lowerMessage.includes('iletişim') || lowerMessage.includes('telefon')) {
      return botResponses.iletişim;
    }

    return botResponses.default;
  };

  const buildBotMessage = (responsePayload: ChatPayload | undefined, fallbackText: string): Message => {
    if (isFlightSearchPayload(responsePayload)) {
      return {
        id: (Date.now() + 1).toString(),
        text: responsePayload.assistantText || fallbackText,
        sender: 'bot',
        timestamp: new Date(),
        flights: responsePayload.data,
      };
    }

    return {
      id: (Date.now() + 1).toString(),
      text: typeof responsePayload === 'string' ? responsePayload : fallbackText,
      sender: 'bot',
      timestamp: new Date(),
    };
  };

  const buildLocalFlightSearchMessage = async (userMessage: string): Promise<Message | null> => {
    const parsedSearch = parseFlightSearchRequest(userMessage);
    if (!parsedSearch) return null;

    let flights: FlightDto[] = [];

    try {
      const response = await flightService.searchFlights({
        departure: parsedSearch.from,
        arrival: parsedSearch.to,
        departureDate: parsedSearch.departureDate,
      });
      const backendFlights = response.data || response.payload;
      flights = Array.isArray(backendFlights) && backendFlights.length
        ? backendFlights
        : generateChatMockFlights(parsedSearch.from, parsedSearch.to, parsedSearch.departureDate);
    } catch {
      flights = generateChatMockFlights(parsedSearch.from, parsedSearch.to, parsedSearch.departureDate);
    }

    const visibleFlights = filterFlightsByRequestedTime(flights, parsedSearch.requestedTime);
    const timeText = parsedSearch.requestedTime ? ` ${parsedSearch.requestedTime} ve sonrasÄ± iÃ§in` : '';

    return {
      id: (Date.now() + 1).toString(),
      text: `${parsedSearch.departureDate} tarihinde ${parsedSearch.from} - ${parsedSearch.to}${timeText} ${visibleFlights.length} uygun sefer buldum. Kartlardan uÃ§uÅŸ seÃ§ebilirsiniz.`,
      sender: 'bot',
      timestamp: new Date(),
      flights: visibleFlights,
    };
  };

  const addBotMessage = (text: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        text,
        sender: 'bot',
        timestamp: new Date(),
      },
    ]);
  };

  const getVoicePayload = (response: VoiceProcessResponse | { payload?: VoiceProcessResponse; data?: VoiceProcessResponse }) => {
    if ('payload' in response && response.payload) return response.payload;
    if ('data' in response && response.data) return response.data;
    return response as VoiceProcessResponse;
  };

  const handleSelectFlight = (flight: FlightDto) => {
    const currentParams = new URLSearchParams(window.location.search);
    const adultPassengers = currentParams.get('adultPassengers') || currentParams.get('passengers') || '1';
    const childPassengers = currentParams.get('childPassengers') || '0';
    const studentPassengers = currentParams.get('studentPassengers') || '0';

    const params = new URLSearchParams({
      tripType: 'oneWay',
      from: flight.departure,
      to: flight.arrival,
      departDate: formatDate(flight.departureTime),
      adultPassengers,
      childPassengers,
      studentPassengers,
    });

    setOpen(false);
    localStorage.setItem('selectedChatFlight', JSON.stringify(flight));
    window.location.assign(`/booking/${flight.id}?${params.toString()}`);
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const outgoingText = inputValue;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: outgoingText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    try {
      const response = await chatService.chat(outgoingText);
      const payload = response.payload ?? response.data;
      const botMessage = buildBotMessage(payload, getBotResponse(outgoingText));

      if (botMessage.flights?.length) {
        setMessages((prev) => [...prev, botMessage]);
        return;
      }

      const localFlightMessage = await buildLocalFlightSearchMessage(outgoingText);
      setMessages((prev) => [...prev, localFlightMessage || botMessage]);
    } catch {
      const localFlightMessage = await buildLocalFlightSearchMessage(outgoingText);
      if (localFlightMessage) {
        setMessages((prev) => [...prev, localFlightMessage]);
        return;
      }

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getBotResponse(outgoingText),
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }
  };

  const handleVoiceClick = async () => {
    if (isRecording && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === 'undefined') {
      addBotMessage('Tarayıcınız sesli yardım için mikrofon kaydını desteklemiyor.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach((track) => track.stop());

        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            text: 'Sesli mesaj gönderildi.',
            sender: 'user',
            timestamp: new Date(),
          },
        ]);

        try {
          const response = await voiceService.processVoice(audioBlob, voiceConversationId || undefined);
          const voicePayload = getVoicePayload(response);
          if (voicePayload.conversationId) {
            setVoiceConversationId(voicePayload.conversationId);
          }
          addBotMessage(voicePayload.answer || voicePayload.transcript || 'Sesli yardım yanıtı alındı.');
        } catch {
          addBotMessage('Sesli yardım simgesi hazır. Backend bağlandığında ses kaydı asistana gönderilecek.');
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      addBotMessage('Mikrofon izni alınamadı. Tarayıcıdan mikrofon iznini açarak tekrar deneyebilirsiniz.');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Trigger asChild>
          <button
            className="fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-primary to-accent text-white rounded-2xl shadow-2xl shadow-primary/30 hover:shadow-3xl hover:scale-110 transition-all flex items-center justify-center z-40 group"
            aria-label="Chatbot aç"
          >
            <MessageCircle className="w-7 h-7 group-hover:scale-110 transition-transform" />
          </button>
        </Dialog.Trigger>

        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50" />
          <Dialog.Content className="fixed bottom-6 right-6 w-full max-w-md h-[600px] backdrop-blur-xl bg-card/95 border border-border/50 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden">
            <div className="bg-gradient-to-r from-primary to-accent text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center">
                  <MessageCircle className="w-6 h-6" />
                </div>
                <div>
                  <Dialog.Title className="text-lg">Seferio Air Destek</Dialog.Title>
                  <Dialog.Description className="text-sm opacity-90">
                    7/24 Canlı Yardım
                  </Dialog.Description>
                </div>
              </div>
              <Dialog.Close asChild>
                <button className="hover:bg-white/20 rounded-xl p-2 transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </Dialog.Close>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-muted/20 to-transparent">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`${message.flights?.length ? 'max-w-[96%]' : 'max-w-[80%]'} p-4 rounded-2xl ${
                      message.sender === 'user'
                        ? 'bg-gradient-to-br from-primary to-accent text-white shadow-lg'
                        : 'bg-card border border-border/50 shadow-sm'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.text}</p>

                    {message.flights?.length ? (
                      <div className="mt-3 space-y-3">
                        {message.flights.map((flight) => {
                          const duration = calculateDuration(flight.departureTime, flight.arrivalTime);
                          return (
                            <div
                              key={flight.id}
                              className="rounded-2xl border border-primary/20 bg-background/90 p-3 shadow-sm"
                            >
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
                                  <div className="line-clamp-2 text-xs text-muted-foreground">{flight.departure}</div>
                                </div>

                                <div className="flex flex-col items-center px-1">
                                  <div className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="h-3 w-3" />
                                    {duration}
                                  </div>
                                  <div className="relative flex w-full items-center">
                                    <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-primary/20 via-primary to-primary/20" />
                                    <Plane className="absolute left-1/2 h-4 w-4 -translate-x-1/2 rotate-90 bg-background text-primary" />
                                  </div>
                                  <div className="mt-1 rounded bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                                    Direkt
                                  </div>
                                </div>

                                <div className="text-right">
                                  <div className="text-xl">{formatTime(flight.arrivalTime)}</div>
                                  <div className="line-clamp-2 text-xs text-muted-foreground">{flight.arrival}</div>
                                </div>
                              </div>

                              <div className="mt-4 flex items-center justify-between gap-3">
                                <div>
                                  <div className="text-xs text-muted-foreground">Kişi başı</div>
                                  <div className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                    ₺{flight.price.toLocaleString('tr-TR')}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {flight.availableSeats} koltuk kaldı
                                  </div>
                                </div>

                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => handleSelectFlight(flight)}
                                  className="rounded-xl bg-gradient-to-r from-primary to-accent"
                                >
                                  Seç
                                  <ArrowRight className="ml-1 h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}

                    <p
                      className={`text-xs mt-2 ${
                        message.sender === 'user'
                          ? 'text-white/70'
                          : 'text-muted-foreground'
                      }`}
                    >
                      {message.timestamp.toLocaleTimeString('tr-TR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 border-t border-border/50 bg-card/50">
              <div className="flex gap-3">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Mesajınızı yazın..."
                  className="flex-1 h-12 rounded-2xl"
                />
                <button
                  onClick={handleVoiceClick}
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform shadow-lg ${
                    isRecording
                      ? 'bg-destructive text-white animate-pulse'
                      : 'bg-secondary text-secondary-foreground hover:scale-105'
                  }`}
                  aria-label={isRecording ? 'Ses kaydını durdur' : 'Sesli yardım'}
                  title={isRecording ? 'Ses kaydını durdur' : 'Sesli yardım'}
                >
                  {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <button
                  onClick={handleSend}
                  className="w-12 h-12 bg-gradient-to-br from-primary to-accent text-white rounded-2xl flex items-center justify-center hover:scale-105 transition-transform shadow-lg"
                  aria-label="Mesaj gönder"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
