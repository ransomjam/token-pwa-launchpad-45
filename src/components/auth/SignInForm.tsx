import { useMemo, useState } from 'react';
import { AlertCircle, ArrowLeft, Lock, Smartphone } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/Logo';
import { useI18n } from '@/context/I18nContext';
import type { Session } from '@/types';
import { authenticate, listDemoAccounts } from '@/lib/authStorage';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';

type SignInFormProps = {
  onBack: () => void;
  onAuthenticated: (session: Session) => void;
};

export const SignInForm = ({ onBack, onAuthenticated }: SignInFormProps) => {
  const { t } = useI18n();
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const demoCredentials = useMemo(() => {
    return listDemoAccounts();
  }, []);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const session = authenticate(contact, password);
    if (!session) {
      setError(t('onboarding.signIn.invalidCredentials'));
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);
    onAuthenticated(session);
  };

  const applyDemoCredentials = (demoContact: string, demoPassword: string) => {
    setContact(demoContact);
    setPassword(demoPassword);
    setError(null);
  };

  return (
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden bg-gradient-to-br from-blue/90 via-ocean/95 to-primary/90">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-12 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute right-[-80px] top-32 h-72 w-72 rounded-full bg-teal/20 blur-3xl" />
        <div className="absolute bottom-[-120px] left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-primary/25 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md px-4 py-16 sm:py-20">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('common.back')}
        </button>

        <div className="rounded-[28px] border border-white/30 bg-white/95 p-8 shadow-[0_40px_90px_-40px_rgba(2,97,153,0.55)] backdrop-blur-xl">
          <div className="mb-8 flex flex-col items-center gap-3 text-center">
            <Logo wrapperClassName="h-14 w-14 shadow-glow" />
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {t('onboarding.signIn.title')}
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contact" className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  {t('onboarding.signIn.contactLabel')}
                </Label>
                <div className="relative">
                  <Smartphone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
                  <Input
                    id="contact"
                    value={contact}
                    onChange={event => setContact(event.target.value)}
                    placeholder="+237 6XX XX XX XX"
                    className="h-12 rounded-2xl border border-muted-foreground/20 bg-white/90 pl-11 text-base text-foreground shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                    autoComplete="username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground/80">
                  {t('onboarding.signIn.passwordLabel')}
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/80" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder={t('onboarding.signIn.passwordPlaceholder')}
                    className="h-12 rounded-2xl border border-muted-foreground/20 bg-white/90 pl-11 text-base text-foreground shadow-sm transition focus:border-primary focus:ring-2 focus:ring-primary/30"
                    autoComplete="current-password"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label htmlFor="show-password" className="flex items-center gap-2 text-muted-foreground">
                <Checkbox
                  id="show-password"
                  checked={showPassword}
                  onCheckedChange={value => setShowPassword(value === true)}
                  className="h-4 w-4 rounded-md border-muted-foreground/40"
                />
                <span>{t('onboarding.signIn.showPassword')}</span>
              </label>
              <button type="button" className="font-medium text-blue transition hover:text-ocean">
                {t('onboarding.signIn.forgotPassword')}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="h-12 w-full rounded-2xl bg-gradient-to-r from-primary via-teal to-blue text-base font-semibold text-white shadow-glow transition hover:shadow-lux"
              disabled={!contact.trim() || !password.trim() || isSubmitting}
            >
              {t('onboarding.signIn.submit')}
            </Button>
          </form>

          <div className="mt-4 text-center text-sm text-muted-foreground">
            <span className="mr-1">{t('onboarding.signIn.noAccountPrompt')}</span>
            <button
              type="button"
              onClick={onBack}
              className="font-semibold text-blue transition hover:text-ocean"
            >
              {t('onboarding.signIn.createAccountCta')}
            </button>
          </div>

          <div className="mt-8 space-y-3 rounded-2xl border border-dashed border-primary/30 bg-gradient-to-br from-primary/5 via-white to-blue/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-primary/80">
              {t('onboarding.signIn.demoTitle')}
            </p>
            <p className="text-sm text-muted-foreground">{t('onboarding.signIn.demoHint')}</p>
            <div className="grid gap-3 text-left text-sm">
              {demoCredentials.map(item => (
                <button
                  key={`${item.role}-${item.contact}`}
                  type="button"
                  onClick={() => applyDemoCredentials(item.contact, item.password)}
                  className="group w-full rounded-2xl border border-dashed border-blue/30 bg-white/90 px-4 py-3 text-left shadow-sm transition hover:border-blue/60 hover:bg-blue/5"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      {item.avatarUrl ? (
                        <AvatarImage src={item.avatarUrl} alt={item.displayName} />
                      ) : (
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {item.displayName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/80">
                        {item.isVerified
                          ? t('onboarding.signIn.demoStatusVerified')
                          : t('onboarding.signIn.demoStatusUnverified')}
                      </div>
                      <div className="mt-1 font-medium text-foreground">{item.contact}</div>
                      <div className="text-xs text-muted-foreground">
                        {t('onboarding.signIn.passwordLabel')}: <span className="font-mono text-blue">{item.password}</span>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};
