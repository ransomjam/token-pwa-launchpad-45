import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Building2, Camera, Lock, Mail, Phone, User } from 'lucide-react';

import { Logo } from '@/components/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import type { Session } from '@/types';
import type { StoredAccount } from '@/lib/authStorage';

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read image'));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unknown file error'));
    reader.readAsDataURL(file);
  });
};

const randomId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `id-${Math.random().toString(36).slice(2, 10)}`;
};

type UnifiedAccountLandingProps = {
  demoAccounts: StoredAccount[];
  onAccountCreated: (session: Session, password: string) => void;
  onGoogleAccountCreated: (session: Session, password: string) => void;
  onShowSignIn: () => void;
  onDemoLogin: (account: StoredAccount) => void;
};

type FormState = {
  personalName: string;
  businessName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  avatarPreview: string | null;
};

const initialFormState: FormState = {
  personalName: '',
  businessName: '',
  email: '',
  phone: '',
  password: '',
  confirmPassword: '',
  avatarPreview: null,
};

export const UnifiedAccountLanding = ({
  demoAccounts,
  onAccountCreated,
  onGoogleAccountCreated: _onGoogleAccountCreated,
  onShowSignIn,
  onDemoLogin,
}: UnifiedAccountLandingProps) => {
  const [form, setForm] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPasswords, setShowPasswords] = useState(false);

  const isFormValid = useMemo(() => {
    if (!form.personalName.trim() || !form.businessName.trim()) return false;
    if (!form.email.trim() || !form.phone.trim()) return false;
    if (form.password.trim().length < 6) return false;
    if (form.password !== form.confirmPassword) return false;
    return true;
  }, [form]);

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setForm(prev => ({ ...prev, avatarPreview: null }));
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    setForm(prev => ({ ...prev, avatarPreview: dataUrl }));
  };

  const buildSession = (base: Partial<Session>): Session => {
    return {
      userId: base.userId ?? `user-${randomId()}`,
      personalName: base.personalName ?? form.personalName.trim(),
      businessName: base.businessName ?? form.businessName.trim(),
      email: base.email ?? form.email.trim(),
      phone: base.phone ?? form.phone.trim(),
      displayName: base.personalName ?? form.personalName.trim(),
      contact: base.contact ?? (base.phone ?? form.phone.trim()),
      role: base.role ?? 'buyer',
      hasSelectedRole: base.hasSelectedRole ?? true,
      isVerified: base.isVerified ?? false,
      verification: base.verification ?? {
        status: 'unverified',
        businessName: base.businessName ?? form.businessName.trim(),
        location: '',
      },
      avatarUrl: base.avatarUrl ?? form.avatarPreview ?? null,
    } satisfies Session;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isFormValid) return;
    setIsSubmitting(true);

    const session = buildSession({});
    onAccountCreated(session, form.password.trim());
    setIsSubmitting(false);
    setForm(initialFormState);
  };

  return (
    <main
      className="relative min-h-dvh overflow-hidden bg-[hsl(var(--color-blue))]"
      style={{
        backgroundImage:
          'radial-gradient(circle at 15% 15%, rgba(255,255,255,0.18), transparent 55%), radial-gradient(circle at 85% 20%, rgba(255,255,255,0.12), transparent 58%), radial-gradient(circle at 50% 110%, rgba(255,255,255,0.14), transparent 60%)',
      }}
    >
      <div className="pointer-events-none absolute -left-24 top-32 h-80 w-80 rounded-full border border-white/20 bg-white/10 blur-0" />
      <div className="pointer-events-none absolute -right-16 bottom-12 h-72 w-72 rounded-full border border-white/20 bg-white/10" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/20 via-transparent to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col items-center justify-center gap-10 px-4 py-12">
        <div className="w-full max-w-md rounded-[36px] bg-white/95 p-8 shadow-card backdrop-blur-lg">
          <div className="mb-6 flex flex-col items-center gap-4 text-center">
            <Logo wrapperClassName="h-10 w-10" />
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-foreground">Create your ProList account</h1>
              <p className="text-sm text-muted-foreground">
                Set up your profile to access the marketplace. You can update details or verify later.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="personalName" className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Personal name
                </Label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="personalName"
                    value={form.personalName}
                    onChange={event => setForm(prev => ({ ...prev, personalName: event.target.value }))}
                    placeholder="e.g. Ada Kameni"
                    className="h-12 rounded-2xl border border-blue/10 bg-white/90 pl-11 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="businessName" className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Business name
                </Label>
                <div className="relative">
                  <Building2 className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="businessName"
                    value={form.businessName}
                    onChange={event => setForm(prev => ({ ...prev, businessName: event.target.value }))}
                    placeholder="e.g. Kameni Trading House"
                    className="h-12 rounded-2xl border border-blue/10 bg-white/90 pl-11 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Email
                </Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={event => setForm(prev => ({ ...prev, email: event.target.value }))}
                    placeholder="name@company.com"
                    className="h-12 rounded-2xl border border-blue/10 bg-white/90 pl-11 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Phone
                </Label>
                <div className="relative">
                  <Phone className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="phone"
                    value={form.phone}
                    onChange={event => setForm(prev => ({ ...prev, phone: event.target.value }))}
                    placeholder="+237 6XX XX XX XX"
                    className="h-12 rounded-2xl border border-blue/10 bg-white/90 pl-11 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="password"
                    type={showPasswords ? 'text' : 'password'}
                    value={form.password}
                    onChange={event => setForm(prev => ({ ...prev, password: event.target.value }))}
                    placeholder="Minimum 6 characters"
                    className="h-12 rounded-2xl border border-blue/10 bg-white/90 pl-11 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                  Confirm password
                </Label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                  <Input
                    id="confirmPassword"
                    type={showPasswords ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={event => setForm(prev => ({ ...prev, confirmPassword: event.target.value }))}
                    placeholder="Repeat password"
                    className="h-12 rounded-2xl border border-blue/10 bg-white/90 pl-11 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
                Profile photo
              </Label>
              <label
                htmlFor="avatar-upload"
                className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-blue/30 bg-blue/5 p-6 text-center text-sm text-muted-foreground transition hover:border-primary/60 hover:bg-primary/5"
              >
                <input id="avatar-upload" type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
                {form.avatarPreview ? (
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={form.avatarPreview} alt="Profile preview" />
                    <AvatarFallback>ME</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Camera className="h-6 w-6" />
                  </div>
                )}
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">Upload a friendly photo</p>
                  <p className="text-xs text-muted-foreground">PNG or JPG up to 5MB.</p>
                </div>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="showPasswords"
                checked={showPasswords}
                onCheckedChange={value => setShowPasswords(Boolean(value))}
                className="border-blue/30 data-[state=checked]:border-primary data-[state=checked]:bg-primary"
              />
              <Label htmlFor="showPasswords" className="text-sm text-muted-foreground">
                Show passwords
              </Label>
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-full bg-gradient-to-r from-primary via-teal to-blue text-base font-semibold shadow-glow hover:shadow-lux"
              disabled={!isFormValid || isSubmitting}
            >
              Create account
            </Button>
          </form>
          <div className="mt-6 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <button type="button" onClick={onShowSignIn} className="font-semibold text-primary underline-offset-4 hover:underline">
              Sign in
            </button>
          </div>
        </div>

        <div className="w-full max-w-2xl rounded-3xl border border-white/20 bg-white/10 p-6 text-white/90 backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-white/70">demo accounts</p>
          <p className="mt-3 text-sm text-white/80">
            Jump in with a pre-filled profile to explore ProList right away.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {demoAccounts.map(account => (
              <button
                key={account.userId}
                type="button"
                onClick={() => onDemoLogin(account)}
                className="flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 text-left text-foreground shadow-soft transition hover:-translate-y-0.5 hover:shadow-card"
              >
                <Avatar className="h-10 w-10">
                  {account.avatarUrl ? (
                    <AvatarImage src={account.avatarUrl} alt={account.displayName} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {account.displayName.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{account.displayName}</p>
                  <p className="text-xs text-muted-foreground">{account.isVerified ? 'Verified user' : 'Unverified user'}</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-primary">Start</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
};

