import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Progress } from '../components/ui/progress';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Plane, CreditCard, User, Mail, Phone, CheckCircle, Armchair, Briefcase, Star, ChevronDown, Check, IdCard, Monitor, AlertTriangle, ShieldCheck, ExternalLink, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import { AirlineLogo } from '../utils/airlineLogos';
import { FlightDto, SeatDto, flightService } from '../services/flightService';
import { paymentService, type CheckoutSessionDto } from '../services/paymentService';

// Countries that require visa for Turkish citizens
const visaRequiredCountries = [
  // ABD
  'New York', 'Los Angeles', 'Miami',
  // İngiltere
  'Londra',
  // Almanya
  'Berlin',
  // Fransa
  'Paris',
  // İtalya
  'Roma',
  // İspanya
  'Barcelona',
  // Hollanda
  'Amsterdam',
  // Belçika
  'Brüksel',
  // İsveç
  'Stokholm',
  // Norveç
  'Oslo',
  // Avusturya
  'Viyana',
  // İsviçre
  'Zürih', 'Cenevre',
  // Portekiz
  'Lizbon',
  // Yunanistan
  'Atina',
  // Çek Cumhuriyeti
  'Prag',
  // Polonya
  'Varşova',
  // Danimarka
  'Kopenhag',
  // Finlandiya
  'Helsinki',
  // Macaristan
  'Budapeşte',
  // Romanya
  'Bükreş',
  // Bulgaristan
  'Sofya',
  // Hırvatistan
  'Zagreb',
  // İrlanda
  'Dublin',
  // Kanada
  'Toronto', 'Vancouver', 'Montreal',
  // Diğer ülkeler (Çin, Japonya, Hindistan, vb.)
  'Pekin', 'Şangay', 'Hong Kong',
  'Tokyo',
  'Seul',
  'Delhi', 'Mumbai',
  'Cape Town',
];

const requiresVisa = (destination: string) => {
  // Extract city name from destination (handles both "City" and "City (CODE)" formats)
  const city = destination.split(' (')[0];
  return visaRequiredCountries.some(country => city.includes(country));
};

const phoneCountryOptions = [
  { country: 'Türkiye', code: '+90' },
  { country: 'ABD / Kanada', code: '+1' },
  { country: 'İngiltere', code: '+44' },
  { country: 'Almanya', code: '+49' },
  { country: 'Fransa', code: '+33' },
  { country: 'İtalya', code: '+39' },
  { country: 'İspanya', code: '+34' },
  { country: 'BAE', code: '+971' },
  { country: 'Katar', code: '+974' },
  { country: 'Japonya', code: '+81' },
];

const turkeyCities = ['İstanbul', 'Ankara', 'İzmir', 'Antalya', 'Adana', 'Trabzon', 'Dalaman', 'Bodrum', 'Kayseri'];

const paymentCountryOptions = [
  'Türkiye',
  'ABD',
  'İngiltere',
  'Almanya',
  'Fransa',
  'İtalya',
  'İspanya',
  'Hollanda',
  'Kanada',
  'Japonya',
  'BAE',
  'Katar',
];

type PassengerType = 'adult' | 'child' | 'student';

interface PassengerInfo {
  id: string;
  type: PassengerType;
  typeLabel: string;
  fareMultiplier: number;
  firstName: string;
  lastName: string;
  identityNumber: string;
  passportNumber?: string;
  gender?: string;
  email?: string;
  phoneNumber?: string;
}

const extractCity = (location: string | { city?: string; airport?: string } | unknown) => {
  if (typeof location === 'string') {
    return location.split(' (')[0];
  }
  if (location && typeof location === 'object' && 'city' in location) {
    return (location as { city?: string }).city || '';
  }
  return '';
};

const isTurkeyLocation = (location: string) => {
  const normalizedLocation = extractCity(location).toLocaleLowerCase('tr-TR');
  return turkeyCities.some((city) => normalizedLocation.includes(city.toLocaleLowerCase('tr-TR')));
};

const isTurkeyDomesticFlight = (from: string, to: string) => {
  return isTurkeyLocation(from) && isTurkeyLocation(to);
};

const getFlightClassSurcharge = (flightClass: string): number => {
  const classMap: Record<string, number> = {
    economy: 0,
    business: 2625,
    first: 5250,
  };
  return classMap[flightClass] || 0;
};

const getPassengerTypeMultiplier = (passengerType: PassengerType): number => {
  const multiplierMap: Record<PassengerType, number> = {
    adult: 1,
    child: 0.5,
    student: 0.8,
  };
  return multiplierMap[passengerType];
};

const calculatePassengerPrice = (basePrice: number, flightClass: string, passengerType: PassengerType): number => {
  const surcharge = getFlightClassSurcharge(flightClass);
  const multiplier = getPassengerTypeMultiplier(passengerType);
  return Math.round((basePrice + surcharge) * multiplier);
};

const onlyDigits = (value: string, maxLength?: number) => {
  const digits = value.replace(/\D/g, '');
  return maxLength ? digits.slice(0, maxLength) : digits;
};

const createPassengerList = (adultCount: number, childCount: number, studentCount: number): PassengerInfo[] => {
  const list: PassengerInfo[] = [];

  const addPassengers = (count: number, type: PassengerType, typeLabel: string, fareMultiplier: number) => {
    for (let index = 0; index < count; index += 1) {
      list.push({
        id: `${type}-${index + 1}`,
        type,
        typeLabel,
        fareMultiplier,
        firstName: '',
        lastName: '',
        identityNumber: '',
        passportNumber: '',
        gender: '',
        email: '',
        phoneNumber: '',
      });
    }
  };

  addPassengers(adultCount, 'adult', 'Yetişkin', 1);
  addPassengers(childCount, 'child', 'Çocuk (2-12 yaş)', 0.65);
  addPassengers(studentCount, 'student', 'Öğrenci', 0.85);

  return list;
};

const formatCardNumber = (value: string) => {
  return onlyDigits(value, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
};

const formatCardExpiry = (value: string) => {
  const digits = onlyDigits(value, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
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

const getLocationDisplay = (location: string | { city: string; airport: string } | unknown): string => {
  if (typeof location === 'string') return location;
  if (location && typeof location === 'object' && 'city' in location) {
    return (location as { city: string }).city;
  }
  return '';
};

const mapBackendFlight = (flight: FlightDto) => ({
  airline: flight.airline,
  from: getLocationDisplay(flight.departure),
  to: getLocationDisplay(flight.arrival),
  departTime: formatTime(flight.departureTime),
  arriveTime: formatTime(flight.arrivalTime),
  duration: 'Direkt',
  date: formatDate(flight.departureTime),
  price: flight.price,
});

const getStoredChatFlight = (flightId?: string) => {
  if (!flightId) return null;

  try {
    const storedFlight = JSON.parse(localStorage.getItem('selectedChatFlight') || 'null') as FlightDto | null;
    if (!storedFlight || String(storedFlight.id) !== String(flightId)) return null;
    return mapBackendFlight(storedFlight);
  } catch {
    return null;
  }
};

const extractReservationId = (payload: unknown): number | null => {
  if (payload && typeof payload === 'object' && 'id' in payload) {
    const n = Number((payload as { id: unknown }).id);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const mockFlightData: Record<string, any> = {
  '1': {
    airline: 'Turkish Airlines',
    from: 'İstanbul',
    to: 'Paris',
    departTime: '10:30',
    arriveTime: '14:45',
    duration: '4s 15dk',
    date: '2026-05-15',
    price: 2450,
  },
  '2': {
    airline: 'Pegasus Airlines',
    from: 'İstanbul',
    to: 'Paris',
    departTime: '14:00',
    arriveTime: '18:20',
    duration: '4s 20dk',
    date: '2026-05-15',
    price: 1890,
  },
  '3': {
    airline: 'Turkish Airlines',
    from: 'İstanbul',
    to: 'Paris',
    departTime: '18:45',
    arriveTime: '23:10',
    duration: '4s 25dk',
    date: '2026-05-15',
    price: 2100,
  },
  '4': {
    airline: 'SunExpress',
    from: 'İstanbul',
    to: 'Paris',
    departTime: '07:15',
    arriveTime: '11:35',
    duration: '4s 20dk',
    date: '2026-05-15',
    price: 1750,
  },
};

export default function Booking() {
  const { flightId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [backendFlight, setBackendFlight] = useState<any | null>(null);
  const tripType = searchParams.get('tripType') || 'oneWay';
  const returnFlightId = searchParams.get('returnFlightId') || '';
  const storedChatFlight = getStoredChatFlight(flightId);
  const shouldUseStoredChatFlight = Boolean(
    storedChatFlight &&
    (!searchParams.get('from') || searchParams.get('from') === storedChatFlight.from) &&
    (!searchParams.get('to') || searchParams.get('to') === storedChatFlight.to)
  );
  const fallbackFlight = shouldUseStoredChatFlight ? storedChatFlight : mockFlightData[flightId || '1'];
  const flight = backendFlight || (fallbackFlight ? {
    ...fallbackFlight,
    from: searchParams.get('from') || fallbackFlight.from,
    to: searchParams.get('to') || fallbackFlight.to,
    date: searchParams.get('departDate') || fallbackFlight.date,
  } : null);
  const returnFlightTemplate = returnFlightId ? mockFlightData[returnFlightId] : null;
  const returnFlight = tripType === 'roundTrip' && returnFlightTemplate && flight ? {
    ...returnFlightTemplate,
    from: searchParams.get('to') || flight.to,
    to: searchParams.get('from') || flight.from,
    date: searchParams.get('returnDate') || returnFlightTemplate.date,
  } : null;
  const itineraryBasePrice = (flight?.price || 0) + (returnFlight?.price || 0);
  const adultPassengers = Number(searchParams.get('adultPassengers') || '1');
  const childPassengers = Number(searchParams.get('childPassengers') || '0');
  const studentPassengers = Number(searchParams.get('studentPassengers') || '0');
  const passengerCount = adultPassengers + childPassengers + studentPassengers;
  const passengerFareMultiplier = adultPassengers + childPassengers * 0.65 + studentPassengers * 0.85;
  const identityType = isTurkeyDomesticFlight(flight?.from || '', flight?.to || '') ? 'tc' : 'passport';
  const passengerTypeTotals = [
    { key: 'adult', label: 'Yetişkin', count: adultPassengers, multiplier: 1 },
    { key: 'child', label: 'Çocuk', count: childPassengers, multiplier: 0.65 },
    { key: 'student', label: 'Öğrenci', count: studentPassengers, multiplier: 0.85 },
  ].filter((item) => item.count > 0);

  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    cardHolderName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
  });
  const [passengerInfos, setPassengerInfos] = useState<PassengerInfo[]>(() =>
    createPassengerList(adultPassengers, childPassengers, studentPassengers)
  );

  const [selectedClass, setSelectedClass] = useState(() => {
    const classFromUrl = searchParams.get('flightClass');
    return classFromUrl || 'economy';
  });
  const [selectedSeat, setSelectedSeat] = useState('');
  const [apiSeats, setApiSeats] = useState<SeatDto[]>([]);
  const [hasSeatResponse, setHasSeatResponse] = useState(false);
  const [isLoadingSeats, setIsLoadingSeats] = useState(false);
  const [seatLoadError, setSeatLoadError] = useState<string | null>(null);
  const [selectedBaggage, setSelectedBaggage] = useState('none');
  const [selectedWifi, setSelectedWifi] = useState('none');
  const [selectedEntertainment, setSelectedEntertainment] = useState('none');
  const [visaConfirmed, setVisaConfirmed] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+90');
  const [bookingStep, setBookingStep] = useState<'extras' | 'passenger' | 'payment'>('extras');
  const [paymentMethod] = useState<'stripe' | 'card'>('stripe');
  const [paymentCountry, setPaymentCountry] = useState('Türkiye');
  const [isSavingReservation, setIsSavingReservation] = useState(false);
  const [checkoutReservationId, setCheckoutReservationId] = useState<number | null>(null);

  useEffect(() => {
    setCheckoutReservationId(null);
  }, [flightId]);

  const calculateTotalPrice = () => {
    if (!flight) return 0;
    let total = 0;
    passengerInfos.forEach((passenger) => {
      const price = calculatePassengerPrice(flight.price, selectedClass, passenger.type);
      total += price;
      if (returnFlight) {
        const returnPrice = calculatePassengerPrice(returnFlight.price, selectedClass, passenger.type);
        total += returnPrice;
      }
    });
    return total;
  };
  const totalPrice = calculateTotalPrice();

  const renderPaymentCountrySelect = () => (
    <div className="mb-4">
      <label className="block mb-3 text-sm text-muted-foreground">Ülke veya bölge</label>
      <Select.Root value={paymentCountry} onValueChange={setPaymentCountry}>
        <Select.Trigger className="h-12 px-4 rounded-2xl bg-input-background border-2 border-border flex items-center justify-between hover:border-primary transition-colors">
          <Select.Value />
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </Select.Trigger>
        <Select.Portal>
          <Select.Content className="bg-popover border-2 border-border rounded-2xl shadow-2xl overflow-hidden z-50">
            <Select.Viewport className="p-2">
              {paymentCountryOptions.map((country) => (
                <Select.Item
                  key={country}
                  value={country}
                  className="px-4 py-3 rounded-xl cursor-pointer hover:bg-primary/10 outline-none flex items-center justify-between transition-colors"
                >
                  <Select.ItemText>{country}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check className="w-4 h-4 text-primary" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.Viewport>
          </Select.Content>
        </Select.Portal>
      </Select.Root>
    </div>
  );

  useEffect(() => {
    if (!flightId) return;

    flightService.getFlightById(flightId)
      .then((response) => {
        const flightData = response.data || response.payload;
        setBackendFlight(flightData && typeof flightData === 'object' ? mapBackendFlight(flightData as FlightDto) : null);
      })
      .catch(() => setBackendFlight(null));
  }, [flightId]);

  useEffect(() => {
    setPassengerInfos((previousPassengers) => {
      const nextPassengers = createPassengerList(adultPassengers, childPassengers, studentPassengers);

      return nextPassengers.map((passenger) => {
        const existingPassenger = previousPassengers.find((item) => item.id === passenger.id);
        return existingPassenger ? { ...passenger, ...existingPassenger } : passenger;
      });
    });
  }, [adultPassengers, childPassengers, studentPassengers]);

  const fetchSeatsForFlight = useCallback(() => {
    if (!flightId) return;

    const classMap: Record<string, string> = {
      economy: 'ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST_CLASS',
    };

    setSelectedSeat('');
    setSeatLoadError(null);
    setIsLoadingSeats(true);
    setHasSeatResponse(false);
    flightService.getSeatsByFlight(flightId, 'AVAILABLE', classMap[selectedClass])
      .then((response) => {
        const seatsData = response.data || response.payload || [];
        setApiSeats(Array.isArray(seatsData) ? seatsData : []);
        setHasSeatResponse(true);
      })
      .catch(() => {
        setApiSeats([]);
        setHasSeatResponse(true);
        setSeatLoadError('Koltuklar yüklenemedi. Bağlantınızı kontrol edip tekrar deneyin.');
      })
      .finally(() => {
        setIsLoadingSeats(false);
      });
  }, [flightId, selectedClass]);

  useEffect(() => {
    fetchSeatsForFlight();
  }, [fetchSeatsForFlight]);

  const classOptions = [
    {
      id: 'economy',
      label: 'Economy Class',
      surcharge: 0,
      description: 'Standart konfor',
      features: ['Standart koltuk', 'İkram servisi', '20kg bagaj hakkı']
    },
    {
      id: 'business',
      label: 'Business Class',
      surcharge: 2625,
      description: 'Premium deneyim',
      features: ['Geniş koltuk', 'Özel menü', '30kg bagaj hakkı', 'Lounge erişimi']
    },
    {
      id: 'first',
      label: 'First Class',
      surcharge: 5250,
      description: 'Lüks seyahat',
      features: ['Yatay koltuk', 'Şef menüsü', '40kg bagaj hakkı', 'VIP lounge', 'Limuzin servisi']
    },
  ];

  const getSeatMapByClass = () => {
    if (selectedClass === 'economy') {
      // Economy: rows 8-27 (20 sıra), columns A-F (6 koltuk) = 120 toplam
      return {
        rows: Array.from({ length: 20 }, (_, i) => ({
          number: 8 + i,
          isExtraLegroom: i < 3, // rows 8-10: extra legroom
          price: i < 3 ? 150 : 0,
        })),
        columns: ['A', 'B', 'C', '', 'D', 'E', 'F'],
        occupiedSeats: ['15B', '16A', '17D', '20C', '21E', '25A', '26F'],
      };
    } else if (selectedClass === 'business') {
      // Business: rows 3-7 (5 sıra), columns A-D (4 koltuk) = 20 toplam
      return {
        rows: [
          { number: 3, isExtraLegroom: false, price: 0 },
          { number: 4, isExtraLegroom: false, price: 0 },
          { number: 5, isExtraLegroom: false, price: 0 },
          { number: 6, isExtraLegroom: false, price: 0 },
          { number: 7, isExtraLegroom: false, price: 0 },
        ],
        columns: ['A', 'B', 'C', '', 'D'],
        occupiedSeats: ['3A', '4D', '5C', '7B'],
      };
    } else {
      // First Class: rows 1-2 (2 sıra), columns A-B (2 koltuk) = 4 toplam
      return {
        rows: [
          { number: 1, isExtraLegroom: false, price: 0 },
          { number: 2, isExtraLegroom: false, price: 0 },
        ],
        columns: ['A', 'B'],
        occupiedSeats: ['1A'],
      };
    }
  };

  const seatMap = getSeatMapByClass();
  const selectableApiSeats = useMemo(
    () => apiSeats.filter((seat) => String(seat.status).toUpperCase() === 'AVAILABLE'),
    [apiSeats],
  );
  const apiSeatByNumber = useMemo(
    () => new Map(selectableApiSeats.map((seat) => [seat.seatNumber.trim().toUpperCase(), seat])),
    [selectableApiSeats],
  );
  const selectedSeatData = apiSeats.find((seat) => String(seat.id) === selectedSeat);
  const selectedSeatNumber = selectedSeatData?.seatNumber || selectedSeat;
  const selectedSeatIdNum = selectedSeat ? Number(selectedSeat) : 0;
  const hasValidSeatForReservation = Boolean(selectedSeatData && selectedSeatIdNum > 0);

  const baggageOptions = [
    { id: 'none', label: 'Sadece El Bagajı (8kg)', price: 0, description: 'Ücretsiz' },
    { id: 'KG_20', label: '20 kg Bagaj', price: 250, description: 'Standart bagaj hakkı' },
    { id: 'KG_30', label: '30 kg Bagaj', price: 450, description: 'Ekstra bagaj hakkı' },
    { id: 'KG_40', label: '40 kg Bagaj', price: 650, description: 'Maksimum bagaj hakkı' },
  ];

  const wifiOptions = [
    { id: 'none', label: 'WiFi İstemiyorum', price: 0, description: 'Ücretsiz' },
    { id: 'BASIC', label: 'Temel WiFi', price: 150, description: 'Mesajlaşma ve hafif browsing' },
    { id: 'PREMIUM', label: 'Premium WiFi', price: 300, description: 'Tüm internet hizmetleri' },
  ];

  const entertainmentOptions = [
    { id: 'none', label: 'Eğlence Paketi İstemiyorum', price: 0, description: 'Ücretsiz' },
    { id: 'BASIC', label: 'Temel Eğlence', price: 100, description: 'Film ve müzik kataloglarından seçim' },
    { id: 'PREMIUM', label: 'Premium Eğlence', price: 200, description: 'Tüm içerikler, oyunlar ve uygulamalar' },
  ];

  const getClassPrice = () => {
    // Class surcharge is now calculated per-passenger in calculatePassengerPrice
    return 0; // Surcharge already included in base price
  };

  const getBaseFarePrice = () => totalPrice;

  const getPassengerTypeFare = (count: number, multiplier: number) => {
    if (!flight) return 0;
    let fare = 0;
    for (let i = 0; i < count; i++) {
      const typeMultiplier = multiplier;
      const singleFare = Math.round((flight.price + getFlightClassSurcharge(selectedClass)) * typeMultiplier);
      fare += singleFare;
      if (returnFlight) {
        fare += Math.round((returnFlight.price + getFlightClassSurcharge(selectedClass)) * typeMultiplier);
      }
    }
    return fare;
  };

  const getExtrasSubtotal = () => getSeatPrice() + getBaggagePrice() + getWifiPrice() + getEntertainmentPrice();

  const getFareSubtotal = () => getBaseFarePrice() + getClassPrice() + getExtrasSubtotal();

  const getTotalPrice = () => getFareSubtotal();

  const getSeatPrice = () => {
    if (!selectedSeat) return 0;
    if (selectedSeatData?.price) return selectedSeatData.price;
    const rowNumber = parseInt(selectedSeatNumber.match(/\d+/)?.[0] || '0');
    const row = seatMap.rows.find(r => r.number === rowNumber);
    return row ? row.price : 0;
  };

  const getBaggagePrice = () => {
    if (selectedBaggage === 'none' || selectedBaggage === null) return 0;
    const baggage = baggageOptions.find(b => b.id === selectedBaggage);
    return baggage ? baggage.price : 0;
  };

  const getWifiPrice = () => {
    if (selectedWifi === 'none' || selectedWifi === null) return 0;
    const wifi = wifiOptions.find(w => w.id === selectedWifi);
    return wifi ? wifi.price : 0;
  };

  const getEntertainmentPrice = () => {
    if (selectedEntertainment === 'none' || selectedEntertainment === null) return 0;
    const entertainment = entertainmentOptions.find(e => e.id === selectedEntertainment);
    return entertainment ? entertainment.price : 0;
  };

  const goToPassengerStep = () => {
    if (!hasValidSeatForReservation) {
      toast.error('Lütfen müsait bir koltuk seçin (koltuk listesi API üzerinden yüklenmeli).');
      return;
    }

    setBookingStep('passenger');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const persistReservationsToBackend = async (): Promise<number> => {
    const flightClassMap: Record<string, string> = {
      economy: 'ECONOMY',
      business: 'BUSINESS',
      first: 'FIRST_CLASS',
    };
    const passengerTypeMap: Record<PassengerType, string> = {
      adult: 'ADULT',
      child: 'CHILD',
      student: 'STUDENT',
    };
    const baggageMap: Record<string, string> = {
      none: 'CABIN_ONLY',
      KG_20: 'KG_20',
      KG_30: 'KG_30',
      KG_40: 'KG_40',
    };
    const wifiMap: Record<string, string> = {
      none: 'NONE',
      BASIC: 'BASIC',
      PREMIUM: 'PREMIUM',
    };
    const entertainmentMap: Record<string, string> = {
      none: 'NONE',
      BASIC: 'BASIC',
      PREMIUM: 'PREMIUM',
    };

    const fid = flightId ? Number(flightId) : 0;
    if (!fid) {
      throw new Error('Geçersiz uçuş');
    }
    if (!hasValidSeatForReservation) {
      throw new Error('Geçersiz koltuk');
    }

    const email = formData.email.trim();
    const phoneNumber = `${phoneCountryCode}${formData.phone}`.replace(/\s/g, '');

    let primaryCheckoutId: number | null = null;

    for (const passenger of passengerInfos) {
      const firstName = passenger.firstName.trim();
      const lastName = passenger.lastName.trim();
      const identityNumber = passenger.identityNumber.trim();
      const passportNumber = (passenger.passportNumber || '').trim() || identityNumber;

      const body = {
        flightId: fid,
        seatId: selectedSeatIdNum,
        userId: 0,
        flightClass: flightClassMap[selectedClass] || 'ECONOMY',
        passengerType: passengerTypeMap[passenger.type] || 'ADULT',
        baggageOption: baggageMap[selectedBaggage] || 'CABIN_ONLY',
        wifiOption: wifiMap[selectedWifi] || 'NONE',
        entertainmentOption: entertainmentMap[selectedEntertainment] || 'NONE',
        firstName,
        lastName,
        identityNumber,
        passportNumber,
        email,
        phoneNumber,
      };

      const response = await flightService.saveReservation(body);
      const saved = response.data ?? response.payload;
      const rid = extractReservationId(saved);
      if (rid !== null && primaryCheckoutId === null) {
        primaryCheckoutId = rid;
      }
    }

    if (!primaryCheckoutId) {
      throw new Error('Sunucu rezervasyon numarası (id) döndürmedi; ödeme için gerekli.');
    }

    return primaryCheckoutId;
  };

  const goToPaymentStep = async () => {
    if (requiresVisa(flight.to) && !visaConfirmed) {
      toast.error('Lütfen vize onayını işaretleyin');
      return;
    }

    const missingPassenger = passengerInfos.find((passenger) =>
      !passenger.firstName || !passenger.lastName || !passenger.identityNumber
    );

    if (missingPassenger) {
      toast.error(`${missingPassenger.typeLabel} yolcu bilgilerini eksiksiz doldurun`);
      return;
    }

    if (!hasValidSeatForReservation) {
      toast.error('Lütfen müsait bir koltuk seçin');
      return;
    }

    const email = formData.email.trim();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Rezervasyon kaydı için geçerli bir e-posta adresi girin');
      return;
    }

    const phoneDigits = onlyDigits(formData.phone);
    if (phoneDigits.length < 10) {
      toast.error('Rezervasyon kaydı için geçerli bir telefon numarası girin (en az 10 hane)');
      return;
    }

    setIsSavingReservation(true);
    try {
      const reservationId = await persistReservationsToBackend();
      setCheckoutReservationId(reservationId);
      setBookingStep('payment');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      toast.success('Rezervasyon kaydedildi', {
        description: 'Ödeme adımına geçebilirsiniz.',
      });
    } catch (error) {
      console.error('Reservation save error:', error);
      const description = error instanceof Error ? error.message : 'Bilgilerinizi kontrol edip tekrar deneyin.';
      toast.error('Rezervasyon kaydedilemedi', { description });
    } finally {
      setIsSavingReservation(false);
    }
  };

  const completeStripeDemoPurchase = async (paymentProvider: string) => {
    const totalPrice = getTotalPrice();
    const primaryPassenger = passengerInfos[0];

    if (!hasValidSeatForReservation) {
      toast.error('Lütfen müsait bir koltuk seçin');
      return;
    }

    try {
      // Rezervasyon zaten "Ödeme Bilgilerine Geç" adımında API'ye kaydedildi; burada yalnızca yerel bilet oluşturulur.
      const ticket = {
        id: Date.now().toString(),
        ...flight,
        price: totalPrice,
        tripType,
        returnFlight,
        passengers: {
          adult: adultPassengers,
          child: childPassengers,
          student: studentPassengers,
        },
        passenger: primaryPassenger ? `${primaryPassenger.firstName} ${primaryPassenger.lastName}` : '',
        passengerDetails: passengerInfos,
        identityType: identityType === 'tc' ? 'TC Kimlik' : 'Pasaport',
        identityNumber: primaryPassenger?.identityNumber || '',
        email: formData.email,
        phone: `${phoneCountryCode} ${formData.phone}`,
        paymentProvider,
        paymentCountry,
        class: classOptions.find(c => c.id === selectedClass)?.label || 'Economy',
        seat: selectedSeatNumber,
        seatId: selectedSeatIdNum,
        baggage: baggageOptions.find(b => b.id === selectedBaggage)?.label || 'Yok',
        entertainment: entertainmentOptions.find(e => e.id === selectedEntertainment)?.label || 'Yok',
        pnr: `SF${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        purchaseDate: new Date().toISOString(),
      };

      const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
      localStorage.setItem('tickets', JSON.stringify([...existingTickets, ticket]));

      toast.success('Biletiniz başarıyla satın alındı!', {
        description: `PNR: ${ticket.pnr} — Koltuk: ${selectedSeatNumber}`,
      });

      setTimeout(() => {
        navigate('/my-tickets');
      }, 2000);
    } catch (error) {
      console.error('Reservation error:', error);
      toast.error('Bilet satın alma sırasında bir hata oluştu');
    }
  };

  const handleStripeCheckout = async () => {
    if (requiresVisa(flight.to) && !visaConfirmed) {
      toast.error('Lütfen vize onayını işaretleyin');
      return;
    }

    if (!hasValidSeatForReservation) {
      toast.error('Lütfen müsait bir koltuk seçin');
      return;
    }

    const missingPassenger = passengerInfos.find((passenger) =>
      !passenger.firstName || !passenger.lastName || !passenger.identityNumber
    );

    if (missingPassenger) {
      toast.error(`${missingPassenger.typeLabel} yolcu bilgilerini eksiksiz doldurun`);
      return;
    }

    if (formData.phone.length > 0 && formData.phone.length < 7) {
      toast.error('Lütfen geçerli bir telefon numarası girin');
      return;
    }

    if (!checkoutReservationId) {
      toast.error('Önce rezervasyonu kaydedin', {
        description: 'Yolcu bilgileri adımında "Ödeme bilgilerine geç" ile kayıt oluşturun.',
      });
      return;
    }

    try {
      const response = await paymentService.checkoutPayment(checkoutReservationId);
      const checkoutPayload = response.data ?? response.payload;

      let sessionUrl: string | undefined;
      if (typeof checkoutPayload === 'string' && checkoutPayload.startsWith('http')) {
        sessionUrl = checkoutPayload;
      } else if (checkoutPayload && typeof checkoutPayload === 'object') {
        const p = checkoutPayload as CheckoutSessionDto & { checkoutUrl?: string; paymentUrl?: string; url?: string };
        sessionUrl = p.sessionUrl || p.checkoutUrl || p.paymentUrl || p.url;
      }

      if (sessionUrl?.startsWith('http')) {
        window.location.href = sessionUrl;
        return;
      }

      toast.error('Ödeme oturumu oluşturulamadı', { description: 'Sunucudan sessionUrl gelmedi.' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Ödeme oturumu başlatılamadı';
      toast.error(message);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name } = e.target;
    let { value } = e.target;

    if (name === 'identityNumber') {
      value = identityType === 'tc'
        ? onlyDigits(value, 11)
        : value.toLocaleUpperCase('tr-TR').replace(/[^A-Z0-9]/g, '').slice(0, 20);
    }

    if (name === 'phone') {
      value = onlyDigits(value, 15);
    }

    if (name === 'cardHolderName') {
      value = value.replace(/[^\p{L}\s]/gu, '').toLocaleUpperCase('tr-TR');
    }

    if (name === 'cardNumber') {
      value = formatCardNumber(value);
    }

    if (name === 'cardExpiry') {
      value = formatCardExpiry(value);
    }

    if (name === 'cardCvv') {
      value = onlyDigits(value, 4);
    }

    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handlePassengerInfoChange = (passengerId: string, field: keyof Pick<PassengerInfo, 'firstName' | 'lastName' | 'identityNumber' | 'passportNumber' | 'gender' | 'email' | 'phoneNumber'>, rawValue: string) => {
    let value = rawValue;

    if (field === 'firstName' || field === 'lastName') {
      value = value.replace(/[^\p{L}\s]/gu, '').toLocaleUpperCase('tr-TR');
    }

    if (field === 'identityNumber') {
      value = identityType === 'tc'
        ? onlyDigits(value, 11)
        : value.toLocaleUpperCase('tr-TR').replace(/[^A-Z0-9]/g, '').slice(0, 20);
    }

    setPassengerInfos((currentPassengers) =>
      currentPassengers.map((passenger) =>
        passenger.id === passengerId ? { ...passenger, [field]: value } : passenger
      )
    );
  };

  const bookingProgress = bookingStep === 'extras' ? 33 : bookingStep === 'passenger' ? 66 : 100;

  if (!flight) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2>Uçuş bulunamadı</h2>
          <Button onClick={() => navigate('/')} className="mt-4">
            Ana Sayfaya Dön
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl">Rezervasyonunuzu Tamamlayın</h2>
          <p className="text-muted-foreground">
            {tripType === 'roundTrip' ? 'Gidiş ve dönüş uçuşlarınız seçildi. Şimdi rezervasyon adımlarını tamamlayın.' : 'Uçuşunuz seçildi. Şimdi rezervasyon adımlarını tamamlayın.'}
          </p>
          <div className="mt-6 grid md:grid-cols-3 gap-3">
            {[
              { id: 'extras', label: '1. Uçuş Tercihleri' },
              { id: 'passenger', label: '2. Yolcu Bilgileri' },
              { id: 'payment', label: '3. Ödeme' },
            ].map((step) => (
              <div
                key={step.id}
                className={`rounded-2xl border px-4 py-3 text-center text-sm ${
                  bookingStep === step.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border bg-card/60 text-muted-foreground'
                }`}
              >
                {step.label}
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-border/50 bg-card/60 p-4">
            <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
              <span>1. Uçuş Seçimi</span>
              <span>2. Yolcu Bilgileri</span>
              <span>3. Ödeme</span>
            </div>
            <Progress value={bookingProgress} className="h-2" />
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-2xl p-6">
              <h3 className="mb-4 flex items-center gap-2 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
                Uçuş Detayları
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border border-border/50">
                  <div className="text-sm text-muted-foreground mb-2">Havayolu</div>
                  <div className="flex items-center gap-3">
                    <AirlineLogo airline={flight.airline} size="md" />
                    <div className="text-lg text-primary">{flight.airline}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Kalkış</div>
                    <div>{flight.from}</div>
                    <div className="text-xl text-primary mt-1">{flight.departTime}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">Varış</div>
                    <div>{flight.to}</div>
                    <div className="text-xl text-accent mt-1">{flight.arriveTime}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                  <div>
                    <div className="text-sm text-muted-foreground">Tarih</div>
                    <div>{flight.date}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Süre</div>
                    <div>{flight.duration}</div>
                  </div>
                </div>

                {returnFlight && (
                  <div className="p-4 bg-gradient-to-r from-accent/5 to-primary/5 rounded-2xl border border-border/50">
                    <div className="text-sm text-muted-foreground mb-3">Dönüş Uçuşu</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Kalkış</div>
                        <div>{returnFlight.from}</div>
                        <div className="text-xl text-primary mt-1">{returnFlight.departTime}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Varış</div>
                        <div>{returnFlight.to}</div>
                        <div className="text-xl text-accent mt-1">{returnFlight.arriveTime}</div>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between p-3 bg-muted/50 rounded-xl">
                      <div>
                        <div className="text-sm text-muted-foreground">Tarih</div>
                        <div>{returnFlight.date}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">Süre</div>
                        <div>{returnFlight.duration}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {bookingStep === 'extras' && (
              <>
            <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-2xl p-6">
              <h3 className="mb-6 flex items-center gap-2 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-primary" />
                </div>
                Uçuş Sınıfı
              </h3>

              <RadioGroup.Root
                value={selectedClass}
                onValueChange={(value) => {
                  setSelectedClass(value);
                  setSelectedSeat(''); // Reset seat when class changes
                }}
                className="space-y-3"
              >
                {classOptions.map((classOption) => (
                  <div key={classOption.id} className="h-[100px]">
                    <RadioGroup.Item
                      value={classOption.id}
                      className="w-full h-full flex flex-col justify-between p-4 rounded-2xl border-2 border-border hover:border-primary transition-colors cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 overflow-hidden"
                    >
                      <div className="flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-4 h-4 flex-shrink-0 rounded-full border-2 border-border flex items-center justify-center data-[state=checked]:border-primary">
                            <RadioGroup.Indicator className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{classOption.label}</div>
                            <div className="text-xs text-muted-foreground truncate">{classOption.description}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          {classOption.surcharge === 0 ? (
                            <span className="text-xs text-primary whitespace-nowrap">Standart</span>
                          ) : (
                            <span className="font-medium whitespace-nowrap">
                              +₺{classOption.surcharge.toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1.5 ml-6">
                        {classOption.features.slice(0, 3).map((feature, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-0.5 bg-muted rounded-lg text-muted-foreground whitespace-nowrap"
                          >
                            {feature}
                          </span>
                        ))}
                      </div>
                    </RadioGroup.Item>
                  </div>
                ))}
              </RadioGroup.Root>
            </div>

            <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-2xl p-6">
              <h3 className="mb-6 flex items-center gap-2 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Armchair className="w-5 h-5 text-primary" />
                </div>
                Koltuk Seçimi ({classOptions.find(c => c.id === selectedClass)?.label})
              </h3>

              {seatLoadError && (
                <div className="mb-6 flex flex-col gap-3 rounded-2xl border-2 border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-destructive">{seatLoadError}</p>
                  <Button type="button" variant="outline" className="shrink-0" onClick={() => fetchSeatsForFlight()}>
                    Tekrar dene
                  </Button>
                </div>
              )}

              <div className="mb-6 flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-muted border-2 border-border"></div>
                  <span className="text-muted-foreground">Boş</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 border-2 border-primary"></div>
                  <span className="text-muted-foreground">Seçili</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-muted-foreground/20 border-2 border-muted-foreground/30"></div>
                  <span className="text-muted-foreground">Dolu</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 border-2 border-accent"></div>
                  <span className="text-muted-foreground">Ekstra Bacak</span>
                </div>
              </div>

              <div className="bg-gradient-to-b from-muted/50 to-transparent p-6 rounded-2xl">
                <div className="flex justify-center mb-4">
                  <div className="px-4 py-2 bg-primary/10 rounded-t-xl text-primary text-sm">
                    Uçağın Önü
                  </div>
                </div>

                <div className="space-y-2 max-w-md mx-auto">
                  {seatMap.rows.map((row) => (
                    <div key={row.number} className="flex items-center gap-2">
                      <div className="w-8 text-center text-sm text-muted-foreground font-medium">
                        {row.number}
                      </div>
                      <div className="flex-1 flex gap-2 justify-center">
                        {seatMap.columns.map((col, idx) => {
                          if (col === '') {
                            return <div key={idx} className="w-8"></div>;
                          }
                          const seatNumber = `${row.number}${col}`;
                          const apiSeat = apiSeatByNumber.get(seatNumber.toUpperCase());
                          const isOccupied = hasSeatResponse ? !apiSeat : true;
                          const seatValue = apiSeat ? String(apiSeat.id) : '';
                          const isSelected = selectedSeat === seatValue;
                          const isExtraLegroom = row.isExtraLegroom;

                          return (
                            <button
                              key={seatNumber}
                              type="button"
                              onClick={() => seatValue && setSelectedSeat(seatValue)}
                              disabled={isLoadingSeats || isOccupied}
                              className={`w-10 h-10 rounded-lg border-2 transition-all text-xs font-medium flex items-center justify-center ${
                                isLoadingSeats || isOccupied
                                  ? 'bg-muted-foreground/20 border-muted-foreground/30 cursor-not-allowed'
                                  : isSelected
                                  ? 'bg-primary/10 border-primary text-primary scale-110'
                                  : isExtraLegroom
                                  ? 'bg-accent/10 border-accent hover:border-accent hover:bg-accent/20'
                                  : 'bg-muted border-border hover:border-primary hover:bg-primary/5'
                              }`}
                            >
                              {col}
                            </button>
                          );
                        })}
                      </div>
                      <div className="w-8"></div>
                    </div>
                  ))}
                </div>

                {selectedSeat && (
                  <div className="mt-6 p-4 bg-primary/10 border-2 border-primary rounded-2xl text-center">
                    <div className="text-sm text-muted-foreground mb-1">Seçilen Koltuk</div>
                    <div className="text-2xl text-primary font-medium">{selectedSeatNumber}</div>
                    {getSeatPrice() > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Ekstra ücret: +₺{getSeatPrice()}
                      </div>
                    )}
                  </div>
                )}
                {!isLoadingSeats && hasSeatResponse && !seatLoadError && selectableApiSeats.length === 0 && (
                  <div className="mt-6 p-4 bg-muted/50 border-2 border-border rounded-2xl text-center text-sm text-muted-foreground">
                    Bu sınıf için uygun koltuk bulunamadı.
                  </div>
                )}
              </div>
            </div>

            <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-2xl p-6">
              <h3 className="mb-6 flex items-center gap-2 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Briefcase className="w-5 h-5 text-primary" />
                </div>
                Bagaj Seçimi
              </h3>

              <RadioGroup.Root value={selectedBaggage} onValueChange={setSelectedBaggage} className="space-y-3">
                {baggageOptions.map((baggage) => (
                  <div key={baggage.id} className="h-[100px]">
                    <RadioGroup.Item
                      value={baggage.id}
                      className="w-full h-full flex flex-col justify-between p-4 rounded-2xl border-2 border-border hover:border-primary transition-colors cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 overflow-hidden"
                    >
                      <div className="flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-4 h-4 flex-shrink-0 rounded-full border-2 border-border flex items-center justify-center data-[state=checked]:border-primary">
                            <RadioGroup.Indicator className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{baggage.label}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          {baggage.price === 0 ? (
                            <span className="text-xs text-primary whitespace-nowrap">Ücretsiz</span>
                          ) : (
                            <span className="font-medium whitespace-nowrap">+₺{baggage.price}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-6 text-xs text-muted-foreground line-clamp-1">
                        {baggage.description}
                      </div>
                    </RadioGroup.Item>
                  </div>
                ))}
              </RadioGroup.Root>
            </div>

            <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-2xl p-6">
              <h3 className="mb-6 flex items-center gap-2 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Headphones className="w-5 h-5 text-primary" />
                </div>
                WiFi Seçimi
              </h3>

              <RadioGroup.Root value={selectedWifi} onValueChange={setSelectedWifi} className="space-y-3">
                {wifiOptions.map((wifi) => (
                  <div key={wifi.id} className="h-[100px]">
                    <RadioGroup.Item
                      value={wifi.id}
                      className="w-full h-full flex flex-col justify-between p-4 rounded-2xl border-2 border-border hover:border-primary transition-colors cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 overflow-hidden"
                    >
                      <div className="flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-4 h-4 flex-shrink-0 rounded-full border-2 border-border flex items-center justify-center data-[state=checked]:border-primary">
                            <RadioGroup.Indicator className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{wifi.label}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          {wifi.price === 0 ? (
                            <span className="text-xs text-primary whitespace-nowrap">Ücretsiz</span>
                          ) : (
                            <span className="font-medium whitespace-nowrap">+₺{wifi.price}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-6 text-xs text-muted-foreground line-clamp-1">
                        {wifi.description}
                      </div>
                    </RadioGroup.Item>
                  </div>
                ))}
              </RadioGroup.Root>
            </div>

            <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-2xl p-6">
              <h3 className="mb-6 flex items-center gap-2 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <Monitor className="w-5 h-5 text-primary" />
                </div>
                Eğlence Paketi
              </h3>

              <RadioGroup.Root value={selectedEntertainment} onValueChange={setSelectedEntertainment} className="space-y-3">
                {entertainmentOptions.map((entertainment) => (
                  <div key={entertainment.id} className="h-[100px]">
                    <RadioGroup.Item
                      value={entertainment.id}
                      className="w-full h-full flex flex-col justify-between p-4 rounded-2xl border-2 border-border hover:border-primary transition-colors cursor-pointer data-[state=checked]:border-primary data-[state=checked]:bg-primary/5 overflow-hidden"
                    >
                      <div className="flex items-center justify-between flex-shrink-0">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <div className="w-4 h-4 flex-shrink-0 rounded-full border-2 border-border flex items-center justify-center data-[state=checked]:border-primary">
                            <RadioGroup.Indicator className="w-2 h-2 rounded-full bg-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium truncate">{entertainment.label}</div>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          {entertainment.price === 0 ? (
                            <span className="text-xs text-primary whitespace-nowrap">Ücretsiz</span>
                          ) : (
                            <span className="font-medium whitespace-nowrap">+₺{entertainment.price}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-6 text-xs text-muted-foreground line-clamp-1">
                        {entertainment.description}
                      </div>
                    </RadioGroup.Item>
                  </div>
                ))}
              </RadioGroup.Root>
            </div>

            <Button
              type="button"
              size="lg"
              onClick={goToPassengerStep}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-xl"
            >
              Yolcu Bilgilerine Geç
            </Button>
              </>
            )}

            {bookingStep !== 'extras' && (
            <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-2xl p-6">
              <h3 className="mb-6 flex items-center gap-2 text-xl">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                Yolcu Bilgileri
              </h3>
              <form onSubmit={(event) => event.preventDefault()} className="space-y-5">
                <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                  <div className="text-sm text-primary">{passengerCount} yolcu için bilgi girilecek</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {adultPassengers} yetişkin
                    {childPassengers > 0 ? `, ${childPassengers} çocuk` : ''}
                    {studentPassengers > 0 ? `, ${studentPassengers} öğrenci` : ''}
                  </div>
                </div>

                <div className="space-y-5">
                  {passengerInfos.map((passenger, index) => (
                    <div key={passenger.id} className="rounded-2xl border border-border/70 bg-background/60 p-5">
                      <div className="mb-4">
                        <div className="font-medium">{index + 1}. Yolcu</div>
                        <div className="text-sm text-muted-foreground">{passenger.typeLabel}</div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-5">
                        <div>
                          <label className="block mb-3 text-sm text-muted-foreground">Ad</label>
                          <Input
                            value={passenger.firstName}
                            onChange={(event) => handlePassengerInfoChange(passenger.id, 'firstName', event.target.value)}
                            required
                            placeholder="Adınız"
                            className="h-12 rounded-2xl border-2"
                          />
                        </div>
                        <div>
                          <label className="block mb-3 text-sm text-muted-foreground">Soyad</label>
                          <Input
                            value={passenger.lastName}
                            onChange={(event) => handlePassengerInfoChange(passenger.id, 'lastName', event.target.value)}
                            required
                            placeholder="Soyadınız"
                            className="h-12 rounded-2xl border-2"
                          />
                        </div>
                      </div>

                      <div className="mt-5">
                        <label className="block mb-3 text-sm text-muted-foreground flex items-center gap-2">
                          <IdCard className="w-4 h-4" />
                          {identityType === 'tc' ? 'TC Kimlik Numarası' : 'Pasaport Numarası'}
                        </label>
                        <Input
                          value={passenger.identityNumber}
                          onChange={(event) => handlePassengerInfoChange(passenger.id, 'identityNumber', event.target.value)}
                          required
                          inputMode={identityType === 'tc' ? 'numeric' : 'text'}
                          placeholder={identityType === 'tc' ? '11 haneli TC kimlik numaranız' : 'Pasaport numaranız'}
                          maxLength={identityType === 'tc' ? 11 : 20}
                          className="h-12 rounded-2xl border-2"
                        />
                      </div>

                      <div className="mt-5 grid md:grid-cols-2 gap-5">
                        <div>
                          <label className="block mb-3 text-sm text-muted-foreground">Pasaport Numarası (Opsiyonel)</label>
                          <Input
                            value={passenger.passportNumber || ''}
                            onChange={(event) => handlePassengerInfoChange(passenger.id, 'passportNumber', event.target.value)}
                            placeholder="Pasaport numaranız"
                            className="h-12 rounded-2xl border-2"
                          />
                        </div>
                        <div>
                          <label className="block mb-3 text-sm text-muted-foreground">Cinsiyet (Opsiyonel)</label>
                          <select
                            value={passenger.gender || ''}
                            onChange={(event) => handlePassengerInfoChange(passenger.id, 'gender', event.target.value)}
                            className="h-12 w-full rounded-2xl border-2 border-border bg-background px-4 text-foreground"
                          >
                            <option value="">Seçiniz</option>
                            <option value="M">Erkek</option>
                            <option value="F">Kadın</option>
                            <option value="O">Diğer</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <p className="text-xs text-muted-foreground">
                  {identityType === 'tc'
                    ? 'Türkiye içi uçuşlarda her yolcu için TC kimlik numarası alınır.'
                    : 'Türkiye dışı uçuşlarda her yolcu için pasaport numarası zorunludur.'}
                </p>

                <div>
                  <label className="block mb-3 text-sm text-muted-foreground flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    E-posta adresi (rezervasyon için zorunlu)
                  </label>
                  <Input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="ornek@email.com"
                    className="h-12 rounded-2xl border-2"
                  />
                </div>

                <div>
                  <label className="block mb-3 text-sm text-muted-foreground flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    Telefon numarası (rezervasyon için zorunlu)
                  </label>
                  <div className="grid grid-cols-[140px_1fr] gap-3">
                    <Select.Root value={phoneCountryCode} onValueChange={setPhoneCountryCode}>
                      <Select.Trigger className="h-12 px-4 rounded-2xl bg-input-background border-2 border-border flex items-center justify-between hover:border-primary transition-colors">
                        <Select.Value />
                        <ChevronDown className="w-4 h-4 text-muted-foreground" />
                      </Select.Trigger>
                      <Select.Portal>
                        <Select.Content className="bg-popover border-2 border-border rounded-2xl shadow-2xl overflow-hidden z-50">
                          <Select.Viewport className="p-2">
                            {phoneCountryOptions.map((option) => (
                              <Select.Item
                                key={option.code}
                                value={option.code}
                                className="px-4 py-3 rounded-xl cursor-pointer hover:bg-primary/10 outline-none flex items-center justify-between transition-colors"
                              >
                                <Select.ItemText>{option.code} {option.country}</Select.ItemText>
                                <Select.ItemIndicator>
                                  <Check className="w-4 h-4 text-primary" />
                                </Select.ItemIndicator>
                              </Select.Item>
                            ))}
                          </Select.Viewport>
                        </Select.Content>
                      </Select.Portal>
                    </Select.Root>
                    <Input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      inputMode="numeric"
                      placeholder="5XX XXX XX XX"
                      className="h-12 rounded-2xl border-2"
                    />
                  </div>
                </div>

                {requiresVisa(flight.to) && (
                  <div className="p-4 bg-destructive/10 border-2 border-destructive/30 rounded-2xl">
                    <div className="flex items-start gap-3 mb-4">
                      <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div>
                        <div className="font-medium text-destructive mb-1">Vize Uyarısı</div>
                        <p className="text-sm text-muted-foreground">
                          {flight.to} destinasyonu için vize gereklidir. Lütfen seyahat etmeden önce geçerli vizenizin olduğundan emin olun.
                        </p>
                      </div>
                    </div>
                    <label className="flex items-start gap-3 cursor-pointer group">
                      <Checkbox.Root
                        checked={visaConfirmed}
                        onCheckedChange={(checked) => setVisaConfirmed(checked === true)}
                        className="w-5 h-5 flex-shrink-0 mt-0.5 rounded-lg border-2 border-destructive bg-background flex items-center justify-center hover:bg-destructive/5 transition-colors data-[state=checked]:bg-destructive data-[state=checked]:border-destructive"
                      >
                        <Checkbox.Indicator>
                          <Check className="w-4 h-4 text-white" />
                        </Checkbox.Indicator>
                      </Checkbox.Root>
                      <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                        {flight.to} için geçerli vizem var ve seyahat etmeye hazırım.
                      </span>
                    </label>
                  </div>
                )}

                {bookingStep === 'passenger' && (
                  <Button
                    type="button"
                    size="lg"
                    disabled={isSavingReservation}
                    onClick={() => void goToPaymentStep()}
                    className="w-full mt-8 h-14 bg-gradient-to-r from-primary to-accent hover:shadow-xl"
                  >
                    {isSavingReservation ? 'Rezervasyon kaydediliyor...' : 'Ödeme Bilgilerine Geç'}
                  </Button>
                )}

                {bookingStep === 'payment' && (
                  <>
                <div className="relative my-8">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-border"></div>
                  </div>
                  <div className="relative flex justify-center">
                    <div className="bg-card px-4 text-sm text-muted-foreground">Ödeme Bilgileri</div>
                  </div>
                </div>

                <h3 className="mb-6 flex items-center gap-2 text-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  Ödeme Yöntemi
                </h3>

                <RadioGroup.Root value={paymentMethod} className="grid gap-4">
                  <RadioGroup.Item
                    value="stripe"
                    className="text-left p-5 rounded-2xl border-2 border-border hover:border-primary transition-colors data-[state=checked]:border-primary data-[state=checked]:bg-primary/5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 mt-0.5 rounded-full border-2 border-border flex items-center justify-center">
                        <RadioGroup.Indicator className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <ShieldCheck className="w-4 h-4 text-primary" />
                          Stripe Checkout
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Kart bilgilerinizi Stripe'ın güvenli ödeme sayfasında girin.
                        </div>
                      </div>
                    </div>
                  </RadioGroup.Item>

                  <RadioGroup.Item
                    value="card"
                    className="hidden"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-5 h-5 mt-0.5 rounded-full border-2 border-border flex items-center justify-center">
                        <RadioGroup.Indicator className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 font-medium">
                          <CreditCard className="w-4 h-4 text-primary" />
                          Kart ile Öde
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          Sunum/demo için kart formunu bu ekranda doldurun.
                        </div>
                      </div>
                    </div>
                  </RadioGroup.Item>
                </RadioGroup.Root>

                {paymentMethod === 'stripe' && (
                  <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5 p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Stripe Checkout</div>
                        <div className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          ₺{getTotalPrice().toLocaleString('tr-TR')}
                        </div>
                      </div>
                      <div className="flex gap-1 text-[11px] text-muted-foreground">
                        <span className="rounded bg-background px-2 py-1">VISA</span>
                        <span className="rounded bg-background px-2 py-1">MC</span>
                        <span className="rounded bg-background px-2 py-1">AMEX</span>
                      </div>
                    </div>
                    {renderPaymentCountrySelect()}
                    <Button
                      type="button"
                      size="lg"
                      onClick={handleStripeCheckout}
                      className="w-full h-14 bg-gradient-to-r from-primary to-accent hover:shadow-xl"
                    >
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      Stripe Checkout ile Öde
                      <ExternalLink className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                )}

                {paymentMethod === 'card' && (
                  <>

                <h3 className="mb-6 flex items-center gap-2 text-xl">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                  Kart Bilgileri
                </h3>

                <div>
                  <label className="block mb-3 text-sm text-muted-foreground">Kart Sahibinin Adı Soyadı</label>
                  <Input
                    name="cardHolderName"
                    value={formData.cardHolderName}
                    onChange={handleChange}
                    required
                    placeholder="AD SOYAD"
                    autoComplete="cc-name"
                    className="h-12 rounded-2xl border-2"
                  />
                </div>

                <div>
                  <label className="block mb-3 text-sm text-muted-foreground">Kart Numarası</label>
                  <Input
                    name="cardNumber"
                    value={formData.cardNumber}
                    onChange={handleChange}
                    required
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    maxLength={19}
                    className="h-12 rounded-2xl border-2"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div>
                    <label className="block mb-3 text-sm text-muted-foreground">Son Kullanma Tarihi</label>
                    <Input
                      name="cardExpiry"
                      value={formData.cardExpiry}
                      onChange={handleChange}
                      required
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="AA/YY"
                      maxLength={5}
                      className="h-12 rounded-2xl border-2"
                    />
                  </div>
                  <div>
                    <label className="block mb-3 text-sm text-muted-foreground">CVV</label>
                    <Input
                      name="cardCvv"
                      value={formData.cardCvv}
                      onChange={handleChange}
                      required
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      maxLength={4}
                      className="h-12 rounded-2xl border-2"
                    />
                  </div>
                </div>

                {renderPaymentCountrySelect()}

                <Button type="submit" size="lg" className="w-full mt-8 h-14 bg-gradient-to-r from-primary to-accent hover:shadow-xl">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Güvenli Ödeme Yap
                </Button>
                  </>
                )}
                  </>
                )}
              </form>
            </div>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="backdrop-blur-xl bg-gradient-to-br from-card/70 to-primary/5 border border-border/50 rounded-2xl p-6 sticky top-24">
              <div className="mb-6 rounded-2xl border border-primary/20 bg-background/70 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm text-primary">
                  <Plane className="h-4 w-4" />
                  Seçilen uçuş
                </div>
                <div className="text-lg">
                  {flight.from} → {flight.to}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Tarih</div>
                    <div>{flight.date}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Saat</div>
                    <div>{flight.departTime} - {flight.arriveTime}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Süre</div>
                    <div>{flight.duration}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Havayolu</div>
                    <div>{flight.airline}</div>
                  </div>
                </div>
                {returnFlight && (
                  <div className="mt-4 border-t border-border/50 pt-4 text-sm">
                    <div className="mb-1 text-primary">Dönüş uçuşu</div>
                    <div>{returnFlight.from} → {returnFlight.to}</div>
                    <div className="text-muted-foreground">
                      {returnFlight.date}, {returnFlight.departTime} - {returnFlight.arriveTime}
                    </div>
                  </div>
                )}
              </div>

              <h3 className="mb-6 text-xl">Fiyat Özeti</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yolcu</span>
                  <span>{passengerCount} kişi</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {adultPassengers} yetişkin
                  {childPassengers > 0 ? `, ${childPassengers} çocuk (%65)` : ''}
                  {studentPassengers > 0 ? `, ${studentPassengers} öğrenci (%85)` : ''}
                </div>
                {passengerTypeTotals.map((item) => (
                  <div key={item.key} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.count} {item.label} x %{Math.round(item.multiplier * 100)}
                    </span>
                    <span>₺{getPassengerTypeFare(item.count, item.multiplier).toLocaleString('tr-TR')}</span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Bilet Fiyatı (Economy)</span>
                  <span>₺{getBaseFarePrice().toLocaleString('tr-TR')}</span>
                </div>
                {getClassPrice() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      {classOptions.find(c => c.id === selectedClass)?.label} Farkı
                    </span>
                    <span>₺{getClassPrice().toLocaleString('tr-TR')}</span>
                  </div>
                )}
                {getSeatPrice() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Koltuk Seçimi</span>
                    <span>₺{getSeatPrice().toLocaleString('tr-TR')}</span>
                  </div>
                )}
                {getBaggagePrice() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bagaj</span>
                    <span>₺{getBaggagePrice().toLocaleString('tr-TR')}</span>
                  </div>
                )}
                {getWifiPrice() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">WiFi</span>
                    <span>₺{getWifiPrice().toLocaleString('tr-TR')}</span>
                  </div>
                )}
                {getEntertainmentPrice() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eğlence Paketi</span>
                    <span>₺{getEntertainmentPrice().toLocaleString('tr-TR')}</span>
                  </div>
                )}
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-4"></div>
                <div className="flex justify-between items-center">
                  <span className="text-lg">Toplam</span>
                  <span className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    ₺{getTotalPrice().toLocaleString('tr-TR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
