import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Progress } from '../components/ui/progress';
import * as RadioGroup from '@radix-ui/react-radio-group';
import * as Select from '@radix-ui/react-select';
import * as Checkbox from '@radix-ui/react-checkbox';
import { Plane, CreditCard, User, Mail, Phone, CheckCircle, Armchair, Briefcase, Star, ChevronDown, Check, IdCard, Monitor, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { AirlineLogo } from '../utils/airlineLogos';
import { FlightDto, flightService } from '../services/flightService';
import { paymentService } from '../services/paymentService';

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
}

const extractCity = (location: string) => location.split(' (')[0];

const isTurkeyLocation = (location: string) => {
  const normalizedLocation = extractCity(location).toLocaleLowerCase('tr-TR');
  return turkeyCities.some((city) => normalizedLocation.includes(city.toLocaleLowerCase('tr-TR')));
};

const isTurkeyDomesticFlight = (from: string, to: string) => {
  return isTurkeyLocation(from) && isTurkeyLocation(to);
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

const mapBackendFlight = (flight: FlightDto) => ({
  airline: flight.airline,
  from: flight.departure,
  to: flight.arrival,
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

  const [selectedClass, setSelectedClass] = useState('economy');
  const [selectedSeat, setSelectedSeat] = useState('');
  const [selectedBaggage, setSelectedBaggage] = useState('none');
  const [selectedEntertainment, setSelectedEntertainment] = useState('none');
  const [visaConfirmed, setVisaConfirmed] = useState(false);
  const [phoneCountryCode, setPhoneCountryCode] = useState('+90');
  const [bookingStep, setBookingStep] = useState<'extras' | 'passenger' | 'payment'>('extras');
  const [paymentMethod] = useState<'stripe' | 'card'>('stripe');
  const [paymentCountry, setPaymentCountry] = useState('Türkiye');

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

  const classOptions = [
    {
      id: 'economy',
      label: 'Economy Class',
      priceMultiplier: 1,
      description: 'Standart konfor',
      features: ['Standart koltuk', 'İkram servisi', '20kg bagaj hakkı']
    },
    {
      id: 'business',
      label: 'Business Class',
      priceMultiplier: 2.5,
      description: 'Premium deneyim',
      features: ['Geniş koltuk', 'Özel menü', '30kg bagaj hakkı', 'Lounge erişimi']
    },
    {
      id: 'first',
      label: 'First Class',
      priceMultiplier: 4,
      description: 'Lüks seyahat',
      features: ['Yatay koltuk', 'Şef menüsü', '40kg bagaj hakkı', 'VIP lounge', 'Limuzin servisi']
    },
  ];

  const getSeatMapByClass = () => {
    if (selectedClass === 'economy') {
      return {
        rows: [
          { number: 8, isExtraLegroom: true, price: 150 },
          { number: 9, isExtraLegroom: true, price: 150 },
          { number: 10, isExtraLegroom: true, price: 150 },
          { number: 15, isExtraLegroom: false, price: 0 },
          { number: 16, isExtraLegroom: false, price: 0 },
          { number: 17, isExtraLegroom: false, price: 0 },
          { number: 20, isExtraLegroom: false, price: 0 },
          { number: 21, isExtraLegroom: false, price: 0 },
          { number: 22, isExtraLegroom: false, price: 0 },
          { number: 25, isExtraLegroom: false, price: 0 },
          { number: 26, isExtraLegroom: false, price: 0 },
          { number: 27, isExtraLegroom: false, price: 0 },
        ],
        columns: ['A', 'B', 'C', '', 'D', 'E', 'F'],
        occupiedSeats: ['15B', '16A', '17D', '20C', '21E', '25A', '26F'],
      };
    } else if (selectedClass === 'business') {
      return {
        rows: [
          { number: 3, isExtraLegroom: false, price: 0 },
          { number: 4, isExtraLegroom: false, price: 0 },
          { number: 5, isExtraLegroom: false, price: 0 },
          { number: 6, isExtraLegroom: false, price: 0 },
          { number: 7, isExtraLegroom: false, price: 0 },
          { number: 8, isExtraLegroom: false, price: 0 },
          { number: 9, isExtraLegroom: false, price: 0 },
          { number: 10, isExtraLegroom: false, price: 0 },
          { number: 11, isExtraLegroom: false, price: 0 },
          { number: 12, isExtraLegroom: false, price: 0 },
        ],
        columns: ['A', 'C', '', 'D', 'F'],
        occupiedSeats: ['3A', '4D', '5C', '7F', '9A', '10D'],
      };
    } else {
      return {
        rows: [
          { number: 1, isExtraLegroom: false, price: 0 },
          { number: 2, isExtraLegroom: false, price: 0 },
          { number: 3, isExtraLegroom: false, price: 0 },
          { number: 4, isExtraLegroom: false, price: 0 },
          { number: 5, isExtraLegroom: false, price: 0 },
        ],
        columns: ['A', 'C', '', 'D', 'F'],
        occupiedSeats: ['1A', '2F', '4C'],
      };
    }
  };

  const seatMap = getSeatMapByClass();

  const baggageOptions = [
    { id: 'none', label: 'Sadece El Bagajı (8kg)', price: 0, description: 'Ücretsiz' },
    { id: '20kg', label: '20 kg Bagaj', price: 250, description: 'Standart bagaj hakkı' },
    { id: '30kg', label: '30 kg Bagaj', price: 450, description: 'Ekstra bagaj hakkı' },
    { id: '40kg', label: '40 kg Bagaj', price: 650, description: 'Maksimum bagaj hakkı' },
  ];

  const entertainmentOptions = [
    { id: 'none', label: 'Eğlence Paketi İstemiyorum', price: 0, description: 'Ücretsiz' },
    { id: 'basic', label: 'Temel Eğlence + WiFi', price: 180, description: 'Film, müzik ve mesajlaşma WiFi paketi' },
    { id: 'premium', label: 'Premium Eğlence + Hızlı WiFi', price: 320, description: 'Tüm içerikler, oyunlar ve hızlı internet' },
  ];

  const getClassPrice = () => {
    const classOption = classOptions.find(c => c.id === selectedClass);
    return classOption ? Math.round(itineraryBasePrice * passengerFareMultiplier * (classOption.priceMultiplier - 1)) : 0;
  };

  const getBaseFarePrice = () => Math.round(itineraryBasePrice * passengerFareMultiplier);

  const getPassengerTypeFare = (count: number, multiplier: number) => Math.round(itineraryBasePrice * count * multiplier);

  const getExtrasSubtotal = () => getSeatPrice() + getBaggagePrice() + getEntertainmentPrice();

  const getFareSubtotal = () => getBaseFarePrice() + getClassPrice() + getExtrasSubtotal();

  const getTaxPrice = () => Math.round(getFareSubtotal() * 0.18);

  const getTotalPrice = () => getFareSubtotal() + 150 + getTaxPrice();

  const getSeatPrice = () => {
    if (!selectedSeat) return 0;
    const rowNumber = parseInt(selectedSeat.match(/\d+/)?.[0] || '0');
    const row = seatMap.rows.find(r => r.number === rowNumber);
    return row ? row.price : 0;
  };

  const getBaggagePrice = () => {
    const baggage = baggageOptions.find(b => b.id === selectedBaggage);
    return baggage ? baggage.price : 0;
  };

  const getEntertainmentPrice = () => {
    const entertainment = entertainmentOptions.find(e => e.id === selectedEntertainment);
    return entertainment ? entertainment.price : 0;
  };

  const goToPassengerStep = () => {
    if (!selectedSeat) {
      toast.error('Lütfen bir koltuk seçin');
      return;
    }

    setBookingStep('passenger');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToPaymentStep = () => {
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

    if (!formData.email || !formData.phone) {
      toast.error('Lütfen iletişim bilgilerini eksiksiz doldurun');
      return;
    }

    setBookingStep('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const completeStripeDemoPurchase = (paymentProvider: string) => {
    const totalPrice = getTotalPrice();
    const primaryPassenger = passengerInfos[0];

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
      seat: selectedSeat,
      baggage: baggageOptions.find(b => b.id === selectedBaggage)?.label || 'Yok',
      entertainment: entertainmentOptions.find(e => e.id === selectedEntertainment)?.label || 'Yok',
      pnr: `SF${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      purchaseDate: new Date().toISOString(),
    };

    const existingTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    localStorage.setItem('tickets', JSON.stringify([...existingTickets, ticket]));

    toast.success('Biletiniz başarıyla satın alındı!', {
      description: `PNR: ${ticket.pnr} - Koltuk: ${selectedSeat}`,
    });

    setTimeout(() => {
      navigate('/my-tickets');
    }, 2000);
  };

  const handleStripeCheckout = async () => {
    if (requiresVisa(flight.to) && !visaConfirmed) {
      toast.error('Lütfen vize onayını işaretleyin');
      return;
    }

    if (!selectedSeat) {
      toast.error('Lütfen bir koltuk seçin');
      return;
    }

    const missingPassenger = passengerInfos.find((passenger) =>
      !passenger.firstName || !passenger.lastName || !passenger.identityNumber
    );

    if (missingPassenger) {
      toast.error(`${missingPassenger.typeLabel} yolcu bilgilerini eksiksiz doldurun`);
      return;
    }

    if (formData.phone.length < 7) {
      toast.error('Lütfen geçerli bir telefon numarası girin');
      return;
    }

    try {
      const reservationId = Number(flightId) || Date.now();
      const response = await paymentService.checkoutPayment(reservationId);
      const checkoutPayload = response.data || response.payload;
      const checkoutUrl = typeof checkoutPayload === 'string'
        ? checkoutPayload
        : checkoutPayload?.checkoutUrl || checkoutPayload?.paymentUrl || checkoutPayload?.sessionUrl || checkoutPayload?.url;

      if (typeof checkoutUrl === 'string' && checkoutUrl.startsWith('http')) {
        window.location.href = checkoutUrl;
        return;
      }

      completeStripeDemoPurchase('Stripe Checkout');
    } catch {
      toast.info('Stripe demo modu kullanılıyor. Backend bağlandığında gerçek checkout sayfasına yönlenecek.');
      completeStripeDemoPurchase('Stripe Checkout Demo');
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

  const handlePassengerInfoChange = (passengerId: string, field: keyof Pick<PassengerInfo, 'firstName' | 'lastName' | 'identityNumber'>, rawValue: string) => {
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
                          {classOption.priceMultiplier === 1 ? (
                            <span className="text-xs text-primary whitespace-nowrap">Standart</span>
                          ) : (
                            <span className="font-medium whitespace-nowrap">
                              +₺{Math.round(itineraryBasePrice * passengerFareMultiplier * (classOption.priceMultiplier - 1)).toLocaleString('tr-TR')}
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
                          const seatId = `${row.number}${col}`;
                          const isOccupied = seatMap.occupiedSeats.includes(seatId);
                          const isSelected = selectedSeat === seatId;
                          const isExtraLegroom = row.isExtraLegroom;

                          return (
                            <button
                              key={seatId}
                              type="button"
                              onClick={() => !isOccupied && setSelectedSeat(seatId)}
                              disabled={isOccupied}
                              className={`w-10 h-10 rounded-lg border-2 transition-all text-xs font-medium flex items-center justify-center ${
                                isOccupied
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
                    <div className="text-2xl text-primary font-medium">{selectedSeat}</div>
                    {getSeatPrice() > 0 && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Ekstra ücret: +₺{getSeatPrice()}
                      </div>
                    )}
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
                      <div className="mb-4 flex items-center justify-between gap-3">
                        <div>
                          <div className="font-medium">{index + 1}. Yolcu</div>
                          <div className="text-sm text-muted-foreground">{passenger.typeLabel}</div>
                        </div>
                        <div className="rounded-full bg-primary/10 px-3 py-1 text-sm text-primary">
                          %{Math.round(passenger.fareMultiplier * 100)} ücret
                        </div>
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
                    E-posta Adresi
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
                    Telefon Numarası
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
                      required
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
                    onClick={goToPaymentStep}
                    className="w-full mt-8 h-14 bg-gradient-to-r from-primary to-accent hover:shadow-xl"
                  >
                    Ödeme Bilgilerine Geç
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
                {getEntertainmentPrice() > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Eğlence Paketi</span>
                    <span>₺{getEntertainmentPrice().toLocaleString('tr-TR')}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hizmet Bedeli</span>
                  <span>₺150</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vergiler</span>
                  <span>₺{getTaxPrice().toLocaleString('tr-TR')}</span>
                </div>
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
