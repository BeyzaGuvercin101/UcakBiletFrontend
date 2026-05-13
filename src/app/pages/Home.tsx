import { useState } from 'react';
import { useNavigate } from 'react-router';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import * as Select from '@radix-ui/react-select';
import { CalendarDays, MapPin, Users, ChevronDown, Check, Search, TrendingUp, Plane, Loader2, History, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const airports = [
  // Türkiye
  { country: 'Türkiye', city: 'İstanbul', airport: 'İstanbul Havalimanı', code: 'IST' },
  { country: 'Türkiye', city: 'İstanbul', airport: 'Sabiha Gökçen Havalimanı', code: 'SAW' },
  { country: 'Türkiye', city: 'Ankara', airport: 'Esenboğa Havalimanı', code: 'ESB' },
  { country: 'Türkiye', city: 'İzmir', airport: 'Adnan Menderes Havalimanı', code: 'ADB' },
  { country: 'Türkiye', city: 'Antalya', airport: 'Antalya Havalimanı', code: 'AYT' },

  // Avrupa
  { country: 'İngiltere', city: 'Londra', airport: 'Heathrow Airport', code: 'LHR' },
  { country: 'İngiltere', city: 'Londra', airport: 'Gatwick Airport', code: 'LGW' },
  { country: 'Fransa', city: 'Paris', airport: 'Charles de Gaulle Airport', code: 'CDG' },
  { country: 'Fransa', city: 'Paris', airport: 'Orly Airport', code: 'ORY' },
  { country: 'Almanya', city: 'Berlin', airport: 'Brandenburg Airport', code: 'BER' },
  { country: 'İtalya', city: 'Roma', airport: 'Fiumicino Airport', code: 'FCO' },
  { country: 'İspanya', city: 'Barcelona', airport: 'Barcelona-El Prat Airport', code: 'BCN' },

  // ABD
  { country: 'ABD', city: 'New York', airport: 'JFK International Airport', code: 'JFK' },
  { country: 'ABD', city: 'New York', airport: 'Newark Liberty International', code: 'EWR' },
  { country: 'ABD', city: 'Los Angeles', airport: 'LAX International Airport', code: 'LAX' },
  { country: 'ABD', city: 'Miami', airport: 'Miami International Airport', code: 'MIA' },

  // Orta Doğu
  { country: 'Filistin', city: 'Gazze', airport: 'Yasser Arafat International Airport', code: 'GZA' },
  { country: 'Suriye', city: 'Şam', airport: 'Damascus International Airport', code: 'DAM' },
  { country: 'Suriye', city: 'Halep', airport: 'Aleppo International Airport', code: 'ALP' },
  { country: 'Lübnan', city: 'Beyrut', airport: 'Rafic Hariri International Airport', code: 'BEY' },
  { country: 'Ürdün', city: 'Amman', airport: 'Queen Alia International Airport', code: 'AMM' },
  { country: 'Mısır', city: 'Kahire', airport: 'Cairo International Airport', code: 'CAI' },
  { country: 'BAE', city: 'Dubai', airport: 'Dubai International Airport', code: 'DXB' },
  { country: 'Suudi Arabistan', city: 'Cidde', airport: 'King Abdulaziz International Airport', code: 'JED' },
  { country: 'Katar', city: 'Doha', airport: 'Hamad International Airport', code: 'DOH' },

  // Asya
  { country: 'Çin', city: 'Pekin', airport: 'Beijing Capital International Airport', code: 'PEK' },
  { country: 'Çin', city: 'Şangay', airport: 'Shanghai Pudong International Airport', code: 'PVG' },
  { country: 'Çin', city: 'Hong Kong', airport: 'Hong Kong International Airport', code: 'HKG' },
  { country: 'Japonya', city: 'Tokyo', airport: 'Narita International Airport', code: 'NRT' },
  { country: 'Japonya', city: 'Tokyo', airport: 'Haneda Airport', code: 'HND' },
  { country: 'Güney Kore', city: 'Seul', airport: 'Incheon International Airport', code: 'ICN' },
  { country: 'Tayland', city: 'Bangkok', airport: 'Suvarnabhumi Airport', code: 'BKK' },
  { country: 'Singapur', city: 'Singapur', airport: 'Changi Airport', code: 'SIN' },
  { country: 'Malezya', city: 'Kuala Lumpur', airport: 'Kuala Lumpur International Airport', code: 'KUL' },
  { country: 'Hindistan', city: 'Delhi', airport: 'Indira Gandhi International Airport', code: 'DEL' },
  { country: 'Hindistan', city: 'Mumbai', airport: 'Chhatrapati Shivaji International Airport', code: 'BOM' },

  // Afrika
  { country: 'Güney Afrika', city: 'Cape Town', airport: 'Cape Town International Airport', code: 'CPT' },
  { country: 'Kenya', city: 'Nairobi', airport: 'Jomo Kenyatta International Airport', code: 'NBO' },
  { country: 'Fas', city: 'Kazablanka', airport: 'Mohammed V International Airport', code: 'CMN' },
  { country: 'Kanada', city: 'Toronto', airport: 'Toronto Pearson International Airport', code: 'YYZ' },
  { country: 'Meksika', city: 'Mexico City', airport: 'Benito Juarez International Airport', code: 'MEX' },
  { country: 'Brezilya', city: 'Sao Paulo', airport: 'Guarulhos International Airport', code: 'GRU' },
  { country: 'Arjantin', city: 'Buenos Aires', airport: 'Ezeiza International Airport', code: 'EZE' },
  { country: 'Şili', city: 'Santiago', airport: 'Arturo Merino Benitez International Airport', code: 'SCL' },
  { country: 'Kolombiya', city: 'Bogota', airport: 'El Dorado International Airport', code: 'BOG' },
  { country: 'Peru', city: 'Lima', airport: 'Jorge Chavez International Airport', code: 'LIM' },
  { country: 'Hollanda', city: 'Amsterdam', airport: 'Schiphol Airport', code: 'AMS' },
  { country: 'Belçika', city: 'Brüksel', airport: 'Brussels Airport', code: 'BRU' },
  { country: 'İsviçre', city: 'Zürih', airport: 'Zurich Airport', code: 'ZRH' },
  { country: 'Avusturya', city: 'Viyana', airport: 'Vienna International Airport', code: 'VIE' },
  { country: 'Portekiz', city: 'Lizbon', airport: 'Humberto Delgado Airport', code: 'LIS' },
  { country: 'Yunanistan', city: 'Atina', airport: 'Athens International Airport', code: 'ATH' },
  { country: 'Polonya', city: 'Varşova', airport: 'Warsaw Chopin Airport', code: 'WAW' },
  { country: 'Çekya', city: 'Prag', airport: 'Vaclav Havel Airport Prague', code: 'PRG' },
  { country: 'Macaristan', city: 'Budapeşte', airport: 'Budapest Ferenc Liszt International Airport', code: 'BUD' },
  { country: 'İsveç', city: 'Stockholm', airport: 'Arlanda Airport', code: 'ARN' },
  { country: 'Norveç', city: 'Oslo', airport: 'Oslo Airport', code: 'OSL' },
  { country: 'Danimarka', city: 'Kopenhag', airport: 'Copenhagen Airport', code: 'CPH' },
  { country: 'Finlandiya', city: 'Helsinki', airport: 'Helsinki Airport', code: 'HEL' },
  { country: 'İrlanda', city: 'Dublin', airport: 'Dublin Airport', code: 'DUB' },
  { country: 'İsrail', city: 'Tel Aviv', airport: 'Ben Gurion Airport', code: 'TLV' },
  { country: 'Kuveyt', city: 'Kuveyt', airport: 'Kuwait International Airport', code: 'KWI' },
  { country: 'Bahreyn', city: 'Manama', airport: 'Bahrain International Airport', code: 'BAH' },
  { country: 'Umman', city: 'Maskat', airport: 'Muscat International Airport', code: 'MCT' },
  { country: 'Pakistan', city: 'İslamabad', airport: 'Islamabad International Airport', code: 'ISB' },
  { country: 'Endonezya', city: 'Jakarta', airport: 'Soekarno-Hatta International Airport', code: 'CGK' },
  { country: 'Filipinler', city: 'Manila', airport: 'Ninoy Aquino International Airport', code: 'MNL' },
  { country: 'Vietnam', city: 'Ho Chi Minh City', airport: 'Tan Son Nhat International Airport', code: 'SGN' },
  { country: 'Avustralya', city: 'Sydney', airport: 'Sydney Kingsford Smith Airport', code: 'SYD' },
  { country: 'Yeni Zelanda', city: 'Auckland', airport: 'Auckland Airport', code: 'AKL' },
  { country: 'Nijerya', city: 'Lagos', airport: 'Murtala Muhammed International Airport', code: 'LOS' },
  { country: 'Etiyopya', city: 'Addis Ababa', airport: 'Bole International Airport', code: 'ADD' },
  { country: 'Tanzanya', city: 'Darüsselam', airport: 'Julius Nyerere International Airport', code: 'DAR' },
  { country: 'Tunus', city: 'Tunus', airport: 'Tunis-Carthage International Airport', code: 'TUN' },
  { country: 'Cezayir', city: 'Cezayir', airport: 'Houari Boumediene Airport', code: 'ALG' },
  { country: 'Gana', city: 'Akra', airport: 'Kotoka International Airport', code: 'ACC' },
  { country: 'Azerbaycan', city: 'Bakü', airport: 'Heydar Aliyev International Airport', code: 'GYD' },
  { country: 'Gürcistan', city: 'Tiflis', airport: 'Tbilisi International Airport', code: 'TBS' },
  { country: 'Ermenistan', city: 'Erivan', airport: 'Zvartnots International Airport', code: 'EVN' },
  { country: 'Kazakistan', city: 'Almatı', airport: 'Almaty International Airport', code: 'ALA' },
  { country: 'Özbekistan', city: 'Taşkent', airport: 'Islam Karimov Tashkent International Airport', code: 'TAS' },
  { country: 'Kırgızistan', city: 'Bişkek', airport: 'Manas International Airport', code: 'FRU' },
  { country: 'Türkmenistan', city: 'Aşkabat', airport: 'Ashgabat International Airport', code: 'ASB' },
  { country: 'Rusya', city: 'Moskova', airport: 'Sheremetyevo International Airport', code: 'SVO' },
  { country: 'Ukrayna', city: 'Kiev', airport: 'Boryspil International Airport', code: 'KBP' },
  { country: 'Romanya', city: 'Bükreş', airport: 'Henri Coanda International Airport', code: 'OTP' },
  { country: 'Bulgaristan', city: 'Sofya', airport: 'Sofia Airport', code: 'SOF' },
  { country: 'Sırbistan', city: 'Belgrad', airport: 'Belgrade Nikola Tesla Airport', code: 'BEG' },
  { country: 'Hırvatistan', city: 'Zagreb', airport: 'Zagreb Airport', code: 'ZAG' },
  { country: 'Arnavutluk', city: 'Tiran', airport: 'Tirana International Airport', code: 'TIA' },
  { country: 'Bosna Hersek', city: 'Saraybosna', airport: 'Sarajevo International Airport', code: 'SJJ' },
  { country: 'Karadağ', city: 'Podgorica', airport: 'Podgorica Airport', code: 'TGD' },
  { country: 'Kuzey Makedonya', city: 'Üsküp', airport: 'Skopje International Airport', code: 'SKP' },
  { country: 'Slovenya', city: 'Ljubljana', airport: 'Ljubljana Joze Pucnik Airport', code: 'LJU' },
  { country: 'Slovakya', city: 'Bratislava', airport: 'Bratislava Airport', code: 'BTS' },
  { country: 'Estonya', city: 'Tallinn', airport: 'Tallinn Airport', code: 'TLL' },
  { country: 'Letonya', city: 'Riga', airport: 'Riga International Airport', code: 'RIX' },
  { country: 'Litvanya', city: 'Vilnius', airport: 'Vilnius Airport', code: 'VNO' },
  { country: 'İzlanda', city: 'Reykjavik', airport: 'Keflavik International Airport', code: 'KEF' },
  { country: 'Lüksemburg', city: 'Lüksemburg', airport: 'Luxembourg Airport', code: 'LUX' },
  { country: 'Malta', city: 'Malta', airport: 'Malta International Airport', code: 'MLA' },
  { country: 'Fas', city: 'Marakeş', airport: 'Marrakesh Menara Airport', code: 'RAK' },
  { country: 'Senegal', city: 'Dakar', airport: 'Blaise Diagne International Airport', code: 'DSS' },
  { country: 'Fildişi Sahili', city: 'Abidjan', airport: 'Felix Houphouet Boigny International Airport', code: 'ABJ' },
  { country: 'Uganda', city: 'Entebbe', airport: 'Entebbe International Airport', code: 'EBB' },
  { country: 'Ruanda', city: 'Kigali', airport: 'Kigali International Airport', code: 'KGL' },
  { country: 'Zambiya', city: 'Lusaka', airport: 'Kenneth Kaunda International Airport', code: 'LUN' },
  { country: 'Zimbabwe', city: 'Harare', airport: 'Robert Gabriel Mugabe International Airport', code: 'HRE' },
  { country: 'Namibya', city: 'Windhoek', airport: 'Hosea Kutako International Airport', code: 'WDH' },
  { country: 'Mauritius', city: 'Mauritius', airport: 'Sir Seewoosagur Ramgoolam International Airport', code: 'MRU' },
  { country: 'Seyşeller', city: 'Mahe', airport: 'Seychelles International Airport', code: 'SEZ' },
  { country: 'İran', city: 'Tahran', airport: 'Imam Khomeini International Airport', code: 'IKA' },
  { country: 'Irak', city: 'Bağdat', airport: 'Baghdad International Airport', code: 'BGW' },
  { country: 'Afganistan', city: 'Kabil', airport: 'Kabul International Airport', code: 'KBL' },
  { country: 'Nepal', city: 'Katmandu', airport: 'Tribhuvan International Airport', code: 'KTM' },
  { country: 'Sri Lanka', city: 'Kolombo', airport: 'Bandaranaike International Airport', code: 'CMB' },
  { country: 'Bangladeş', city: 'Dakka', airport: 'Hazrat Shahjalal International Airport', code: 'DAC' },
  { country: 'Maldivler', city: 'Male', airport: 'Velana International Airport', code: 'MLE' },
  { country: 'Myanmar', city: 'Yangon', airport: 'Yangon International Airport', code: 'RGN' },
  { country: 'Kamboçya', city: 'Phnom Penh', airport: 'Phnom Penh International Airport', code: 'PNH' },
  { country: 'Laos', city: 'Vientiane', airport: 'Wattay International Airport', code: 'VTE' },
  { country: 'Tayvan', city: 'Taipei', airport: 'Taiwan Taoyuan International Airport', code: 'TPE' },
  { country: 'Moğolistan', city: 'Ulan Batur', airport: 'Chinggis Khaan International Airport', code: 'UBN' },
  { country: 'Güney Afrika', city: 'Johannesburg', airport: 'O. R. Tambo International Airport', code: 'JNB' },
  { country: 'Küba', city: 'Havana', airport: 'Jose Marti International Airport', code: 'HAV' },
  { country: 'Dominik Cumhuriyeti', city: 'Punta Cana', airport: 'Punta Cana International Airport', code: 'PUJ' },
  { country: 'Jamaika', city: 'Montego Bay', airport: 'Sangster International Airport', code: 'MBJ' },
  { country: 'Panama', city: 'Panama City', airport: 'Tocumen International Airport', code: 'PTY' },
  { country: 'Kosta Rika', city: 'San Jose', airport: 'Juan Santamaria International Airport', code: 'SJO' },
  { country: 'Ekvador', city: 'Quito', airport: 'Mariscal Sucre International Airport', code: 'UIO' },
  { country: 'Uruguay', city: 'Montevideo', airport: 'Carrasco International Airport', code: 'MVD' },
  { country: 'Paraguay', city: 'Asuncion', airport: 'Silvio Pettirossi International Airport', code: 'ASU' },
  { country: 'Bolivya', city: 'Santa Cruz', airport: 'Viru Viru International Airport', code: 'VVI' },
];

// Group airports by city and add "All" option for cities with multiple airports
const locations = airports.reduce((acc: Array<{ country: string; city: string; airport: string; code: string; isAll?: boolean }>, airport) => {
  const cityAirports = airports.filter(a => a.city === airport.city);
  const hasAll = acc.some(loc => loc.city === airport.city && loc.isAll);

  if (cityAirports.length > 1 && !hasAll) {
    acc.push({
      country: airport.country,
      city: airport.city,
      airport: 'Tüm Havaalanları',
      code: 'ALL',
      isAll: true
    });
  }

  acc.push(airport);
  return acc;
}, []);

const popularDestinations = [
  {
    city: 'Dubai',
    code: 'DXB',
    price: '2.200',
    image: 'https://images.unsplash.com/photo-1651063820152-d3e7a27b4d2b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxEdWJhaSUyMHNreWxpbmUlMjBidXJqJTIwa2hhbGlmYXxlbnwxfHx8fDE3NzgyNzgwMjB8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    city: 'Tokyo',
    code: 'ALL',
    price: '5.500',
    image: 'https://images.unsplash.com/photo-1583915223588-7d88ebf23414?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxUb2t5byUyMGphcGFuJTIwY2l0eXxlbnwxfHx8fDE3NzgyNzgwMjF8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    city: 'Pekin',
    code: 'PEK',
    price: '4.500',
    image: 'https://images.unsplash.com/photo-1599353510826-7d21e0eb5365?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCZWlqaW5nJTIwY2hpbmElMjBmb3JiaWRkZW4lMjBjaXR5fGVufDF8fHx8MTc3ODI3ODAyMXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    city: 'Paris',
    code: 'ALL',
    price: '2.450',
    image: 'https://images.unsplash.com/photo-1431274172761-fca41d930114?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxQYXJpcyUyMGVpZmZlbCUyMHRvd2VyfGVufDF8fHx8MTc3ODI3ODAyMXww&ixlib=rb-4.1.0&q=80&w=1080'
  },
  {
    city: 'Şam',
    code: 'DAM',
    price: '1.400',
    image: 'https://images.unsplash.com/photo-1737275853879-731f24015ec2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxEYW1hc2N1cyUyMFN5cmlhJTIwb2xkJTIwY2l0eXxlbnwxfHx8fDE3NzgyNzgwMjJ8MA&ixlib=rb-4.1.0&q=80&w=1080'
  },
];

const passengerTypes = [
  { id: 'adult', label: 'Yetişkin', description: '12 yaş ve üzeri', multiplier: 1 },
  { id: 'child', label: 'Çocuk', description: '2-12 yaş arası', multiplier: 0.65 },
  { id: 'student', label: 'Öğrenci', description: 'Öğrenci indirimi', multiplier: 0.85 },
];

type RecentSearch = {
  tripType: 'oneWay' | 'roundTrip';
  from: string;
  to: string;
  departDate: string;
  returnDate: string;
  adultPassengers: string;
  childPassengers: string;
  studentPassengers: string;
};

const getRecentSearches = (): RecentSearch[] => {
  try {
    const searches = JSON.parse(localStorage.getItem('recentFlightSearches') || '[]');
    return Array.isArray(searches) ? searches.slice(0, 4) : [];
  } catch {
    return [];
  }
};

const saveRecentSearch = (search: RecentSearch) => {
  const searches = getRecentSearches();
  const nextSearches = [
    search,
    ...searches.filter((item) =>
      item.from !== search.from ||
      item.to !== search.to ||
      item.departDate !== search.departDate ||
      item.returnDate !== search.returnDate ||
      item.tripType !== search.tripType
    ),
  ].slice(0, 4);

  localStorage.setItem('recentFlightSearches', JSON.stringify(nextSearches));
};

export default function Home() {
  const navigate = useNavigate();
  const [tripType, setTripType] = useState<'oneWay' | 'roundTrip'>('oneWay');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [departDate, setDepartDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [adultPassengers, setAdultPassengers] = useState('1');
  const [childPassengers, setChildPassengers] = useState('0');
  const [studentPassengers, setStudentPassengers] = useState('0');
  const [isSearching, setIsSearching] = useState(false);
  const [showRecentSearches, setShowRecentSearches] = useState(false);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>(() => getRecentSearches());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    if (!from) {
      toast.error('Lütfen kalkış noktasını seçin');
      return;
    }

    if (!to) {
      toast.error('Lütfen varış noktasını seçin');
      return;
    }

    if (!departDate) {
      toast.error('Lütfen gidiş tarihini seçin');
      return;
    }

    if (tripType === 'roundTrip' && !returnDate) {
      toast.error('Lütfen dönüş tarihini seçin');
      return;
    }

    const totalPassengers =
      Number(adultPassengers || 0) +
      Number(childPassengers || 0) +
      Number(studentPassengers || 0);

    if (totalPassengers < 1) {
      toast.error('Lütfen en az bir yolcu seçin');
      return;
    }

    const params = new URLSearchParams({
      tripType,
      from,
      to,
      departDate,
      returnDate: tripType === 'roundTrip' ? returnDate : '',
      passengers: totalPassengers.toString(),
      adultPassengers,
      childPassengers,
      studentPassengers,
    });

    const nextSearch: RecentSearch = {
      tripType,
      from,
      to,
      departDate,
      returnDate: tripType === 'roundTrip' ? returnDate : '',
      adultPassengers,
      childPassengers,
      studentPassengers,
    };

    saveRecentSearch(nextSearch);
    setRecentSearches(getRecentSearches());
    setIsSearching(true);

    window.setTimeout(() => {
      navigate(`/flights?${params.toString()}`);
    }, 700);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-6 relative overflow-hidden rounded-3xl py-4">
          <div className="pointer-events-none absolute inset-x-[-20%] top-10 z-10 h-24">
            <div className="opening-plane-flight absolute left-0 top-4 flex items-center gap-3">
              <div className="h-0.5 w-40 bg-gradient-to-l from-primary/80 via-accent/70 to-transparent shadow-[0_0_18px_rgba(6,182,212,0.45)]"></div>
              <Plane className="w-11 h-11 text-primary rotate-90 drop-shadow-[0_0_22px_rgba(6,182,212,0.95)]" />
            </div>
          </div>
          <h2 className="mb-2 text-3xl md:text-4xl">
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Hayalleriniz bir bilet ilerinizde
            </span>
          </h2>
          <p className="text-muted-foreground text-base max-w-2xl mx-auto">
            Tek yön veya çift yön seyahatinizi seçin, tarihi belirleyin ve uygun uçuşlara geçin.
          </p>
          <h2 className="sr-only">
            Hayalleriniz Bir Bilet <br />
            <span className="bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              İlerinizde
            </span>
          </h2>
          <p className="sr-only">
            Dünyadaki havalimanlarını birbirine bağlayan akıllı bilet deneyimi.
          </p>
        </div>

        <div
          id="flight-search"
          onFocusCapture={() => setShowRecentSearches(true)}
          className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-3xl p-8 shadow-2xl mb-12"
        >
          <form onSubmit={handleSearch} className="space-y-6">
            {showRecentSearches && recentSearches.length > 0 && (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm text-primary">
                  <History className="w-4 h-4" />
                  Son aramalarınız
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {recentSearches.map((search, index) => (
                    <button
                      key={`${search.from}-${search.to}-${search.departDate}-${index}`}
                      type="button"
                      onClick={() => {
                        setTripType(search.tripType);
                        setFrom(search.from);
                        setTo(search.to);
                        setDepartDate(search.departDate);
                        setReturnDate(search.returnDate);
                        setAdultPassengers(search.adultPassengers);
                        setChildPassengers(search.childPassengers);
                        setStudentPassengers(search.studentPassengers);
                      }}
                      className="flex items-center justify-between gap-3 rounded-xl bg-background/80 px-4 py-3 text-left hover:bg-background hover:shadow-md transition-all"
                    >
                      <span>
                        <span className="block text-sm">
                          {search.from} <ArrowRight className="mx-1 inline h-3.5 w-3.5" /> {search.to}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {search.departDate}
                          {search.tripType === 'roundTrip' && search.returnDate ? ` - ${search.returnDate}` : ''}
                        </span>
                      </span>
                      <Search className="h-4 w-4 text-primary" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block mb-3 text-sm text-muted-foreground">Bilet Tipi</label>
              <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-2">
                <button
                  type="button"
                  onClick={() => {
                    setTripType('oneWay');
                    setReturnDate('');
                  }}
                  className={`h-12 rounded-xl transition-all ${
                    tripType === 'oneWay'
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                      : 'text-muted-foreground hover:bg-background'
                  }`}
                >
                  Tek Yön
                </button>
                <button
                  type="button"
                  onClick={() => setTripType('roundTrip')}
                  className={`h-12 rounded-xl transition-all ${
                    tripType === 'roundTrip'
                      ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg'
                      : 'text-muted-foreground hover:bg-background'
                  }`}
                >
                  Çift Yön
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-3 text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Nereden
                </label>
                <Select.Root value={from} onValueChange={setFrom} required>
                  <Select.Trigger className="w-full px-5 py-4 rounded-2xl bg-input-background border-2 border-border flex items-center justify-between hover:border-primary transition-colors">
                    <Select.Value placeholder="Kalkış noktası seçin" />
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      className="bg-popover border-2 border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                      position="popper"
                      sideOffset={5}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <Select.Viewport className="p-2 max-h-[300px] overflow-y-auto">
                        {locations.map((location, index) => (
                          <Select.Item
                            key={`from-${index}`}
                            value={`${location.city} (${location.code})`}
                            className={`px-4 py-3 rounded-xl cursor-pointer hover:bg-primary/10 outline-none flex items-center justify-between transition-colors ${
                              location.isAll ? 'bg-primary/5' : ''
                            }`}
                          >
                            <Select.ItemText>
                              <div className="flex flex-col text-left">
                                <span className="text-foreground text-left">
                                  {location.city}
                                  {location.isAll && <span className="ml-2 text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">Tümü</span>}
                                </span>
                                <span className="text-xs text-muted-foreground text-left">
                                  {location.isAll ? 'Tüm Havaalanları' : `${location.airport} (${location.code})`}
                                </span>
                              </div>
                            </Select.ItemText>
                            <Select.ItemIndicator className="ml-2">
                              <Check className="w-5 h-5 text-primary" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div>
                <label className="block mb-3 text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Nereye
                </label>
                <Select.Root value={to} onValueChange={setTo} required>
                  <Select.Trigger className="w-full px-5 py-4 rounded-2xl bg-input-background border-2 border-border flex items-center justify-between hover:border-primary transition-colors">
                    <Select.Value placeholder="Varış noktası seçin" />
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content
                      className="bg-popover border-2 border-border rounded-2xl shadow-2xl overflow-hidden z-50"
                      position="popper"
                      sideOffset={5}
                      onWheel={(e) => e.stopPropagation()}
                    >
                      <Select.Viewport className="p-2 max-h-[300px] overflow-y-auto">
                        {locations.map((location, index) => (
                          <Select.Item
                            key={`to-${index}`}
                            value={`${location.city} (${location.code})`}
                            className={`px-4 py-3 rounded-xl cursor-pointer hover:bg-primary/10 outline-none flex items-center justify-between transition-colors ${
                              location.isAll ? 'bg-primary/5' : ''
                            }`}
                          >
                            <Select.ItemText>
                              <div className="flex flex-col">
                                <span className="text-foreground">
                                  {location.city}
                                  {location.isAll && <span className="ml-2 text-xs px-2 py-0.5 bg-primary/20 text-primary rounded">Tümü</span>}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {location.isAll ? 'Tüm Havaalanları' : `${location.airport} (${location.code})`}
                                </span>
                              </div>
                            </Select.ItemText>
                            <Select.ItemIndicator>
                              <Check className="w-5 h-5 text-primary" />
                            </Select.ItemIndicator>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>
            </div>

            <div>
              <label className="block mb-3 text-sm text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Yolcu Tipleri
              </label>
              <div className="grid md:grid-cols-3 gap-4">
                {passengerTypes.map((type) => {
                  const value =
                    type.id === 'adult'
                      ? adultPassengers
                      : type.id === 'child'
                      ? childPassengers
                      : studentPassengers;
                  const setValue =
                    type.id === 'adult'
                      ? setAdultPassengers
                      : type.id === 'child'
                      ? setChildPassengers
                      : setStudentPassengers;

                  return (
                    <div key={type.id} className="rounded-2xl border-2 border-border bg-input-background p-4">
                      <div className="mb-3">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                        <div className="text-xs text-primary mt-1">
                          {type.multiplier === 1 ? 'Tam ücret' : `%${Math.round(type.multiplier * 100)} ücret`}
                        </div>
                      </div>
                      <Input
                        type="number"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        min={type.id === 'adult' ? '1' : '0'}
                        max="9"
                        required={type.id === 'adult'}
                        className="h-12 rounded-xl border-2 hover:border-primary transition-colors"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className={`grid ${tripType === 'roundTrip' ? 'md:grid-cols-2' : 'md:grid-cols-1'} gap-6`}>
              <div>
                <label className="block mb-3 text-sm text-muted-foreground flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" />
                  Gidiş Tarihi
                </label>
                <Input
                  type="date"
                  value={departDate}
                  onChange={(e) => setDepartDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  required
                  className="h-14 rounded-2xl border-2 hover:border-primary transition-colors"
                />
              </div>

              {tripType === 'roundTrip' && (
                <div>
                  <label className="block mb-3 text-sm text-muted-foreground flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" />
                    Dönüş Tarihi
                  </label>
                  <Input
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    min={departDate || new Date().toISOString().split('T')[0]}
                    required={tripType === 'roundTrip'}
                    className="h-14 rounded-2xl border-2 hover:border-primary transition-colors"
                  />
                </div>
              )}

            </div>

            <Button
              type="submit"
              size="lg"
              disabled={isSearching}
              className="w-full h-14 rounded-2xl bg-gradient-to-r from-primary to-accent hover:shadow-xl hover:scale-[1.02] transition-all text-lg flex items-center justify-center gap-2"
            >
              {isSearching ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uçuşlar listeleniyor...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Uçuş Ara
                </>
              )}
            </Button>
            {isSearching && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin text-primary" />
                Veritabanı sorgusu hazırlanıyor, uygun uçuşlara yönlendiriliyorsunuz.
              </div>
            )}
          </form>
        </div>

        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-primary" />
            <h3 className="text-xl">Popüler Destinasyonlar</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {popularDestinations.map((dest) => (
              <button
                key={dest.city}
                onClick={() => setTo(`${dest.city} (${dest.code})`)}
                className="group relative overflow-hidden rounded-2xl h-48 hover:scale-[1.02] transition-transform"
              >
                <ImageWithFallback
                  src={dest.image}
                  alt={dest.city}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/90 transition-all"></div>
                <div className="relative h-full flex flex-col items-start justify-end text-white p-6">
                  <div className="text-2xl mb-2 text-left">{dest.city}</div>
                  <div className="text-sm opacity-90 text-left">₺{dest.price}'den başlayan</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="backdrop-blur-xl bg-gradient-to-br from-slate-950 via-black to-slate-950 border border-white/30 rounded-3xl p-8 overflow-hidden relative shadow-2xl shadow-white/10">
          <div className="flex items-center gap-2 mb-6">
            <Plane className="w-5 h-5 text-white" />
            <h3 className="text-xl text-white">Global Uçuş Ağımız</h3>
            <div className="ml-auto text-sm text-white/90 flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse shadow-lg shadow-white/70"></div>
              100+ Havalimanı
            </div>
          </div>

          <div className="relative w-full h-[600px] rounded-2xl overflow-hidden bg-black">
            {/* Space background kept separate from the SVG globe so routes stay visually inside one world. */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-950" />
              <div
                className="absolute inset-0 opacity-35"
                style={{
                  backgroundImage:
                    'radial-gradient(circle, rgba(255,255,255,0.55) 0 1px, transparent 1px), radial-gradient(circle, rgba(103,232,249,0.35) 0 1px, transparent 1px)',
                  backgroundPosition: '0 0, 34px 42px',
                  backgroundSize: '96px 96px, 138px 138px',
                }}
              />
              {/* Dark overlay for better contrast */}
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60"></div>
            </div>

            <svg viewBox="0 0 1200 600" className="absolute inset-0 w-full h-full" style={{ filter: 'drop-shadow(0 0 10px rgba(6, 182, 212, 0.3))' }}>
              <defs>
                <radialGradient id="hubGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="30%" stopColor="#e5e5e5" stopOpacity="0.9" />
                  <stop offset="60%" stopColor="#d4d4d4" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#a3a3a3" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="destGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                  <stop offset="30%" stopColor="#f5f5f5" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#e5e5e5" stopOpacity="0" />
                </radialGradient>
                <radialGradient id="earthGlobeGradient" cx="45%" cy="42%" r="70%">
                  <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.24" />
                  <stop offset="42%" stopColor="#0f766e" stopOpacity="0.20" />
                  <stop offset="76%" stopColor="#0f172a" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.88" />
                </radialGradient>
                <linearGradient id="globeOceanGradient" x1="8%" y1="18%" x2="92%" y2="82%">
                  <stop offset="0%" stopColor="#0f172a" stopOpacity="0.94" />
                  <stop offset="38%" stopColor="#0f766e" stopOpacity="0.58" />
                  <stop offset="62%" stopColor="#0e7490" stopOpacity="0.42" />
                  <stop offset="100%" stopColor="#020617" stopOpacity="0.96" />
                </linearGradient>
                <clipPath id="globeClip">
                  <ellipse cx="565" cy="310" rx="555" ry="270" />
                </clipPath>
                <filter id="glow">
                  <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
                <filter id="strongGlow">
                  <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                  <feMerge>
                    <feMergeNode in="coloredBlur"/>
                    <feMergeNode in="SourceGraphic"/>
                  </feMerge>
                </filter>
              </defs>

              <g clipPath="url(#globeClip)" opacity="0.96">
                <ellipse cx="565" cy="310" rx="555" ry="270" fill="url(#globeOceanGradient)" />
                <g className="earth-surface-drift">
                  <path d="M 130,245 C 180,188 260,185 315,230 C 350,260 340,305 300,318 C 245,338 178,315 140,285 C 118,268 114,258 130,245 Z" fill="#164e63" opacity="0.52" />
                  <path d="M 332,205 C 390,178 465,190 505,238 C 535,274 520,315 470,328 C 412,342 350,320 320,280 C 292,242 302,220 332,205 Z" fill="#115e59" opacity="0.56" />
                  <path d="M 470,315 C 530,300 605,318 638,366 C 670,413 632,465 565,470 C 510,474 460,438 455,386 C 452,354 455,325 470,315 Z" fill="#155e75" opacity="0.46" />
                  <path d="M 700,220 C 790,178 905,198 978,255 C 1025,292 1020,345 965,360 C 890,380 780,350 710,300 C 662,266 655,242 700,220 Z" fill="#134e4a" opacity="0.52" />
                  <path d="M 730,365 C 806,340 915,365 980,430 C 1018,468 985,512 900,505 C 815,498 735,452 705,405 C 690,382 700,374 730,365 Z" fill="#164e63" opacity="0.44" />
                </g>
                <path d="M 30,310 C 210,230 365,232 565,310 C 760,385 925,388 1100,310" stroke="rgba(255,255,255,0.10)" strokeWidth="1" fill="none" />
                <path d="M 85,210 C 265,155 430,182 565,235 C 745,305 905,305 1040,245" stroke="rgba(103,232,249,0.12)" strokeWidth="1.5" fill="none" />
                <path d="M 92,430 C 285,502 430,468 565,400 C 735,318 900,350 1035,430" stroke="rgba(103,232,249,0.10)" strokeWidth="1.5" fill="none" />
              </g>

              <ellipse cx="565" cy="310" rx="555" ry="270" fill="url(#earthGlobeGradient)" opacity="0.68" />
              <ellipse cx="565" cy="310" rx="555" ry="270" fill="none" stroke="rgba(103,232,249,0.36)" strokeWidth="2" />
              <ellipse cx="565" cy="310" rx="500" ry="220" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
              <ellipse cx="565" cy="310" rx="410" ry="170" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1" />
              <path d="M 65,310 C 220,250 390,250 565,310 C 740,370 910,370 1065,310" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />
              <path d="M 110,230 C 275,190 415,205 565,250 C 740,305 890,310 1020,260" stroke="rgba(20,184,166,0.10)" strokeWidth="1.5" fill="none" />
              <path d="M 120,405 C 300,450 430,430 565,385 C 720,335 875,340 1010,400" stroke="rgba(20,184,166,0.10)" strokeWidth="1.5" fill="none" />

              <g clipPath="url(#globeClip)">
              {/* Flight routes - all major connections */}
              <g className="flight-routes" opacity="1" filter="url(#glow)">
                {/* From Istanbul (center hub at 480,300) to all destinations */}

                {/* Europe routes */}
                <path d="M 480,300 Q 420,210 380,230" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 440,220 400,230" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2.2s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 420,225 360,240" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.8s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 440,235 400,250" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2.1s" repeatCount="indefinite" />
                </path>

                {/* Middle East routes */}
                <path d="M 480,300 L 520,270" stroke="#14b8a6" strokeWidth="1.5" fill="none" strokeDasharray="4,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 L 505,265" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.1s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 L 510,258" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="0.9s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 530,255 580,265" stroke="#14b8a6" strokeWidth="1.5" fill="none" strokeDasharray="4,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.5s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 540,265 600,280" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.6s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 500,270 520,285" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.3s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 520,275 560,290" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.4s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 560,260 640,275" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="1.7s" repeatCount="indefinite" />
                </path>

                {/* Asia routes */}
                <path d="M 480,300 Q 650,200 820,230" stroke="#14b8a6" strokeWidth="1.5" fill="none" strokeDasharray="4,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="3s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 680,210 880,240" stroke="#14b8a6" strokeWidth="1.5" fill="none" strokeDasharray="4,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="3.2s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 700,220 920,250" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="3.5s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 720,235 960,260" stroke="#14b8a6" strokeWidth="1.5" fill="none" strokeDasharray="4,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="3.8s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 700,245 920,270" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="3.3s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 650,260 820,290" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2.8s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 670,265 860,295" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2.9s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 680,275 880,310" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="3.1s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 620,280 760,310" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2.7s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 640,285 800,320" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2.6s" repeatCount="indefinite" />
                </path>

                {/* Americas routes */}
                <path d="M 480,300 Q 300,150 120,180" stroke="#14b8a6" strokeWidth="1.5" fill="none" strokeDasharray="4,4">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="4s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 280,140 80,160" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="4.2s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 290,190 100,240" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="4.5s" repeatCount="indefinite" />
                </path>

                {/* Africa routes */}
                <path d="M 480,300 Q 450,330 420,380" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2.5s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 480,310 480,360" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2.3s" repeatCount="indefinite" />
                </path>
                <path d="M 480,300 Q 410,300 340,340" stroke="#ffffff" strokeWidth="1" fill="none" strokeDasharray="3,3" opacity="0.5">
                  <animate attributeName="stroke-dashoffset" from="0" to="-8" dur="2.4s" repeatCount="indefinite" />
                </path>
              </g>

              <g className="animated-route-planes" filter="url(#strongGlow)">
                {[
                  { path: 'M 480,300 Q 420,210 380,230', dur: '5s', delay: '0s' },
                  { path: 'M 480,300 Q 530,255 580,265', dur: '4.2s', delay: '0.8s' },
                  { path: 'M 480,300 Q 720,235 960,260', dur: '7s', delay: '1.2s' },
                  { path: 'M 480,300 Q 300,150 120,180', dur: '7.5s', delay: '2s' },
                  { path: 'M 480,300 Q 480,310 480,360', dur: '4.8s', delay: '1.6s' },
                ].map((route, index) => (
                  <g key={index}>
                    <path d="M -10 0 L 10 0 L 4 4 L 6 12 L 0 8 L -6 12 L -4 4 Z" fill="#ffffff">
                      <animateMotion path={route.path} dur={route.dur} begin={route.delay} repeatCount="indefinite" rotate="auto" />
                    </path>
                  </g>
                ))}
              </g>

              {/* Airport nodes with labels */}

              {/* Istanbul - Main Hub */}
              <g className="airport-hub" filter="url(#strongGlow)">
                <circle cx="480" cy="300" r="35" fill="url(#hubGlow)" opacity="0.8">
                  <animate attributeName="r" values="30;45;30" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.6;0.9;0.6" dur="3s" repeatCount="indefinite" />
                </circle>
                <circle cx="480" cy="300" r="20" fill="url(#hubGlow)" opacity="0.9">
                  <animate attributeName="r" values="15;25;15" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="480" cy="300" r="8" fill="#ffffff">
                  <animate attributeName="r" values="6;10;6" dur="2s" repeatCount="indefinite" />
                </circle>
                <text x="480" y="280" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="bold" style={{ textShadow: '0 0 15px rgba(255, 255, 255, 1), 0 0 25px rgba(255, 255, 255, 0.7)' }}>İSTANBUL</text>
              </g>

              {/* Europe */}
              <g filter="url(#glow)">
                <circle cx="380" cy="230" r="12" fill="url(#destGlow)" opacity="0.8"><animate attributeName="r" values="10;15;10" dur="2s" repeatCount="indefinite" /></circle>
                <circle cx="380" cy="230" r="6" fill="#ffffff"><animate attributeName="opacity" values="0.8;1;0.8" dur="2s" repeatCount="indefinite" /></circle>
                <text x="380" y="217" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Londra</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="400" cy="230" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.1s" repeatCount="indefinite" /></circle>
                <circle cx="400" cy="230" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.1s" repeatCount="indefinite" /></circle>
                <text x="400" y="217" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Paris</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="360" cy="240" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="1.9s" repeatCount="indefinite" /></circle>
                <circle cx="360" cy="240" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.9s" repeatCount="indefinite" /></circle>
                <text x="360" y="227" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Berlin</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="400" cy="300" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.2s" repeatCount="indefinite" /></circle>
                <circle cx="400" cy="300" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.2s" repeatCount="indefinite" /></circle>
                <text x="400" y="315" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Roma</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="420" cy="295" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" /></circle>
                <circle cx="420" cy="295" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" /></circle>
                <text x="420" y="282" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Barcelona</text>
              </g>

              {/* Middle East */}
              <g filter="url(#glow)">
                <circle cx="520" cy="320" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="1.5s" repeatCount="indefinite" /></circle>
                <circle cx="520" cy="320" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.5s" repeatCount="indefinite" /></circle>
                <text x="520" y="335" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Şam</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="505" cy="315" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="1.6s" repeatCount="indefinite" /></circle>
                <circle cx="505" cy="315" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.6s" repeatCount="indefinite" /></circle>
                <text x="505" y="305" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Halep</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="510" cy="308" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="1.4s" repeatCount="indefinite" /></circle>
                <circle cx="510" cy="308" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.4s" repeatCount="indefinite" /></circle>
                <text x="510" y="298" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Gazze</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="520" cy="335" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="1.7s" repeatCount="indefinite" /></circle>
                <circle cx="520" cy="335" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.7s" repeatCount="indefinite" /></circle>
                <text x="520" y="325" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Beyrut</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="560" cy="340" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="1.8s" repeatCount="indefinite" /></circle>
                <circle cx="560" cy="340" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.8s" repeatCount="indefinite" /></circle>
                <text x="560" y="355" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Amman</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="580" cy="315" r="12" fill="url(#destGlow)" opacity="0.7"><animate attributeName="r" values="10;15;10" dur="1.9s" repeatCount="indefinite" /></circle>
                <circle cx="580" cy="315" r="6" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="1.9s" repeatCount="indefinite" /></circle>
                <text x="580" y="305" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.7)' }}>Dubai</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="600" cy="330" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2s" repeatCount="indefinite" /></circle>
                <circle cx="600" cy="330" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" /></circle>
                <text x="600" y="345" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Cidde</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="640" cy="325" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.1s" repeatCount="indefinite" /></circle>
                <circle cx="640" cy="325" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.1s" repeatCount="indefinite" /></circle>
                <text x="640" y="340" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Doha</text>
              </g>

              {/* Asia */}
              <g filter="url(#glow)">
                <circle cx="820" cy="230" r="12" fill="url(#destGlow)" opacity="0.7"><animate attributeName="r" values="10;15;10" dur="3s" repeatCount="indefinite" /></circle>
                <circle cx="820" cy="230" r="6" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" /></circle>
                <text x="820" y="217" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.7)' }}>Pekin</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="880" cy="240" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="3.2s" repeatCount="indefinite" /></circle>
                <circle cx="880" cy="240" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="3.2s" repeatCount="indefinite" /></circle>
                <text x="880" y="227" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Şangay</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="920" cy="250" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="3.3s" repeatCount="indefinite" /></circle>
                <circle cx="920" cy="250" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="3.3s" repeatCount="indefinite" /></circle>
                <text x="920" y="237" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Hong Kong</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="960" cy="260" r="12" fill="url(#destGlow)" opacity="0.7"><animate attributeName="r" values="10;15;10" dur="3.5s" repeatCount="indefinite" /></circle>
                <circle cx="960" cy="260" r="6" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="3.5s" repeatCount="indefinite" /></circle>
                <text x="960" y="247" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.7)' }}>Tokyo</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="920" cy="270" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="3.1s" repeatCount="indefinite" /></circle>
                <circle cx="920" cy="270" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="3.1s" repeatCount="indefinite" /></circle>
                <text x="920" y="285" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Seul</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="820" cy="340" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.8s" repeatCount="indefinite" /></circle>
                <circle cx="820" cy="340" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.8s" repeatCount="indefinite" /></circle>
                <text x="820" y="355" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Bangkok</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="860" cy="345" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.9s" repeatCount="indefinite" /></circle>
                <circle cx="860" cy="345" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.9s" repeatCount="indefinite" /></circle>
                <text x="860" y="360" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Singapur</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="880" cy="360" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="3s" repeatCount="indefinite" /></circle>
                <circle cx="880" cy="360" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="3s" repeatCount="indefinite" /></circle>
                <text x="880" y="375" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Kuala Lumpur</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="760" cy="360" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.7s" repeatCount="indefinite" /></circle>
                <circle cx="760" cy="360" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.7s" repeatCount="indefinite" /></circle>
                <text x="760" y="375" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Delhi</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="800" cy="370" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.6s" repeatCount="indefinite" /></circle>
                <circle cx="800" cy="370" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.6s" repeatCount="indefinite" /></circle>
                <text x="800" y="385" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Mumbai</text>
              </g>

              {/* Americas */}
              <g filter="url(#glow)">
                <circle cx="120" cy="230" r="12" fill="url(#destGlow)" opacity="0.7"><animate attributeName="r" values="10;15;10" dur="4s" repeatCount="indefinite" /></circle>
                <circle cx="120" cy="230" r="6" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="4s" repeatCount="indefinite" /></circle>
                <text x="120" y="217" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="bold" style={{ textShadow: '0 0 12px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.7)' }}>New York</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="80" cy="210" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="4.2s" repeatCount="indefinite" /></circle>
                <circle cx="80" cy="210" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="4.2s" repeatCount="indefinite" /></circle>
                <text x="80" y="197" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Los Angeles</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="100" cy="290" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="4.5s" repeatCount="indefinite" /></circle>
                <circle cx="100" cy="290" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="4.5s" repeatCount="indefinite" /></circle>
                <text x="100" y="305" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Miami</text>
              </g>

              {/* Africa */}
              <g filter="url(#glow)">
                <circle cx="480" cy="410" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.3s" repeatCount="indefinite" /></circle>
                <circle cx="480" cy="410" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.3s" repeatCount="indefinite" /></circle>
                <text x="480" y="425" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Kahire</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="420" cy="480" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.5s" repeatCount="indefinite" /></circle>
                <circle cx="420" cy="480" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.5s" repeatCount="indefinite" /></circle>
                <text x="420" y="495" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Nairobi</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="340" cy="390" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.4s" repeatCount="indefinite" /></circle>
                <circle cx="340" cy="390" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" /></circle>
                <text x="340" y="377" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Kazablanka</text>
              </g>

              <g filter="url(#glow)">
                <circle cx="380" cy="500" r="10" fill="url(#destGlow)" opacity="0.6"><animate attributeName="r" values="8;12;8" dur="2.6s" repeatCount="indefinite" /></circle>
                <circle cx="380" cy="500" r="5" fill="#ffffff"><animate attributeName="opacity" values="0.7;1;0.7" dur="2.6s" repeatCount="indefinite" /></circle>
                <text x="380" y="515" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="500" style={{ textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 15px rgba(255, 255, 255, 0.6)' }}>Cape Town</text>
              </g>
              </g>
            </svg>

            <div className="absolute bottom-6 left-6 right-6 flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-3 px-5 py-3 bg-black/80 backdrop-blur-md rounded-2xl border border-white/40 shadow-lg shadow-white/30">
                <div className="relative">
                  <div className="w-4 h-4 rounded-full bg-white shadow-lg shadow-white/80 animate-pulse"></div>
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-white animate-ping opacity-75"></div>
                </div>
                <span className="text-white font-semibold tracking-wide">Ana Hub - İstanbul</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-black/80 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg shadow-white/20">
                <div className="relative">
                  <div className="w-3 h-3 rounded-full bg-white/90 shadow-lg shadow-white/70 animate-pulse"></div>
                  <div className="absolute inset-0 w-3 h-3 rounded-full bg-white/90 animate-ping opacity-75"></div>
                </div>
                <span className="text-white/90 font-medium">100+ Havalimanı</span>
              </div>
              <div className="flex items-center gap-3 px-5 py-3 bg-black/80 backdrop-blur-md rounded-2xl border border-white/30 shadow-lg shadow-white/20">
                <div className="relative w-14 h-1 rounded-full overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-r from-white/40 via-white to-white/40 animate-pulse"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/80 to-transparent animate-shimmer"></div>
                </div>
                <span className="text-white/90 font-medium">Aktif Rotalar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
