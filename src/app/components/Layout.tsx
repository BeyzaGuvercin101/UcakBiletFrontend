import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Plane, Ticket, LogOut, User, MapPin, Mail, Phone, Globe } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/Button';
import * as Popover from '@radix-ui/react-popover';
import { toast } from 'sonner';
import logo from '../../imports/Mavi-Ye_il__afak_U_u_u__1_.png';
import { authService } from '../services/authService';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Logout backend hatası olsa bile, frontend'de çıkış yap
      const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
      // Bağlantı sorunu değilse ve hata varsa uyar, ama yine çık
      if (!errorMessage.toLowerCase().includes('bağlantı') && !errorMessage.toLowerCase().includes('fetch')) {
        toast.error('Çıkış işlemi tamamlanamadı, ama oturumunuz kapatılıyor.');
      }
    } finally {
      logout();
      toast.success('Çıkış yapıldı');
      navigate('/');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="backdrop-blur-xl bg-card/70 border-b border-border/50 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity group">
              <img
                src={logo}
                alt="Seferio Air Logo"
                className="w-10 h-10 group-hover:scale-110 transition-transform"
              />
              <h1 className="text-2xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Seferio Air</h1>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/"
                className={`px-4 py-2 rounded-xl transition-all hover:bg-muted ${
                  location.pathname === '/' ? 'bg-muted text-primary' : 'text-foreground'
                }`}
              >
                Uçuş Ara
              </Link>
              {isAuthenticated ? (
                <>
                  <Link
                    to="/my-tickets"
                    className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all hover:bg-muted ${
                      location.pathname === '/my-tickets' ? 'bg-muted text-primary' : 'text-foreground'
                    }`}
                  >
                    <Ticket className="w-4 h-4" />
                    Biletlerim
                  </Link>

                  <Popover.Root>
                    <Popover.Trigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-colors ml-2">
                        <div className="w-9 h-9 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <span className="hidden md:inline text-foreground">{user?.name}</span>
                      </button>
                    </Popover.Trigger>
                    <Popover.Portal>
                      <Popover.Content
                        className="backdrop-blur-xl bg-card/95 border border-border/50 rounded-2xl shadow-2xl p-4 min-w-[240px] z-50"
                        sideOffset={8}
                      >
                        <div className="space-y-3">
                          <div className="pb-3 border-b border-border/50">
                            <p className="text-xs text-muted-foreground mb-1">Hesap</p>
                            <p className="truncate">{user?.email}</p>
                          </div>
                          <button
                            onClick={handleLogout}
                            className="flex items-center gap-2 w-full px-3 py-2.5 text-destructive hover:bg-destructive/10 rounded-xl transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Çıkış Yap
                          </button>
                        </div>
                      </Popover.Content>
                    </Popover.Portal>
                  </Popover.Root>
                </>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="flex items-center gap-2 bg-gradient-to-r from-primary to-accent ml-2"
                >
                  <User className="w-4 h-4" />
                  Giriş Yap
                </Button>
              )}
            </nav>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>

      <footer className="backdrop-blur-xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border-t border-border/50 mt-20">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
            {/* Seferio Air Hakkında */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={logo}
                  alt="Seferio Air Logo"
                  className="w-10 h-10"
                />
                <h3 className="text-xl bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent font-semibold">Seferio Air</h3>
              </div>
              <p className="text-muted-foreground text-sm mb-4">
                Dünya genelinde 40+ destinasyona güvenli ve konforlu uçuş deneyimi sunuyoruz.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-9 h-9 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Globe className="w-4 h-4 text-primary" />
                </a>
                <a href="#" className="w-9 h-9 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </a>
                <a href="#" className="w-9 h-9 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                </a>
              </div>
            </div>

            {/* Popüler Destinasyonlar */}
            <div>
              <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                Popüler Destinasyonlar
              </h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">İstanbul, Türkiye</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Dubai, BAE</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Paris, Fransa</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Londra, İngiltere</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">Tokyo, Japonya</a></li>
                <li><a href="#" className="text-muted-foreground hover:text-primary transition-colors">New York, ABD</a></li>
              </ul>
            </div>

            {/* Uçtuğumuz Bölgeler */}
            <div>
              <h4 className="text-white font-semibold mb-4">Uçtuğumuz Bölgeler</h4>
              <ul className="space-y-2 text-sm">
                <li className="text-muted-foreground">🇹🇷 Türkiye - 5 Şehir</li>
                <li className="text-muted-foreground">🇪🇺 Avrupa - 8 Ülke</li>
                <li className="text-muted-foreground">🌍 Orta Doğu - 9 Ülke</li>
                <li className="text-muted-foreground">🌏 Asya - 10 Ülke</li>
                <li className="text-muted-foreground">🌎 Amerika - 3 Şehir</li>
                <li className="text-muted-foreground">🌍 Afrika - 4 Ülke</li>
              </ul>
            </div>

            {/* İletişim */}
            <div>
              <h4 className="text-white font-semibold mb-4">İletişim</h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Rezervasyon: +90 850 123 45 67</p>
                    <p className="text-xs">7/24 Müşteri Hizmetleri</p>
                  </div>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p>info@seferioair.com</p>
                    <p className="text-xs">Destek ekibimiz her zaman hazır</p>
                  </div>
                </li>
                <li className="flex items-start gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p>Atatürk Havalimanı</p>
                    <p className="text-xs">İstanbul, Türkiye</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* Alt Bilgi */}
          <div className="border-t border-border/50 pt-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
              <p>&copy; 2026 Seferio Air. Tüm hakları saklıdır.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-primary transition-colors">Gizlilik Politikası</a>
                <a href="#" className="hover:text-primary transition-colors">Kullanım Koşulları</a>
                <a href="#" className="hover:text-primary transition-colors">Çerez Politikası</a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
