import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import * as AlertDialog from '@radix-ui/react-alert-dialog';
import { Plane, Calendar, User, Mail, Ticket, AlertTriangle, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getApiData } from '../services/apiClient';
import { ticketService, type TicketDto } from '../services/ticketService';
import QRCode from 'qrcode';

interface TicketType {
  id: string;
  airline: string;
  from: string;
  to: string;
  departTime: string;
  arriveTime: string;
  date: string;
  price: number;
  passenger: string;
  email: string;
  pnr: string;
  purchaseDate: string;
  phone?: string;
  identityType?: string;
  identityNumber?: string;
  class?: string;
  seat?: string;
  baggage?: string;
  entertainment?: string;
  checkedIn?: boolean;
  checkInTime?: string;
}

const formatBackendTime = (dateTime?: string) => {
  if (!dateTime) return '--:--';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
};

const formatBackendDate = (dateTime?: string) => {
  if (!dateTime) return '';
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const mapBackendTicket = (ticket: TicketDto): TicketType | null => {
  const flight = ticket.flight;
  if (!flight) return null;

  return {
    id: String(ticket.id),
    airline: flight.airline,
    from: flight.departure,
    to: flight.arrival,
    departTime: formatBackendTime(flight.departureTime),
    arriveTime: formatBackendTime(flight.arrivalTime),
    date: formatBackendDate(flight.departureTime),
    price: Number(ticket.price || flight.price || 0),
    passenger: String(ticket.passengerName || ticket.passenger || 'Yolcu'),
    email: String(ticket.passengerEmail || ticket.email || ''),
    phone: ticket.passengerPhone ? String(ticket.passengerPhone) : undefined,
    pnr: String(ticket.pnr || ticket.id),
    seat: ticket.seatNo ? String(ticket.seatNo) : undefined,
    purchaseDate: String(ticket.createTime || new Date().toISOString()),
  };
};

export default function MyTickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [refundingTicket, setRefundingTicket] = useState<TicketType | null>(null);
  const [checkingInTicket, setCheckingInTicket] = useState<TicketType | null>(null);
  const [showBoardingPass, setShowBoardingPass] = useState<TicketType | null>(null);  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  useEffect(() => {
    const storedTickets = JSON.parse(localStorage.getItem('tickets') || '[]');
    setTickets(storedTickets);

    if (!user?.id) return;

    ticketService.getTicketsByUser(user.id)
      .then((response) => {
        const backendTickets = getApiData(response);
        if (!Array.isArray(backendTickets)) return;

        const mappedTickets = backendTickets
          .map((ticket) => mapBackendTicket(ticket))
          .filter((ticket): ticket is TicketType => !!ticket);

        if (mappedTickets.length) {
          setTickets(mappedTickets);
        }
      })
      .catch(() => {
        setTickets(storedTickets);
      });
  }, [user?.id]);

  const formatLocation = (location: string) => {
    if (location.includes('(ALL)')) {
      return location.replace(' (ALL)', ' - Tüm Havaalanları');
    }
    return location;
  };

  const getTimeUntilFlight = (ticket: TicketType) => {
    const flightDateTime = new Date(`${ticket.date}T${ticket.departTime}:00`);

    if (Number.isNaN(flightDateTime.getTime())) {
      return 'Tarih bekleniyor';
    }

    const diffMs = flightDateTime.getTime() - Date.now();

    if (diffMs <= 0) {
      return 'Uçuş zamanı geldi';
    }

    const totalMinutes = Math.floor(diffMs / 60000);
    const days = Math.floor(totalMinutes / 1440);
    const hours = Math.floor((totalMinutes % 1440) / 60);
    const minutes = totalMinutes % 60;

    if (days > 0) {
      return `${days} gün ${hours} saat`;
    }

    if (hours > 0) {
      return `${hours} saat ${minutes} dk`;
    }

    return `${minutes} dk`;
  };

  const canCheckIn = (ticket: TicketType) => {
    if (ticket.checkedIn) return false;

    const flightDateTime = new Date(`${ticket.date}T${ticket.departTime}:00`);
    if (Number.isNaN(flightDateTime.getTime())) return false;

    const diffMs = flightDateTime.getTime() - Date.now();
    const hoursUntilFlight = diffMs / (1000 * 60 * 60);

    // Uçuştan 24 saat önce açılır, uçuşa 2 saat kala kapanır
    return hoursUntilFlight <= 24 && hoursUntilFlight > 2;
  };

  const handleCheckIn = (ticket: TicketType) => {
    setCheckingInTicket(ticket);
  };

  const confirmCheckIn = () => {
    if (!checkingInTicket) return;

    const updatedTickets = tickets.map(t =>
      t.id === checkingInTicket.id
        ? { ...t, checkedIn: true, checkInTime: new Date().toISOString() }
        : t
    );

    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    setTickets(updatedTickets);

    toast.success('Check-in başarıyla tamamlandı!', {
      description: 'Biniş kartınız hazır.',
    });

    setCheckingInTicket(null);
    setShowBoardingPass(checkingInTicket);
    generateQRCode(checkingInTicket);
  };

  const generateQRCode = async (ticket: TicketType) => {
    try {
      const qrData = JSON.stringify({
        pnr: ticket.pnr,
        passenger: ticket.passengerName,
        flight: `${ticket.from} - ${ticket.to}`,
        date: ticket.departDate,
        time: ticket.departTime,
        seat: ticket.seatNumber || 'Otomatik',
        airline: ticket.airline
      });

      const url = await QRCode.toDataURL(qrData, {
        width: 256,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeUrl(url);
    } catch (error) {
      console.error('QR code generation error:', error);
      toast.error('QR kod oluşturulurken hata oluştu');
    }
  };

  const handleShowBoardingPass = (ticket: TicketType) => {
    setShowBoardingPass(ticket);
  };

  const handleRefund = (ticket: TicketType) => {
    setRefundingTicket(ticket);
  };

  const confirmRefund = () => {
    if (!refundingTicket) return;

    const updatedTickets = tickets.filter(t => t.id !== refundingTicket.id);
    localStorage.setItem('tickets', JSON.stringify(updatedTickets));
    setTickets(updatedTickets);

    toast.success('Bilet iadesi başarıyla tamamlandı', {
      description: `İade tutarı 3-5 iş günü içinde hesabınıza yansıyacaktır.`,
    });

    setRefundingTicket(null);
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="mb-2 text-3xl flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                <Ticket className="w-7 h-7 text-white" />
              </div>
              Biletlerim
            </h2>
            <p className="text-muted-foreground">Tüm uçuş biletlerinizi buradan yönetin</p>
          </div>
        </div>

        {tickets.length === 0 ? (
          <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-3xl p-16 text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-primary/10 to-accent/10 rounded-3xl flex items-center justify-center">
              <Ticket className="w-12 h-12 text-primary" />
            </div>
            <h3 className="mb-3 text-2xl">Henüz biletiniz yok</h3>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">
              Dünya genelinde binlerce destinasyona uygun fiyatlarla uçun
            </p>
            <Button onClick={() => window.location.href = '/'} size="lg" className="bg-gradient-to-r from-primary to-accent">
              Uçuş Ara
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {tickets.map((ticket) => (
              <div key={ticket.id} className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-3xl overflow-hidden hover:shadow-2xl transition-all">
                <div className="bg-gradient-to-r from-primary/5 to-accent/5 px-6 py-4 border-b border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                        <Plane className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">PNR Kodu</div>
                        <div className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          {ticket.pnr}
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-2 bg-card border border-border/50 rounded-xl">
                      {ticket.airline}
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  <div className="flex-1 space-y-6">

                    <div className="flex items-center gap-8 mb-6">
                      <div className="flex-1">
                        <div className="text-center">
                          <div className="text-3xl mb-1">{ticket.departTime}</div>
                          <div className="text-sm text-muted-foreground">{formatLocation(ticket.from)}</div>
                        </div>
                      </div>
                      <div className="flex-1 flex flex-col items-center">
                        <div className="w-full relative flex items-center mb-2">
                          <div className="h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 rounded-full w-full"></div>
                          <Plane className="absolute left-1/2 -translate-x-1/2 w-6 h-6 text-primary rotate-90 bg-background" />
                        </div>
                        <div className="text-xs text-muted-foreground px-3 py-1 bg-muted rounded-full">
                          Direkt Uçuş
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="text-center">
                          <div className="text-3xl mb-1">{ticket.arriveTime}</div>
                          <div className="text-sm text-muted-foreground">{formatLocation(ticket.to)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/50 rounded-2xl">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Tarih
                        </div>
                        <div>{ticket.date}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Uçuşa Kalan Süre
                        </div>
                        <div className="font-medium text-primary">{getTimeUntilFlight(ticket)}</div>
                      </div>

                      <div>
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Yolcu
                        </div>
                        <div className="truncate">{ticket.passenger}</div>
                      </div>

                      {ticket.identityType && ticket.identityNumber && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            {ticket.identityType}
                          </div>
                          <div className="font-mono text-sm">{ticket.identityNumber}</div>
                        </div>
                      )}

                      {ticket.class && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Sınıf
                          </div>
                          <div className="font-medium text-primary">{ticket.class}</div>
                        </div>
                      )}

                      {ticket.seat && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Koltuk
                          </div>
                          <div className="font-medium">{ticket.seat}</div>
                        </div>
                      )}

                      {ticket.baggage && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Bagaj
                          </div>
                          <div className="text-sm truncate">{ticket.baggage}</div>
                        </div>
                      )}

                      {ticket.entertainment && ticket.entertainment !== 'Yok' && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">
                            Eğlence
                          </div>
                          <div className="text-sm truncate">{ticket.entertainment}</div>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 grid md:grid-cols-2 gap-3">
                      <div className="p-3 bg-muted/30 rounded-xl">
                        <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          E-posta
                        </div>
                        <div className="text-sm truncate">{ticket.email}</div>
                      </div>
                      {ticket.phone && (
                        <div className="p-3 bg-muted/30 rounded-xl">
                          <div className="text-xs text-muted-foreground mb-1">
                            Telefon
                          </div>
                          <div className="text-sm">{ticket.phone}</div>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-6 p-4 bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl border border-border/50">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Ödenen Tutar</div>
                        <div className="text-3xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                          ₺{ticket.price.toLocaleString('tr-TR')}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        {ticket.checkedIn ? (
                          <Button
                            onClick={() => handleShowBoardingPass(ticket)}
                            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 rounded-xl"
                          >
                            Biniş Kartı
                          </Button>
                        ) : canCheckIn(ticket) ? (
                          <Button
                            onClick={() => handleCheckIn(ticket)}
                            className="bg-gradient-to-r from-primary to-accent rounded-xl"
                          >
                            Check-in Yap
                          </Button>
                        ) : (
                          <div className="px-4 py-2 bg-muted text-muted-foreground rounded-xl text-sm">
                            {getTimeUntilFlight(ticket) === 'Uçuş zamanı geldi' ? 'Check-in Kapandı' : 'Check-in uçuştan 24 saat önce açılır'}
                          </div>
                        )}

                        <Button
                          variant="destructive"
                          onClick={() => handleRefund(ticket)}
                          className="rounded-xl"
                        >
                          İade Et
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <AlertDialog.Root
          open={!!refundingTicket}
          onOpenChange={(open) => !open && setRefundingTicket(null)}
        >
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border/50 rounded-3xl p-8 w-full max-w-md z-50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-destructive/20 to-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-7 h-7 text-destructive" />
                </div>
                <AlertDialog.Title className="text-2xl">
                  Bilet İadesi
                </AlertDialog.Title>
              </div>

              <AlertDialog.Description asChild>
                <div className="text-muted-foreground mb-6">
                  <p className="mb-4">
                    <strong className="text-foreground text-lg">{refundingTicket?.pnr}</strong> PNR numaralı
                    biletinizi iade etmek istediğinizden emin misiniz?
                  </p>
                  <div className="p-4 bg-gradient-to-br from-muted/50 to-transparent rounded-2xl border border-border/50 text-sm">
                    <p className="mb-3 text-foreground">
                      İade koşulları:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                        <span>İade tutarı 3-5 iş günü içinde hesabınıza yansıyacaktır</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                        <span>Uçuştan 24 saat öncesine kadar tam iade</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                        <span>24 saat içinde %20 kesinti uygulanır</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </AlertDialog.Description>

              <div className="flex gap-3">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" className="flex-1 h-12">
                    Vazgeç
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    variant="destructive"
                    className="flex-1 h-12"
                    onClick={confirmRefund}
                  >
                    İade Et
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>

        <AlertDialog.Root
          open={!!checkingInTicket}
          onOpenChange={(open) => !open && setCheckingInTicket(null)}
        >
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border/50 rounded-3xl p-8 w-full max-w-md z-50 shadow-2xl">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 flex items-center justify-center">
                  <Plane className="w-7 h-7 text-primary" />
                </div>
                <AlertDialog.Title className="text-2xl">
                  Check-in Onayı
                </AlertDialog.Title>
              </div>

              <AlertDialog.Description asChild>
                <div className="text-muted-foreground mb-6">
                  <p className="mb-4">
                    <strong className="text-foreground text-lg">{checkingInTicket?.pnr}</strong> PNR numaralı
                    biletiniz için check-in yapmak istediğinizden emin misiniz?
                  </p>
                  <div className="p-4 bg-gradient-to-br from-muted/50 to-transparent rounded-2xl border border-border/50 text-sm">
                    <p className="mb-3 text-foreground">
                      Check-in sonrası:
                    </p>
                    <ul className="space-y-2">
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                        <span>Biniş kartınız oluşturulacak</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                        <span>Koltuk değişikliği yapılamaz</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                        <span>İade işlemi yapılamaz</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5"></div>
                        <span>Uçuşa 2 saat kala check-in kapanır</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </AlertDialog.Description>

              <div className="flex gap-3">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" className="flex-1 h-12">
                    Vazgeç
                  </Button>
                </AlertDialog.Cancel>
                <AlertDialog.Action asChild>
                  <Button
                    className="flex-1 h-12 bg-gradient-to-r from-primary to-accent"
                    onClick={confirmCheckIn}
                  >
                    Check-in Yap
                  </Button>
                </AlertDialog.Action>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>

        <AlertDialog.Root
          open={!!showBoardingPass}
          onOpenChange={(open) => !open && setShowBoardingPass(null)}
        >
          <AlertDialog.Portal>
            <AlertDialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50" />
            <AlertDialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-card border border-border/50 rounded-3xl p-8 w-full max-w-2xl z-50 shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="text-center mb-6">
                <AlertDialog.Title className="text-3xl mb-2">
                  Biniş Kartı
                </AlertDialog.Title>
                <p className="text-muted-foreground">Check-in başarıyla tamamlandı</p>
              </div>

              {showBoardingPass && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-r from-primary/5 to-accent/5 rounded-2xl p-6 border border-border/50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center">
                          <Plane className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">PNR Kodu</div>
                          <div className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-bold">
                            {showBoardingPass.pnr}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground">Check-in Zamanı</div>
                        <div className="text-sm">
                          {showBoardingPass.checkInTime ? new Date(showBoardingPass.checkInTime).toLocaleString('tr-TR') : 'Şimdi'}
                        </div>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Kalkış</div>
                        <div className="text-2xl font-bold">{showBoardingPass.departTime}</div>
                        <div className="text-sm text-muted-foreground">{formatLocation(showBoardingPass.from)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Varış</div>
                        <div className="text-2xl font-bold">{showBoardingPass.arriveTime}</div>
                        <div className="text-sm text-muted-foreground">{formatLocation(showBoardingPass.to)}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-sm text-muted-foreground mb-1">Tarih</div>
                        <div className="text-lg font-bold">{showBoardingPass.date}</div>
                        <div className="text-sm text-muted-foreground">{showBoardingPass.airline}</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border/50">
                      <div>
                        <div className="text-sm text-muted-foreground mb-1">Yolcu Adı</div>
                        <div className="text-lg font-bold">{showBoardingPass.passenger}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-muted-foreground mb-1">Koltuk No</div>
                        <div className="text-lg font-bold">{showBoardingPass.seat || 'Otomatik'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-6">
                    <div className="flex-1 bg-white p-4 rounded-xl border border-border/50">
                      <div className="text-center text-gray-800">
                        <div className="text-sm mb-2">QR Kod</div>
                        {qrCodeUrl ? (
                          <img
                            src={qrCodeUrl}
                            alt="Boarding Pass QR Code"
                            className="w-32 h-32 mx-auto border-2 border-gray-300 rounded-lg"
                          />
                        ) : (
                          <div className="w-32 h-32 mx-auto bg-gray-100 border-2 border-gray-300 rounded-lg flex items-center justify-center">
                            <div className="text-xs text-gray-500 text-center">
                              QR Kod<br/>Yükleniyor...
                            </div>
                          </div>
                        )}
                        <div className="text-xs mt-2 text-gray-600">
                          {showBoardingPass.pnr}
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Kapı No</div>
                        <div className="text-lg font-bold">A12</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Sınıf</div>
                        <div className="text-lg font-bold">{showBoardingPass.class || 'Ekonomi'}</div>
                      </div>
                      <div className="p-3 bg-muted/50 rounded-lg">
                        <div className="text-sm text-muted-foreground mb-1">Bagaj</div>
                        <div className="text-sm">{showBoardingPass.baggage || '1 parça el bagajı'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="text-center text-sm text-muted-foreground p-4 bg-muted/30 rounded-xl">
                    <p>Bu biniş kartını yanınızda bulundurun ve check-in masasına ibraz edin.</p>
                    <p className="mt-1">Uçuş saatinden 2 saat önce havaalanında olun.</p>
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <AlertDialog.Cancel asChild>
                  <Button variant="outline" className="px-8">
                    Kapat
                  </Button>
                </AlertDialog.Cancel>
              </div>
            </AlertDialog.Content>
          </AlertDialog.Portal>
        </AlertDialog.Root>
      </div>
    </Layout>
  );
}
