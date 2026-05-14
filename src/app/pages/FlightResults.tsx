import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Plane, Clock, ArrowRight, Zap, Star, Loader2 } from 'lucide-react';
import { AirlineLogo } from '../utils/airlineLogos';
import { FlightDto, flightService } from '../services/flightService';
import IntroAnimation from '../components/IntroAnimation';

const generateMockFlights = (from: string, to: string, date = '2026-05-15') => {
  const baseFlights = [
    {
      id: '1',
      airline: 'Turkish Airlines',
      departTime: '10:30',
      arriveTime: '14:45',
      duration: '4s 15dk',
      priceMultiplier: 1.0,
      seats: 12,
      recommended: true,
    },
    {
      id: '2',
      airline: 'Pegasus Airlines',
      departTime: '14:00',
      arriveTime: '18:20',
      duration: '4s 20dk',
      priceMultiplier: 0.8,
      seats: 8,
      recommended: false,
    },
    {
      id: '3',
      airline: 'Turkish Airlines',
      departTime: '18:45',
      arriveTime: '23:10',
      duration: '4s 25dk',
      priceMultiplier: 0.9,
      seats: 20,
      recommended: false,
    },
    {
      id: '4',
      airline: 'SunExpress',
      departTime: '07:15',
      arriveTime: '11:35',
      duration: '4s 20dk',
      priceMultiplier: 0.7,
      seats: 5,
      recommended: false,
    },
  ];

  const basePrices: Record<string, number> = {
    // Türkiye
    'İstanbul': 1800,
    'Ankara': 800,
    'İzmir': 750,
    'Antalya': 900,

    // Avrupa
    'Paris': 2450,
    'Londra': 3200,
    'Barcelona': 2100,
    'Roma': 2800,
    'Berlin': 2300,

    // ABD
    'New York': 5800,
    'Los Angeles': 6200,
    'Miami': 5400,

    // Orta Doğu
    'Gazze': 1500,
    'Şam': 1400,
    'Halep': 1450,
    'Beyrut': 1300,
    'Amman': 1200,
    'Kahire': 1600,
    'Dubai': 2200,
    'Cidde': 1800,
    'Doha': 2100,

    // Asya
    'Pekin': 4500,
    'Şangay': 4800,
    'Hong Kong': 5200,
    'Tokyo': 5500,
    'Seul': 4900,
    'Bangkok': 3800,
    'Singapur': 4200,
    'Kuala Lumpur': 3900,
    'Delhi': 3500,
    'Mumbai': 3600,

    // Afrika
    'Cape Town': 5000,
    'Nairobi': 3200,
    'Kazablanka': 2400,

    'default': 2500,
  };

  // Extract city name from "City (CODE)" format
  const extractCity = (location: string) => location.split(' (')[0];
  const toCity = extractCity(to);
  const basePrice = basePrices[toCity] || basePrices['default'];

  return baseFlights.map(flight => ({
    ...flight,
    from,
    to,
    date,
    price: Math.round(basePrice * flight.priceMultiplier),
  }));
};

const extractCity = (location: string) => location.split(' (')[0];

const getLocationDisplay = (location: string | { city: string; airport: string } | unknown): string => {
  if (typeof location === 'string') {
    return location;
  }
  if (location && typeof location === 'object' && 'city' in location) {
    const loc = location as { city: string; airport?: string };
    return loc.city;
  }
  return '';
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

const mapBackendFlight = (flight: FlightDto, index: number) => ({
  id: String(flight.id),
  airline: flight.airline,
  from: getLocationDisplay(flight.departure),
  to: getLocationDisplay(flight.arrival),
  departTime: formatTime(flight.departureTime),
  arriveTime: formatTime(flight.arrivalTime),
  duration: calculateDuration(flight.departureTime, flight.arrivalTime),
  date: formatDate(flight.departureTime),
  price: flight.price,
  seats: flight.availableSeats,
  recommended: index === 0,
  flightNo: flight.flightNo,
  status: flight.status,
});

type DisplayFlight = ReturnType<typeof mapBackendFlight> | ReturnType<typeof generateMockFlights>[number];

const toStoredFlight = (flight: DisplayFlight): FlightDto => ({
  id: Number(flight.id),
  flightNo: 'flightNo' in flight && flight.flightNo ? flight.flightNo : `SF${String(flight.id).padStart(3, '0')}`,
  airline: flight.airline,
  departure: flight.from,
  arrival: flight.to,
  departureTime: `${flight.date}T${flight.departTime}:00`,
  arrivalTime: `${flight.date}T${flight.arriveTime}:00`,
  price: flight.price,
  availableSeats: flight.seats,
  status: 'status' in flight && flight.status ? flight.status : 'SCHEDULED',
});

export default function FlightResults() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const from = searchParams.get('from') || '';
  const fromAirport = searchParams.get('fromAirport') || '';
  const to = searchParams.get('to') || '';
  const toAirport = searchParams.get('toAirport') || '';
  const tripType = searchParams.get('tripType') || 'oneWay';
  const departDate = searchParams.get('departDate') || '';
  const returnDate = searchParams.get('returnDate') || '';
  const outboundFlightId = searchParams.get('outboundFlightId') || '';
  const isReturnSelection = tripType === 'roundTrip' && !!outboundFlightId;
  const activeFrom = isReturnSelection ? to : from;
  const activeFromAirport = isReturnSelection ? toAirport : fromAirport;
  const activeTo = isReturnSelection ? from : to;
  const activeToAirport = isReturnSelection ? fromAirport : toAirport;
  const activeDate = isReturnSelection ? returnDate : departDate;
  const adultPassengers = Number(searchParams.get('adultPassengers') || searchParams.get('passengers') || '1');
  const childPassengers = Number(searchParams.get('childPassengers') || '0');
  const studentPassengers = Number(searchParams.get('studentPassengers') || '0');
  const passengers = adultPassengers + childPassengers + studentPassengers;
  const passengerFareMultiplier = adultPassengers + childPassengers * 0.65 + studentPassengers * 0.85;
  const passengerQuery = new URLSearchParams({
    adultPassengers: adultPassengers.toString(),
    childPassengers: childPassengers.toString(),
    studentPassengers: studentPassengers.toString(),
    from,
    fromAirport,
    to,
    toAirport,
    tripType,
    departDate,
    returnDate,
  }).toString();
  const [backendFlights, setBackendFlights] = useState<ReturnType<typeof mapBackendFlight>[] | null>(null);
  const [isLoadingFlights, setIsLoadingFlights] = useState(false);
  const [isSelectionAnimating, setIsSelectionAnimating] = useState(false);
  const [expandedFlightId, setExpandedFlightId] = useState<string | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<Record<string, string>>({});

  // Format display: if "City (ALL)", show just "City - Tüm Havaalanları"
  const formatLocation = (location: string) => {
    if (location.includes('(ALL)')) {
      return location.replace(' (ALL)', ' - Tüm Havaalanları');
    }
    return location;
  };

  useEffect(() => {
    if (!activeFrom || !activeTo || !activeDate) return;

    setBackendFlights(null);
    setIsLoadingFlights(true);
    flightService.searchFlights({
      departure: extractCity(activeFrom),
      departureAirport: activeFromAirport,
      arrival: extractCity(activeTo),
      arrivalAirport: activeToAirport,
      departureDate: activeDate,
    })
      .then((response) => {
        const flights = response.data || response.payload;
        const validFlights = Array.isArray(flights) 
          ? flights
              .filter(flight => flight.status !== 'CANCELLED')
              .map(mapBackendFlight)
          : [];
        setBackendFlights(validFlights.length > 0 ? validFlights : null);
      })
      .catch(() => setBackendFlights(null))
      .finally(() => setIsLoadingFlights(false));
  }, [activeFrom, activeFromAirport, activeTo, activeToAirport, activeDate]);

  const filteredFlights = (backendFlights && backendFlights.length > 0) ? backendFlights : [];

  const handleSelectFlight = (flight: DisplayFlight) => {
    // Toggle expand/collapse
    setExpandedFlightId(expandedFlightId === flight.id ? null : flight.id);
  };

  const handleConfirmFlight = (flight: DisplayFlight) => {
    const selectedClass = selectedClasses[flight.id] || 'economy';
    const flightId = flight.id;
    const params = new URLSearchParams(passengerQuery);
    params.set('flightClass', selectedClass);
    setIsSelectionAnimating(true);

    if (tripType === 'roundTrip' && !isReturnSelection) {
      params.set('outboundFlightId', flightId);
      window.setTimeout(() => {
        navigate(`/flights?${params.toString()}`);
      }, 2200);
      return;
    }

    if (tripType === 'roundTrip') {
      params.set('outboundFlightId', outboundFlightId);
      params.set('returnFlightId', flightId);
      window.setTimeout(() => {
        navigate(`/booking/${outboundFlightId}?${params.toString()}`);
      }, 2200);
      return;
    }

    localStorage.setItem('selectedChatFlight', JSON.stringify(toStoredFlight(flight)));
    window.setTimeout(() => {
      navigate(`/booking/${flightId}?${params.toString()}`);
    }, 2200);
  };

  return (
    <Layout>
      {isSelectionAnimating && <IntroAnimation message="Biletiniz hazırlanıyor" />}
      <div className="max-w-6xl mx-auto">
        <div className="backdrop-blur-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-border/50 rounded-2xl p-6 mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Plane className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">
                    {isReturnSelection ? 'Dönüş Güzergahı' : 'Gidiş Güzergahı'}
                  </div>
                  <div className="text-xl">{formatLocation(activeFrom)} → {formatLocation(activeTo)}</div>
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tarih</div>
                <div>{activeDate}</div>
              </div>
              {tripType === 'roundTrip' && outboundFlightId && (
                <div>
                  <div className="text-sm text-muted-foreground">Gidiş Seçimi</div>
                  <div>Uçuş #{outboundFlightId} seçildi</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Yolcu</div>
                <div>
                  {passengers} Kişi
                  <span className="text-sm text-muted-foreground">
                    {' '}({adultPassengers} yetişkin
                    {childPassengers > 0 ? `, ${childPassengers} çocuk` : ''}
                    {studentPassengers > 0 ? `, ${studentPassengers} öğrenci` : ''})
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="rounded-xl"
            >
              Aramayı Değiştir
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl">
            {isReturnSelection ? 'Dönüş Uçuşu Seçin' : 'Gidiş Uçuşu Seçin'} ({filteredFlights.length} uçuş)
          </h2>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-accent" />
            En ucuz fiyatlar
          </div>
        </div>

        {isLoadingFlights && (
          <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-6 text-center">
            <Loader2 className="mx-auto mb-3 h-8 w-8 animate-spin text-primary" />
            <div className="text-lg">Uçuşlar listeleniyor...</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {formatLocation(activeFrom)} - {formatLocation(activeTo)} için uygun seferler kontrol ediliyor.
            </div>
          </div>
        )}

        {!isLoadingFlights && filteredFlights.length === 0 && (
          <div className="mb-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-6 text-center">
            <Plane className="mx-auto mb-3 h-8 w-8 text-destructive opacity-50" />
            <div className="text-lg">Sonuç bulunamadı</div>
            <div className="mt-1 text-sm text-muted-foreground">
              {formatLocation(activeFrom)} - {formatLocation(activeTo)} rotu için {activeDate} tarihinde uygun uçuş bulunmamaktadır.
            </div>
            <Button
              variant="outline"
              onClick={() => navigate('/')}
              className="rounded-xl mt-4"
            >
              Aramayı Değiştir
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {!isLoadingFlights && filteredFlights.map((flight) => (
            <div key={flight.id} className="space-y-2">
              <div
                onClick={() => handleSelectFlight(flight)}
                className="group relative overflow-hidden backdrop-blur-xl bg-card/70 border border-border/50 rounded-2xl hover:shadow-2xl hover:border-primary/50 transition-all duration-300 cursor-pointer"
              >
                {flight.recommended && (
                  <div className="absolute top-0 right-0">
                    <div className="bg-gradient-to-r from-accent to-primary text-white px-4 py-1 rounded-bl-2xl flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4" />
                      Önerilen
                    </div>
                  </div>
                )}

                <div className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                    <div className="flex-1">
                      <div className="mb-4 flex items-center gap-3">
                        <AirlineLogo airline={flight.airline} size="md" />
                        <span className="px-3 py-1 bg-primary/10 text-primary rounded-lg text-sm inline-block">
                          {flight.airline}
                        </span>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-center">
                        <div className="text-3xl mb-1">{flight.departTime}</div>
                        <div className="text-sm text-muted-foreground">{formatLocation(flight.from)}</div>
                      </div>

                      <div className="flex-1 flex flex-col items-center px-4">
                        <div className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {flight.duration}
                        </div>
                        <div className="w-full relative flex items-center">
                          <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full w-full"></div>
                          <Plane className="absolute left-1/2 -translate-x-1/2 w-5 h-5 text-primary rotate-90 bg-background" />
                        </div>
                        <div className="text-xs text-muted-foreground mt-2 px-2 py-0.5 bg-muted rounded">
                          Direkt Uçuş
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-3xl mb-1">{flight.arriveTime}</div>
                        <div className="text-sm text-muted-foreground">{formatLocation(flight.to)}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-3">
                      <div className={`text-sm px-3 py-1 rounded-lg ${
                        flight.seats < 10
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {flight.seats} koltuk kaldı
                      </div>
                    </div>
                  </div>

                  <div className="lg:border-l lg:border-border/50 lg:pl-6 flex flex-col items-center lg:items-end gap-4">
                    <div className="text-center lg:text-right w-full">
                      <div className="text-sm text-muted-foreground mb-1">Kişi başı</div>
                      <div className="text-4xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-1">
                        ₺{flight.price.toLocaleString('tr-TR')}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Toplam ₺{Math.round(flight.price * passengerFareMultiplier).toLocaleString('tr-TR')}
                      </div>
                    </div>

                    <Button
                      disabled={isSelectionAnimating}
                      className="w-full lg:w-auto px-8 rounded-xl bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                    >
                      {tripType === 'roundTrip' && !isReturnSelection ? 'Gidişi Seç' : 'Seç'}
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedFlightId === flight.id && (
              <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-2xl p-6 space-y-4 animate-in fade-in duration-200">
                <h3 className="font-semibold text-lg mb-4">Uçuş Sınıfı Seçin</h3>
                
                <div className="space-y-3">
                  {[
                    { id: 'economy', label: 'Economy Class', surcharge: 0, desc: 'Standart konfor' },
                    { id: 'business', label: 'Business Class', surcharge: 2625, desc: 'Premium deneyim' },
                    { id: 'first', label: 'First Class', surcharge: 5250, desc: 'Lüks seyahat' }
                  ].map((classOption) => (
                    <div
                      key={classOption.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedClasses(prev => ({ ...prev, [flight.id]: classOption.id }));
                      }}
                      className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        selectedClasses[flight.id] === classOption.id
                          ? 'border-primary bg-primary/5'
                          : 'border-border/30 hover:border-border/60'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{classOption.label}</div>
                          <div className="text-sm text-muted-foreground">{classOption.desc}</div>
                        </div>
                        <div className="text-right">
                          {classOption.surcharge === 0 ? (
                            <span className="text-xs text-primary">Standart</span>
                          ) : (
                            <span className="font-semibold text-primary">
                              +₺{classOption.surcharge.toLocaleString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleConfirmFlight(flight);
                  }}
                  disabled={isSelectionAnimating}
                  className="w-full bg-gradient-to-r from-primary to-accent"
                >
                  Seç
                </Button>
              </div>
            )}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
