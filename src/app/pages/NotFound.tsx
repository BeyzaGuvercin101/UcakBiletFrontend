import { useNavigate } from 'react-router';
import Layout from '../components/Layout';
import { Button } from '../components/ui/Button';
import { Home, ArrowLeft, Plane } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <Layout>
      <div className="text-center py-20">
        <div className="relative inline-block mb-8">
          <div className="text-9xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            404
          </div>
          <Plane className="absolute -top-8 -right-12 w-16 h-16 text-primary/20 rotate-45" />
        </div>
        <h2 className="mb-4 text-3xl">Kaybolmuş gibisiniz</h2>
        <p className="text-muted-foreground mb-10 max-w-md mx-auto text-lg">
          Aradığınız sayfa mevcut değil veya başka bir yere taşınmış olabilir.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri Dön
          </Button>
          <Button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent"
          >
            <Home className="w-4 h-4" />
            Ana Sayfaya Git
          </Button>
        </div>
      </div>
    </Layout>
  );
}
