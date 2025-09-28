import { useState } from 'react';
import { Building, Upload, Settings, Check, AlertCircle } from 'lucide-react';
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

type ImporterActivationStep = 'business' | 'verification' | 'operations' | 'complete';

type ImporterActivationProps = {
  session: Session;
  onActivationComplete: (isVerified: boolean) => void;
  onSkipToDemo: () => void;
};

const availableLanes = [
  { id: 'gz-dla-air', label: 'Guangzhou → Douala (Air)', code: 'GZ→DLA Air' },
  { id: 'gz-dla-sea', label: 'Guangzhou → Douala (Sea)', code: 'GZ→DLA Sea' },
  { id: 'ist-dla-sea', label: 'Istanbul → Douala (Sea)', code: 'IST→DLA Sea' },
  { id: 'szx-dla-air', label: 'Shenzhen → Douala (Air)', code: 'SZX→DLA Air' },
];

const demoPickupHubs = [
  { id: 'akwa', name: 'Akwa Pickup Hub', city: 'Douala' },
  { id: 'biyem', name: 'Biyem-Assi Hub', city: 'Yaoundé' },
  { id: 'bonamoussadi', name: 'Bonamoussadi Hub', city: 'Douala' },
];

export const ImporterActivation = ({ session, onActivationComplete, onSkipToDemo }: ImporterActivationProps) => {
  const { t } = useI18n();
  const [step, setStep] = useState<ImporterActivationStep>('business');
  const [formData, setFormData] = useState({
    businessName: '',
    city: session.contact || '',
    primaryLanes: [] as string[],
    idDocument: null as File | null,
    businessInfo: '',
    payoutMethod: '',
    payoutDetails: '',
    selectedHubs: ['akwa'] as string[],
    acceptTerms: false,
  });

  const handleBusinessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.businessName.trim() || !formData.city.trim() || formData.primaryLanes.length === 0) return;
    
    trackEvent('importer_activation_business_complete', { 
      userId: session.userId,
      lanesCount: formData.primaryLanes.length 
    });
    setStep('verification');
  };

  const handleVerificationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    trackEvent('importer_activation_verification_complete', { userId: session.userId });
    setStep('operations');
  };

  const handleOperationsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.payoutMethod || !formData.acceptTerms || formData.selectedHubs.length === 0) return;
    
    trackEvent('importer_activation_complete', { 
      userId: session.userId,
      payoutMethod: formData.payoutMethod,
      hubsCount: formData.selectedHubs.length 
    });
    setStep('complete');
  };

  const handleFinish = (isVerified: boolean) => {
    trackEvent('importer_activation_finished', { 
      userId: session.userId, 
      isVerified 
    });
    onActivationComplete(isVerified);
  };

  const handleSkipToDemo = () => {
    trackEvent('importer_activation_skipped_to_demo', { userId: session.userId });
    onSkipToDemo();
  };

  const toggleLane = (laneId: string) => {
    setFormData(prev => ({
      ...prev,
      primaryLanes: prev.primaryLanes.includes(laneId)
        ? prev.primaryLanes.filter(id => id !== laneId)
        : [...prev.primaryLanes, laneId]
    }));
  };

  const toggleHub = (hubId: string) => {
    setFormData(prev => ({
      ...prev,
      selectedHubs: prev.selectedHubs.includes(hubId)
        ? prev.selectedHubs.filter(id => id !== hubId)
        : [...prev.selectedHubs, hubId]
    }));
  };

  const steps = [
    { key: 'business', label: t('onboarding.importer.steps.business'), icon: Building },
    { key: 'verification', label: t('onboarding.importer.steps.verification'), icon: Upload },
    { key: 'operations', label: t('onboarding.importer.steps.operations'), icon: Settings },
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
              <h1 className="text-2xl font-semibold">{t('onboarding.importer.complete.title')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.importer.complete.subtitle')}</p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={() => handleFinish(true)}
                className="h-12 w-full rounded-full"
              >
                {t('onboarding.importer.complete.getVerified')}
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleFinish(false)}
                className="h-12 w-full rounded-full"
              >
                {t('onboarding.importer.complete.startDemo')}
              </Button>
            </div>

            <div className="rounded-2xl bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                {t('onboarding.importer.complete.note')}
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
              {t('onboarding.importer.skipToDemo')}
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

          {/* Business Step */}
          {step === 'business' && (
            <form onSubmit={handleBusinessSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.importer.business.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.importer.business.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">{t('onboarding.importer.business.nameLabel')}</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessName: e.target.value }))}
                    placeholder={t('onboarding.importer.business.namePlaceholder')}
                    className="h-12 rounded-2xl"
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="city">{t('onboarding.importer.business.cityLabel')}</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                    placeholder={t('onboarding.importer.business.cityPlaceholder')}
                    className="h-12 rounded-2xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label>{t('onboarding.importer.business.lanesLabel')}</Label>
                  <div className="space-y-2">
                    {availableLanes.map((lane) => (
                      <button
                        key={lane.id}
                        type="button"
                        onClick={() => toggleLane(lane.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition-all ${
                          formData.primaryLanes.includes(lane.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border/70 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{lane.label}</p>
                            <p className="text-sm text-muted-foreground">{lane.code}</p>
                          </div>
                          {formData.primaryLanes.includes(lane.id) && (
                            <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-current" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={!formData.businessName.trim() || !formData.city.trim() || formData.primaryLanes.length === 0}
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
                <h2 className="text-2xl font-semibold">{t('onboarding.importer.verification.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.importer.verification.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('onboarding.importer.verification.idLabel')}</Label>
                  <div className="rounded-2xl border-2 border-dashed border-border/60 p-6 text-center">
                    <Upload className="mx-auto h-6 w-6 text-muted-foreground" />
                    <p className="mt-2 text-xs text-muted-foreground">{t('onboarding.importer.verification.idDescription')}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="businessInfo">{t('onboarding.importer.verification.businessLabel')}</Label>
                  <Textarea
                    id="businessInfo"
                    value={formData.businessInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, businessInfo: e.target.value }))}
                    placeholder={t('onboarding.importer.verification.businessPlaceholder')}
                    className="min-h-[80px] rounded-2xl"
                  />
                </div>
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="text-sm text-amber-800">{t('onboarding.importer.verification.note')}</p>
                  </div>
                </div>
              </div>

              <Button type="submit" className="h-12 w-full rounded-full">
                {t('common.continue')}
              </Button>
            </form>
          )}

          {/* Operations Step */}
          {step === 'operations' && (
            <form onSubmit={handleOperationsSubmit} className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-semibold">{t('onboarding.importer.operations.title')}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.importer.operations.subtitle')}</p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>{t('onboarding.importer.operations.hubsLabel')}</Label>
                  <div className="space-y-2">
                    {demoPickupHubs.map((hub) => (
                      <button
                        key={hub.id}
                        type="button"
                        onClick={() => toggleHub(hub.id)}
                        className={`w-full rounded-2xl border p-3 text-left transition-all ${
                          formData.selectedHubs.includes(hub.id)
                            ? 'border-primary bg-primary/5'
                            : 'border-border/70 hover:border-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{hub.name}</p>
                            <p className="text-sm text-muted-foreground">{hub.city}</p>
                          </div>
                          {formData.selectedHubs.includes(hub.id) && (
                            <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                              <div className="h-2 w-2 rounded-full bg-current" />
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>{t('onboarding.importer.operations.payoutLabel')}</Label>
                  <Select
                    value={formData.payoutMethod}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payoutMethod: value }))}
                  >
                    <SelectTrigger className="h-12 rounded-2xl">
                      <SelectValue placeholder={t('onboarding.importer.operations.payoutPlaceholder')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mtn-momo">MTN Mobile Money</SelectItem>
                      <SelectItem value="orange-money">Orange Money</SelectItem>
                      <SelectItem value="bank">Bank Account</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="importerTerms"
                    checked={formData.acceptTerms}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, acceptTerms: checked as boolean }))}
                  />
                  <Label htmlFor="importerTerms" className="text-sm leading-relaxed">
                    {t('onboarding.importer.operations.termsText')}
                  </Label>
                </div>
              </div>

              <div className="rounded-2xl bg-muted/50 p-4">
                <p className="text-sm text-muted-foreground">
                  {t('onboarding.importer.operations.evidenceNote')}
                </p>
              </div>

              <Button 
                type="submit" 
                disabled={!formData.payoutMethod || !formData.acceptTerms || formData.selectedHubs.length === 0}
                className="h-12 w-full rounded-full"
              >
                {t('onboarding.importer.operations.submit')}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};