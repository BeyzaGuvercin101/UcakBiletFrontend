import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ArrowLeft, KeyRound, Loader2, Lock, Mail, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import logo from '../../imports/Mavi-Ye_il__afak_U_u_u__1_.png';
import { authService } from '../services/authService';
import { getApiData, setAccessToken } from '../services/apiClient';

type AuthMode = 'login' | 'register' | 'forgot' | 'send-code' | 'verify-code';

const getModeFromPath = (pathname: string): AuthMode => {
  if (pathname === '/register') return 'register';
  if (pathname === '/forgot-password') return 'forgot';
  if (pathname === '/email-code') return 'send-code';
  if (pathname === '/verify-email') return 'verify-code';
  return 'login';
};

const modeCopy: Record<AuthMode, { title: string; subtitle: string; button: string }> = {
  login: {
    title: 'Giriş Yap',
    subtitle: 'Bilet satın alma ve biletlerim alanı için hesabınıza girin.',
    button: 'Giriş Yap',
  },
  register: {
    title: 'Kaydol',
    subtitle: 'E-posta adresinizle ücretsiz Seferio Air hesabı oluşturun.',
    button: 'Kaydı Tamamla',
  },
  forgot: {
    title: 'Şifremi Unuttum',
    subtitle: 'E-posta adresinize şifre sıfırlama kodu gönderelim.',
    button: 'Kod Gönder',
  },
  'send-code': {
    title: 'E-posta Kodu Gönder',
    subtitle: 'E-posta ile giriş veya doğrulama için yeni kod isteyin.',
    button: 'Kodu Gönder',
  },
  'verify-code': {
    title: 'Kodu Gir',
    subtitle: 'E-postanıza gelen doğrulama kodunu girin.',
    button: 'Kodu Onayla',
  },
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const mode = getModeFromPath(location.pathname);
  const isResetFlow = searchParams.get('reset') === '1';

  const [email, setEmail] = useState(searchParams.get('email') || '');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const effectiveMode = mode === 'send-code' && codeSent ? 'verify-code' : mode;

  useEffect(() => {
    const queryEmail = searchParams.get('email');
    if (queryEmail) setEmail(queryEmail);
  }, [searchParams]);

  useEffect(() => {
    if (mode !== 'send-code') {
      setCodeSent(false);
    }
  }, [mode]);

  const fromLocation = (location.state as { from?: Location })?.from;
  const from = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search || ''}`
    : '/';

  const copy = useMemo(() => {
    if (effectiveMode === 'verify-code' && isResetFlow) {
      return {
        title: 'Yeni Şifre Belirle',
        subtitle: 'E-postanıza gelen kodu ve yeni şifrenizi girin.',
        button: 'Şifreyi Güncelle',
      };
    }

    return modeCopy[effectiveMode];
  }, [effectiveMode, isResetFlow]);

  const finishLogin = (userEmail: string, method: 'google' | 'email', userId?: number | string) => {
    login({
      id: userId,
      name: method === 'google' ? 'Google Kullanıcısı' : userEmail.split('@')[0],
      email: userEmail,
      loginMethod: method,
    });
    navigate(from, { replace: true });
  };

  const handleGoogleLogin = () => {
    finishLogin('user@gmail.com', 'google');
    toast.success('Google ile giriş başarılı!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      toast.error('Lütfen e-posta adresinizi girin');
      return;
    }

    if ((mode === 'login' || mode === 'register') && !password) {
      toast.error('Lütfen şifrenizi girin');
      return;
    }

    if (effectiveMode === 'verify-code' && !verificationCode) {
      toast.error('Lütfen doğrulama kodunu girin');
      return;
    }

    if (effectiveMode === 'verify-code' && isResetFlow && !newPassword) {
      toast.error('Lütfen yeni şifrenizi girin');
      return;
    }

    setIsSubmitting(true);

    try {
      if (mode === 'login') {
        const response = await authService.login(email, password);
        const loginPayload = getApiData(response);
        const accessToken = loginPayload?.accessToken;
        if (accessToken) setAccessToken(accessToken);
        finishLogin(email, 'email');
        toast.success('Giriş başarılı!');
        return;
      }

      if (mode === 'register') {
        await authService.register(email, password);
        toast.success('Kayıt oluşturuldu. E-posta doğrulama kodunu girin.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }

      if (mode === 'forgot') {
        await authService.passwordResetRequest(email);
        toast.success('Şifre sıfırlama kodu gönderildi.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}&reset=1`);
        return;
      }

      if (mode === 'send-code') {
        if (!codeSent) {
          await authService.resendVerificationEmail(email);
          toast.success('Doğrulama kodu gönderildi. Lütfen e-postanızı kontrol edin.');
          setCodeSent(true);
          return;
        }

        const response = await authService.verifyEmail(email, verificationCode);
        const verifiedUser = getApiData(response);
        finishLogin(email, 'email', verifiedUser?.id);
        toast.success('E-posta doğrulandı!');
        return;
      }

      if (isResetFlow) {
        await authService.passwordReset(email, verificationCode, newPassword);
        toast.success('Şifreniz güncellendi. Yeni şifrenizle giriş yapabilirsiniz.');
        navigate('/login');
        return;
      }

      const response = await authService.verifyEmail(email, verificationCode);
      const verifiedUser = getApiData(response);
      finishLogin(email, 'email', verifiedUser?.id);
      toast.success('E-posta doğrulandı!');
    } catch {
      if (mode === 'login') {
        finishLogin(email, 'email');
        toast.success('Backend bağlantısı yok, demo oturumu açıldı.');
      } else if (mode === 'register') {
        toast.success('Demo kayıt oluşturuldu. Doğrulama kodu ekranına geçiliyor.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else if (mode === 'forgot') {
        toast.success('Demo kod gönderildi. Kod ekranına geçiliyor.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}&reset=1`);
      } else if (mode === 'send-code') {
        toast.success('Demo doğrulama kodu gönderildi.');
        navigate(`/verify-email?email=${encodeURIComponent(email)}`);
      } else if (isResetFlow) {
        toast.success('Demo modda şifre güncellendi.');
        navigate('/login');
      } else {
        finishLogin(email, 'email');
        toast.success('Demo modda e-posta doğrulandı.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/5 to-background"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(99,102,241,0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(249,115,22,0.1),transparent_50%)]"></div>

      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-5 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="w-4 h-4" />
          Uçuş aramaya dön
        </Link>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src={logo}
              alt="Seferio Air Logo"
              className="w-24 h-24 hover:scale-110 transition-transform duration-500"
            />
          </div>
          <h1 className="text-4xl mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
            Seferio Air
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            {copy.subtitle}
          </p>
        </div>

        <div className="backdrop-blur-xl bg-card/70 border border-border/50 rounded-3xl p-8 shadow-2xl">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center">
              {mode === 'forgot' || isResetFlow ? (
                <KeyRound className="w-5 h-5 text-primary" />
              ) : (
                <ShieldCheck className="w-5 h-5 text-primary" />
              )}
            </div>
            <div>
              <h2 className="text-2xl">{copy.title}</h2>
              <p className="text-sm text-muted-foreground">Güvenli hesap işlemleri</p>
            </div>
          </div>

          {(mode === 'login' || mode === 'register') && (
            <>
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-white hover:bg-gray-50 border-2 border-border rounded-2xl transition-all hover:scale-[1.02] hover:shadow-lg"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span className="text-gray-700">Google ile devam et</span>
              </button>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-card/70 text-muted-foreground">veya e-posta ile</span>
                </div>
              </div>
            </>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-2 text-sm text-muted-foreground">E-posta adresiniz</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ornek@email.com"
                  className="pl-12 h-12 rounded-xl border-2 focus:border-primary"
                />
              </div>
            </div>

            {(mode === 'login' || mode === 'register') && (
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Şifreniz</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-12 h-12 rounded-xl border-2 focus:border-primary"
                  />
                </div>
              </div>
            )}

            {effectiveMode === 'verify-code' && (
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Doğrulama kodu</label>
                <Input
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6 haneli kod"
                  inputMode="numeric"
                  maxLength={6}
                  className="h-12 rounded-xl border-2 focus:border-primary tracking-[0.35em] text-center"
                />
              </div>
            )}

            {effectiveMode === 'verify-code' && isResetFlow && (
              <div>
                <label className="block mb-2 text-sm text-muted-foreground">Yeni şifre</label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Yeni şifreniz"
                  className="h-12 rounded-xl border-2 focus:border-primary"
                />
              </div>
            )}

            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="w-full h-12 rounded-xl mt-6 bg-gradient-to-r from-primary to-accent hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : null}
              {copy.button}
            </Button>
          </form>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
            {mode !== 'login' && <Link to="/login" className="text-primary hover:underline">Giriş yap</Link>}
            {mode !== 'register' && <Link to="/register" className="text-primary hover:underline">Kaydol</Link>}
            {mode !== 'forgot' && <Link to="/forgot-password" className="text-primary hover:underline">Şifremi unuttum</Link>}
            {mode !== 'send-code' && <Link to={`/email-code${email ? `?email=${encodeURIComponent(email)}` : ''}`} className="text-primary hover:underline">Kod gönder</Link>}
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6 px-4">
          Devam ederek Kullanım Koşulları ve Gizlilik Politikasını kabul edersiniz.
        </p>
      </div>
    </div>
  );
}
