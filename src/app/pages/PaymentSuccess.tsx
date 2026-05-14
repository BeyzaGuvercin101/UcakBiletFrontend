import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { paymentService } from '../services/paymentService';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const location = useLocation();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  /** URLSearchParams referansı her render'da değişebildiği için location.search (string) kullan — aksi halde useEffect sonsuz döner. */
  const sessionId = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('session_id') || params.get('sessionId') || '';
  }, [location.search]);

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      toast.error('Ödeme oturumu bulunamadı (session_id eksik).');
      return;
    }

    let cancelled = false;

    paymentService
      .paymentSuccess(sessionId)
      .then(() => {
        if (cancelled) return;
        setStatus('ok');
        toast.success('Ödeme tamamlandı');
        // Önce başarılı durumu boyansın; navigate aynı render döngüsünde kalınca ekran "yükleniyor"da kalmış gibi görünebiliyor.
        window.setTimeout(() => {
          if (!cancelled) navigate('/my-tickets', { replace: true });
        }, 0);
      })
      .catch((error) => {
        if (cancelled) return;
        setStatus('error');
        const message = error instanceof Error ? error.message : 'Ödeme doğrulanamadı';
        toast.error(message);
      });

    return () => {
      cancelled = true;
    };
  }, [sessionId, navigate]);

  return (
    <Layout>
      <div className="mx-auto max-w-md py-16 px-4 text-center">
        {status === 'loading' && (
          <p className="text-muted-foreground">Ödeme sunucuda doğrulanıyor…</p>
        )}
        {status === 'ok' && (
          <>
            <p className="text-lg font-medium text-primary mb-2">Ödeme başarılı</p>
            <p className="text-sm text-muted-foreground mb-6">
              Biletlerinize yönlendiriliyorsunuz. Gitmezse aşağıdaki düğmeye basın.
            </p>
            <Button type="button" onClick={() => navigate('/my-tickets', { replace: true })}>
              Biletlerime git
            </Button>
          </>
        )}
        {status === 'error' && (
          <>
            <p className="text-destructive mb-6">Ödeme doğrulaması başarısız oldu veya oturum bilgisi eksik.</p>
            <Button type="button" onClick={() => navigate('/my-tickets')}>
              Biletlerime git
            </Button>
          </>
        )}
      </div>
    </Layout>
  );
}
