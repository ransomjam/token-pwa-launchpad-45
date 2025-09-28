import { useState } from 'react';
import { ShoppingBag, Boxes, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/Logo';
import type { Session } from '@/types';
import { trackEvent } from '@/lib/analytics';

type Role = Session['role'];

type ModeChooserProps = {
  onModeSelected: (role: Role, isDemoVendor?: boolean) => void;
};

const modes = [
  {
    role: 'buyer' as const,
    icon: ShoppingBag,
    titleKey: 'onboarding.modes.buyer.title',
    descriptionKey: 'onboarding.modes.buyer.description',
  },
  {
    role: 'importer' as const,
    icon: Boxes,
    titleKey: 'onboarding.modes.importer.title',
    descriptionKey: 'onboarding.modes.importer.description',
  },
  {
    role: 'vendor' as const,
    icon: Store,
    titleKey: 'onboarding.modes.vendor.title',
    descriptionKey: 'onboarding.modes.vendor.description',
  },
];

export const ModeChooser = ({ onModeSelected }: ModeChooserProps) => {
  const { t } = useI18n();
  const [selectedMode, setSelectedMode] = useState<Role | null>(null);

  const handleModeSelect = (role: Role) => {
    setSelectedMode(role);
    trackEvent('onboarding_mode_select', { mode: role });
  };

  const handleContinue = () => {
    if (!selectedMode) return;
    onModeSelected(selectedMode);
  };

  const handleTryVendorDemo = () => {
    trackEvent('onboarding_demo_vendor_start');
    onModeSelected('vendor', true);
  };

  return (
    <main className="relative min-h-dvh overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/80 via-white/40 to-transparent" />
      
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-lg flex-col px-6 py-12">
        <div className="glass-card space-y-8 px-6 py-8">
          {/* Header */}
          <div className="flex flex-col items-center gap-4 text-center">
            <Logo wrapperClassName="h-12 w-12 drop-shadow-[0_18px_40px_-16px_rgba(15,191,109,0.45)]" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">{t('app.tagline')}</p>
              <h1 className="text-3xl font-semibold tracking-tight">{t('onboarding.modeChooser.title')}</h1>
              <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.modeChooser.subtitle')}</p>
            </div>
          </div>

          {/* Mode Cards */}
          <div className="space-y-4">
            {modes.map((mode) => {
              const Icon = mode.icon;
              const isSelected = selectedMode === mode.role;
              
              return (
                <button
                  key={mode.role}
                  type="button"
                  onClick={() => handleModeSelect(mode.role)}
                  className={`relative w-full rounded-2xl border border-border/70 bg-card p-5 text-left transition-all hover:border-primary/50 hover:shadow-card ${
                    isSelected ? 'border-primary bg-primary/5 shadow-card' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <h3 className="font-semibold text-foreground">{t(mode.titleKey)}</h3>
                      <p className="text-sm text-muted-foreground">{t(mode.descriptionKey)}</p>
                    </div>
                    {isSelected && (
                      <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-current" />
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {selectedMode && (
              <Button
                onClick={handleContinue}
                className="h-12 w-full rounded-full text-base font-semibold"
              >
                {t('common.continue')}
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleTryVendorDemo}
              className="h-12 w-full rounded-full text-base font-medium"
            >
              {t('onboarding.modeChooser.tryVendorDemo')}
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
};