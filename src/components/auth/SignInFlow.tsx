import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { AuthStepIndicator } from './AuthStepIndicator';
import { useNetworkStatus } from '@/hooks/use-network-status';
import type { Session } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { Logo } from '@/components/Logo';

const OTP_CODE = '123456';

const formatTime = (seconds: number) => {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = Math.floor(seconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${secs}`;
};

type SignInStep = 'contact' | 'otp';

type SignInFlowProps = {
  onAuthenticated: (session: Session) => void;
};

export const SignInFlow = ({ onAuthenticated }: SignInFlowProps) => {
  const { t } = useI18n();
  const isOnline = useNetworkStatus();

  const [step, setStep] = useState<SignInStep>('contact');
  const [contact, setContact] = useState('');
  const [contactError, setContactError] = useState('');
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [timeLeft, setTimeLeft] = useState(30);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    if (step !== 'otp') return;
    if (timeLeft <= 0) return;
    const interval = window.setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [step, timeLeft]);

  useEffect(() => {
    if (step === 'contact') {
      setCode('');
      setCodeError('');
    }
  }, [step]);

  const handleSendCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isOnline) return;
    const trimmed = contact.trim();
    if (!trimmed) {
      setContactError(t('auth.contactHint'));
      return;
    }
    setContactError('');
    setStep('otp');
    setTimeLeft(30);
    setCode('');
    setCodeError('');
    if (!hasStarted) {
      trackEvent('auth_start', { method: 'otp' });
      setHasStarted(true);
    }
    trackEvent('auth_code_sent', { method: 'otp' });
  };

  const handleVerifyCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const sanitized = code.replace(/\D/g, '');
    if (sanitized.length !== 6) return;
    if (sanitized !== OTP_CODE) {
      setCodeError(t('auth.wrongCode'));
      trackEvent('auth_fail', { method: 'otp' });
      return;
    }

    const session: Session = {
      userId: 'demo-user',
      displayName: 'Demo Trader',
      contact: contact.trim(),
      role: 'buyer',
      hasSelectedRole: false,
      verifiedImporter: false,
    };

    trackEvent('auth_success', { method: 'otp' });
    onAuthenticated(session);
  };

  const canResend = useMemo(() => timeLeft <= 0, [timeLeft]);

  const handleResend = () => {
    if (!canResend) return;
    setTimeLeft(30);
    setCode('');
    setCodeError('');
    trackEvent('auth_code_sent', { method: 'otp', reason: 'resend' });
  };

  const handleDemo = () => {
    const demoSession: Session = {
      userId: 'demo-importer',
      displayName: 'Demo Importer',
      contact: 'demo@prolist',
      role: 'importer',
      hasSelectedRole: true,
      verifiedImporter: true,
    };
    trackEvent('auth_success', { method: 'demo' });
    trackEvent('role_select', { role: 'importer', source: 'demo' });
    onAuthenticated(demoSession);
  };

  return (
    <main className="relative min-h-dvh overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/80 via-white/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6 py-12">
        <div className="glass-card w-full space-y-6 px-6 py-8">
          {!isOnline && (
            <div className="pill bg-amber-100/80 text-amber-700 shadow-soft normal-case">
              {t('auth.offlineBanner')}
            </div>
          )}

          <div className="flex flex-col items-center gap-4 text-center">
            <Logo wrapperClassName="h-12 w-12 drop-shadow-[0_18px_40px_-16px_rgba(15,191,109,0.45)]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">{t('app.tagline')}</p>
              <h1 className="text-3xl font-semibold tracking-tight">{t('auth.welcome')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('auth.intro')}</p>
            </div>
          </div>

          <AuthStepIndicator current={step === 'otp' ? 'otp' : 'contact'} />

          {step === 'contact' && (
            <form className="space-y-5" onSubmit={handleSendCode}>
              <div className="space-y-2">
                <Label htmlFor="contact" className="text-sm font-semibold text-muted-foreground">
                  {t('auth.contactLabel')}
                </Label>
                <Input
                  id="contact"
                  type="text"
                  inputMode="text"
                  value={contact}
                  onChange={event => setContact(event.target.value)}
                  placeholder={t('auth.contactPlaceholder')}
                  className="h-12 rounded-2xl border border-white/60 bg-white/80 text-base shadow-sm backdrop-blur focus:border-primary/50 focus:ring-primary/40"
                  autoComplete="email"
                  autoFocus
                />
                {contactError && <p className="text-sm text-destructive">{contactError}</p>}
              </div>

              <Button type="submit" disabled={!isOnline} className="h-12 w-full rounded-full text-base font-semibold">
                {t('auth.sendCode')}
              </Button>
              {!isOnline && <p className="text-sm text-muted-foreground">{t('auth.sendDisabled')}</p>}
            </form>
          )}

          {step === 'otp' && (
            <form className="space-y-6" onSubmit={handleVerifyCode}>
              <div className="space-y-2 text-center">
                <h2 className="text-2xl font-semibold tracking-tight">{t('auth.otpTitle')}</h2>
                <p className="text-sm text-muted-foreground">
                  {t('auth.otpSubtitle', { contact: contact.trim() })}
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium text-muted-foreground">{t('auth.codeLabel')}</Label>
                <InputOTP
                  maxLength={6}
                  value={code}
                  onChange={value => setCode(value.replace(/\D/g, ''))}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={`otp-${index}`}
                        index={index}
                        className="h-12 w-12 rounded-2xl border border-white/60 bg-white/80 text-lg font-semibold shadow-sm backdrop-blur focus:border-primary/60 focus:ring-primary/40"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
                {codeError && <p className="text-sm text-destructive">{codeError}</p>}
              </div>

              <div className="flex flex-col gap-3">
                <Button type="submit" disabled={code.replace(/\D/g, '').length !== 6} className="h-12 rounded-full text-base font-semibold">
                  {t('auth.verifyCta')}
                </Button>
                <button
                  type="button"
                  onClick={canResend ? handleResend : undefined}
                  className={cn(
                    'text-sm font-semibold transition-colors',
                    canResend ? 'text-primary hover:text-teal' : 'text-muted-foreground',
                  )}
                  disabled={!canResend}
                >
                  {canResend ? t('auth.resendNow') : t('auth.resendIn', { time: formatTime(timeLeft) })}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('contact')}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
                >
                  {t('auth.changeContact')}
                </button>
              </div>
            </form>
          )}

          <div className="pt-4 text-center">
            <button type="button" onClick={handleDemo} className="text-sm font-semibold text-primary transition-colors hover:text-teal">
              {t('auth.useDemo')}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
};
