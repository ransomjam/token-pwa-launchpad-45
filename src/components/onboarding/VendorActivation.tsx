import { useState } from 'react';
import { Store, Upload, CreditCard, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/Logo';
import type { Session } from '@/types';
import { trackEvent } from '@/lib/analytics';

type VendorActivationStep = 'profile' | 'verification' | 'payout' | 'complete';

type VendorActivationProps = {
  session: Session;
  onActivationComplete: (isVerified: boolean) => void;
  onSkipToDemo: () => void;
};

export const VendorActivation = ({ session, onActivationComplete, onSkipToDemo }: VendorActivationProps) => {
  const { t } = useI18n();
  const [step, setStep] = useState<VendorActivationStep>('profile');
  const [formData, setFormData] = useState({
    storeName: '',
    bio: '',
    city: session.contact || '',
    avatar: null as File | null,
    idFront: null as File | null,
    idBack: null as File | null,
    selfie: null as File | null,
    businessInfo: '',
    payoutMethod: '',
    bankDetails: '',
    acceptTerms: false,
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.storeName.trim() || !formData.bio.trim()) return;
    
    trackEvent('vendor_activation_profile_complete', { userId: session.userId });
    setStep('verification');
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('vendor_activation_verification_complete', { userId: session.userId });
    setStep('payout');
  };

  const handlePayoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.payoutMethod || !formData.acceptTerms) return;
    
    trackEvent('vendor_activation_complete', { 
      userId: session.userId,
      payoutMethod: formData.payoutMethod 
    });
    setStep('complete');
  };

  const handleFinish = (isVerified: boolean) => {
    trackEvent('vendor_activation_finished', { 
      userId: session.userId, 
      isVerified 
    });
    onActivationComplete(isVerified);
  };

  const handleSkipToDemo = () => {
    trackEvent('vendor_activation_skipped_to_demo', { userId: session.userId });
    onSkipToDemo();
  };

  const steps = [
    { key: 'profile', label: t('onboarding.vendor.steps.profile'), icon: Store },
    { key: 'verification', label: t('onboarding.vendor.steps.verification'), icon: Upload },
    { key: 'payout', label: t('onboarding.vendor.steps.payout'), icon: CreditCard },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === step);

  if (step === 'complete') {
    return (
      <main className="relative min-h-dvh overflow-hidden text-foreground">
        <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
        
        <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6">
          <div className="glass-card w-full space-y-8 px-6 py-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
              <Check className="h-8 w-8 text-primary" />
            </div>
            
            <div>
              <h1 className="text-2xl font-semibold">{t('onboarding.vendor.complete.title')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.vendor.complete.subtitle')}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleFinish(true)}
                className="h-12 w-full rounded-full"
              >
                {t('onboarding.vendor.complete.getVerified')}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleFinish(false)}
                className="h-12 w-full rounded-full"
              >
                {t('onboarding.vendor.complete.startDemo')}
              </Button>
            </div>

            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                {t('onboarding.vendor.complete.note')}
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-dvh overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col px-6 py-12">
        <div className="glass-card space-y-6 px-6 py-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <Logo wrapperClassName="h-8 w-8" />
            <Button variant="ghost" onClick={handleSkipToDemo} className="text-sm">
              {t('onboarding.vendor.skipToDemo')}
            </Button>
          </div>

          {/* Progress */}
          <div className="flex items-center justify-between">
            {steps.map((stepItem, index) => {
              const Icon = stepItem.icon;
              const isActive = index === currentStepIndex;
              const isComplete = index < currentStepIndex;
              
              return (
                <div key={stepItem.key} className="flex flex-col items-center gap-2">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                    isComplete ? 'bg-primary text-primary-foreground' :
                    isActive ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs text-center text-muted-foreground">{stepItem.label}</span>
                </div>
              );
            })}
          </div>

          {/* Store Profile Step */}
          {step === 'profile' && (
            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.vendor.profile.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.vendor.profile.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName">{t('onboarding.vendor.profile.storeNameLabel')}</Label>
                  <Input
                    id="storeName"
                    value={formData.storeName}
                    onChange={(e) => setFormData(prev => ({ ...prev, storeName: e.target.value }))}
                    placeholder={t('onboarding.vendor.profile.storeNamePlaceholder')}
                    className="h-12 rounded-2xl"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">{t('onboarding.vendor.profile.bioLabel')}</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                    placeholder={t('onboarding.vendor.profile.bioPlaceholder')}
                    className="min-h-[80px] rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t('onboarding.vendor.profile.cityLabel')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={t('onboarding.vendor.profile.cityPlaceholder')}
                    className="h-12 rounded-2xl"
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={!formData.storeName.trim() || !formData.bio.trim()}
                className="h-12 w-full rounded-full"
              >
                {t('common.continue')}
              </Button>
            </form>
          )}

          {/* Verification Step */}
          {step === 'verification' && (
            <form onSubmit={handleVerificationSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.vendor.verification.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.vendor.verification.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('onboarding.vendor.verification.idLabel')}</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="rounded-2xl border-2 border-dashed border-border/60 p-6 text-center">
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="mt-2 text-xs text-muted-foreground">{t('onboarding.vendor.verification.idFront')}</p>
                    </div>
                    <div className="rounded-2xl border-2 border-dashed border-border/60 p-6 text-center">
                      <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                      <p className="mt-2 text-xs text-muted-foreground">{t('onboarding.vendor.verification.idBack')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('onboarding.vendor.verification.selfieLabel')}</Label>
                  <div className="rounded-2xl border-2 border-dashed border-border/60 p-6 text-center">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-xs text-muted-foreground">{t('onboarding.vendor.verification.selfieDescription')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessInfo">{t('onboarding.vendor.verification.businessLabel')}</Label>
                  <Textarea
                    id="businessInfo"
                    value={formData.businessInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessInfo: e.target.value }))}
                    placeholder={t('onboarding.vendor.verification.businessPlaceholder')}
                    className="min-h-[80px] rounded-2xl"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800">{t('onboarding.vendor.verification.note')}</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="h-12 w-full rounded-full">
                {t('common.continue')}
              </Button>
            </form>
          )}

          {/* Payout Step */}
          {step === 'payout' && (
            <form onSubmit={handlePayoutSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.vendor.payout.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.vendor.payout.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('onboarding.vendor.payout.methodLabel')}</Label>
                  <Select
                    value={formData.payoutMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payoutMethod: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder={t('onboarding.vendor.payout.methodPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn-momo">MTN Mobile Money</SelectItem>
                      <SelectItem value="orange-money">Orange Money</SelectItem>
                      <SelectItem value="bank">Bank Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bankDetails">{t('onboarding.vendor.payout.detailsLabel')}</Label>
                  <Input
                    id="bankDetails"
                    value={formData.bankDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, bankDetails: e.target.value }))}
                    placeholder={t('onboarding.vendor.payout.detailsPlaceholder')}
                    className="h-12 rounded-2xl"
                  />
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="sellerTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))}
                  />
                  <Label htmlFor="sellerTerms" className="text-sm leading-relaxed">
                    {t('onboarding.vendor.payout.termsText')}
                  </Label>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={!formData.payoutMethod || !formData.acceptTerms}
                className="h-12 w-full rounded-full"
              >
                {t('onboarding.vendor.payout.submit')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};