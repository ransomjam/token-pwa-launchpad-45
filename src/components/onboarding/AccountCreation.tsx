import { useState, useEffect } from 'react';
import { Check, Phone, User, MapPin, Shield, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/Logo';
import type { Session } from '@/types';
import { trackEvent } from '@/lib/analytics';

type AccountCreationStep = 'phone' | 'otp' | 'basics' | 'pickup' | 'protection';

type AccountCreationProps = {
  selectedRole: Session['role'];
  isDemoVendor?: boolean;
  onAccountCreated: (session: Session) => void;
  onBack: () => void;
};

const OTP_CODE = '123456';

const demoPickupHubs = [
  { id: 'akwa', name: 'Akwa Pickup Hub', address: 'Boulevard de la Liberté, Douala', city: 'Douala' },
  { id: 'biyem', name: 'Biyem-Assi Hub', address: 'Carrefour Belibi, Yaoundé', city: 'Yaoundé' },
];

export const AccountCreation = ({ selectedRole, isDemoVendor, onAccountCreated, onBack }: AccountCreationProps) => {
  const { t, locale, setLocale } = useI18n();
  const [step, setStep] = useState<AccountCreationStep>('phone');
  const [formData, setFormData] = useState({
    phone: '',
    otp: '',
    name: '',
    language: locale,
    city: '',
    pickupHub: 'akwa',
    preferredWallet: '' as 'mtn-momo' | 'orange-money' | '',
    acceptTerms: false,
  });
  const [timeLeft, setTimeLeft] = useState(30);

  useEffect(() => {
    if (step !== 'otp') return;
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [step, timeLeft]);

  const handlePhoneSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.phone.trim()) return;
    
    trackEvent('onboarding_phone_submit', { role: selectedRole });
    setStep('otp');
    setTimeLeft(30);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.otp !== OTP_CODE) return;
    
    trackEvent('onboarding_phone_verified', { role: selectedRole });
    setStep('basics');
  };

  const handleBasicsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.city.trim()) return;
    
    trackEvent('onboarding_basics_complete', { role: selectedRole, language: formData.language });
    setStep('pickup');
  };

  const handlePickupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('onboarding_pickup_selected', { role: selectedRole, hub: formData.pickupHub });
    setStep('protection');
  };

  const handleProtectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.acceptTerms) return;

    // Update language if changed
    if (formData.language !== locale) {
      setLocale(formData.language as 'en' | 'fr');
    }

    const session: Session = {
      userId: isDemoVendor ? 'demo-vendor' : `user-${selectedRole}`,
      displayName: formData.name,
      contact: formData.phone,
      role: selectedRole,
      hasSelectedRole: true,
      verifiedImporter: false,
    };

    trackEvent('onboarding_complete', { 
      role: selectedRole, 
      isDemoVendor,
      language: formData.language,
      city: formData.city,
      hub: formData.pickupHub 
    });
    
    onAccountCreated(session);
  };

  const selectedHub = demoPickupHubs.find(hub => hub.id === formData.pickupHub);

  const steps = [
    { key: 'phone', icon: Phone, label: t('onboarding.steps.phone') },
    { key: 'otp', icon: Check, label: t('onboarding.steps.verify') },
    { key: 'basics', icon: User, label: t('onboarding.steps.basics') },
    { key: 'pickup', icon: MapPin, label: t('onboarding.steps.pickup') },
    { key: 'protection', icon: Shield, label: t('onboarding.steps.protection') },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  return (
    <main className="relative min-h-dvh overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/80 via-white/40 to-transparent" />
      
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-12">
        <div className="glass-card space-y-6 px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <button onClick={onBack} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {t('common.back')}
            </button>
            <Logo wrapperClassName="h-8 w-8" />
            <div className="w-12" /> {/* Spacer */}
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex;
              
              return (
                <div key={stepItem.key} className="flex flex-col items-center gap-2">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors ${
                    isComplete ? 'bg-primary text-primary-foreground' :
                    isActive ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-xs text-muted-foreground">{stepItem.label}</span>
                </div>
              );
            })}
          </div>

          {/* Phone Step */}
          {step === 'phone' && (
            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.phone.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.phone.subtitle')}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">{t('onboarding.phone.label')}</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  placeholder="+237 6XX XX XX XX"
                  className="h-12 rounded-2xl"
                  autoFocus
                />
              </div>

              <Button type="submit" className="h-12 w-full rounded-full">
                {t('onboarding.phone.sendCode')}
              </Button>
            </form>
          )}

          {/* OTP Step */}
          {step === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.otp.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t('onboarding.otp.subtitle', { phone: formData.phone })}
                </p>
              </div>

              <div className="space-y-4">
                <Label className="text-center">{t('onboarding.otp.label')}</Label>
                <InputOTP
                  maxLength={6}
                  value={formData.otp}
                  onChange={(value) => setFormData(prev => ({ ...prev, otp: value }))}
                  containerClassName="justify-center"
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-12 w-12 rounded-2xl border border-white/60 bg-white/80"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="space-y-3">
                <Button 
                  type="submit" 
                  disabled={formData.otp.length !== 6}
                  className="h-12 w-full rounded-full"
                >
                  {t('onboarding.otp.verify')}
                </Button>
                
                <div className="text-center">
                  {timeLeft > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {t('onboarding.otp.resendIn', { seconds: timeLeft })}
                    </p>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTimeLeft(30)}
                      className="text-sm font-medium text-primary hover:text-teal"
                    >
                      {t('onboarding.otp.resend')}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}

          {/* Basics Step */}
          {step === 'basics' && (
            <form onSubmit={handleBasicsSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.basics.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.basics.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">{t('onboarding.basics.nameLabel')}</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder={t('onboarding.basics.namePlaceholder')}
                    className="h-12 rounded-2xl"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">{t('onboarding.basics.languageLabel')}</Label>
                  <Select 
                    value={formData.language} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, language: value as 'en' | 'fr' }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t('onboarding.basics.cityLabel')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={t('onboarding.basics.cityPlaceholder')}
                    className="h-12 rounded-2xl"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={!formData.name.trim() || !formData.city.trim()}
                className="h-12 w-full rounded-full"
              >
                {t('common.continue')}
              </Button>
            </form>
          )}

          {/* Pickup Step */}
          {step === 'pickup' && (
            <form onSubmit={handlePickupSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.pickup.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.pickup.subtitle')}</p>
              </div>

              <div className="space-y-4">
                {demoPickupHubs.map((hub) => (
                  <button
                    key={hub.id}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, pickupHub: hub.id }))}
                    className={`w-full rounded-2xl border p-4 text-left transition-all ${
                      formData.pickupHub === hub.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border/70 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{hub.name}</h3>
                        <p className="text-sm text-muted-foreground">{hub.address}</p>
                        <p className="text-xs text-muted-foreground">{hub.city}</p>
                      </div>
                      {formData.pickupHub === hub.id && (
                        <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <div className="h-2 w-2 rounded-full bg-current" />
                        </div>
                      )}
                    </div>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.pickup.note')}
                </p>
              </div>

              <Button type="submit" className="h-12 w-full rounded-full">
                {t('common.continue')}
              </Button>
            </form>
          )}

          {/* Protection Step */}
          {step === 'protection' && (
            <form onSubmit={handleProtectionSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.protection.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.protection.subtitle')}</p>
              </div>

              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary mt-0.5" />
                  <div className="space-y-2">
                    <h3 className="font-medium text-primary">{t('onboarding.protection.escrowTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('onboarding.protection.escrowDescription')}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('onboarding.protection.walletLabel')} {t('common.optional')}</Label>
                  <Select
                    value={formData.preferredWallet}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, preferredWallet: value as any }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder={t('onboarding.protection.walletPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn-momo">MTN Mobile Money</SelectItem>
                      <SelectItem value="orange-money">Orange Money</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))}
                  />
                  <Label htmlFor="terms" className="text-sm leading-relaxed">
                    {t('onboarding.protection.termsText')}
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={!formData.acceptTerms}
                className="h-12 w-full rounded-full"
              >
                {t('onboarding.protection.createAccount')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};