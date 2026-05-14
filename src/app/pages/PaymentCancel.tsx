import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { paymentService } from '../services/paymentService';
import { toast } from 'sonner';
import { AlertTriangle, ArrowLeft, Plane } from 'lucide-react';

export default function PaymentCancel() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'cancelled' | 'error'>('loading');

  const reservationId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('reservationId') || params.get('reservation_id') || '';
  }, [location.search]);

  useEffect(() => {
    let cancelled = false;

    if (!reservationId) {
      setStatus('cancelled');
      toast.info('Ödeme iptal edildi.');
      return () => {
        cancelled = true;
      };
    }

    paymentService
      .paymentCancel(reservationId)
      .then(() => {
        if (cancelled) return;
        setStatus('cancelled');
        toast.info('Ödeme iptal edildi.');
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus('error');
        const message = error instanceof Error ? error.message : 'Ödeme iptal edilemedi';
        toast.error(message);
      });

    return () => {
      cancelled = true;
    };
  }, [reservationId]);

  return (
    <Layout>
      <div className="mx-auto max-w-md py-16 px-4 text-center">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-10 w-10 text-destructive" />
          </div>
        </div>

        {status === 'loading' && (
          <p className="text-muted-foreground">Ödeme iptal durumu doğrulanıyor…</p>
        )}

        {status === 'cancelled' && (
          <>
            <p className="text-lg font-medium text-destructive mb-2">Ödeme iptal edildi</p>
            <p className="text-sm text-muted-foreground mb-6">
              Dilerseniz yeni bir uçuş seçip tekrar deneyebilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button type="button" variant="outline" onClick={() => navigate('/flights', { replace: true })}>
                <Plane className="mr-2 h-4 w-4" />
                Uçuşlara dön
              </Button>
              <Button type="button" onClick={() => navigate('/my-tickets', { replace: true })}>
                Biletlerime git
              </Button>
            </div>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-lg font-medium text-destructive mb-2">İptal doğrulanamadı</p>
            <p className="text-sm text-muted-foreground mb-6">
              Yine de rezervasyon tamamlanmadıysa uçuşlara dönüp yeniden deneyebilirsiniz.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Geri dön
              </Button>
              <Button type="button" onClick={() => navigate('/flights', { replace: true })}>
                Uçuşlara git
              </Button>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
