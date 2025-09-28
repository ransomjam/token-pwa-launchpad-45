import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/Logo';
import type { Session } from '@/types';
import { trackEvent } from '@/lib/analytics';

type BuyerSuccessProps = {
  session: Session;
  onContinue: () => void;
};

export const BuyerSuccess = ({ session, onContinue }: BuyerSuccessProps) => {
  const { t } = useI18n();

  const handleContinue = () => {
    trackEvent('buyer_onboarding_complete', { userId: session.userId });
    onContinue();
  };

  return (
    <main className="relative min-h-dvh overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center px-6">
        <div className="glass-card w-full space-y-8 px-6 py-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/20">
            <Check className="h-8 w-8 text-primary" />
          </div>
          
          <div>
            <h1 className="text-2xl font-semibold">{t('onboarding.buyer.success.title', { name: session.displayName })}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{t('onboarding.buyer.success.subtitle')}</p>
          </div>

          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="space-y-2">
              <h3 className="font-medium text-primary">{t('onboarding.buyer.success.protectionTitle')}</h3>
              <p className="text-sm text-muted-foreground">{t('onboarding.buyer.success.protectionDescription')}</p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium">{t('onboarding.buyer.success.tipsTitle')}</h3>
            <ul className="space-y-2 text-left text-sm text-muted-foreground">
              <li>• {t('onboarding.buyer.success.tip1')}</li>
              <li>• {t('onboarding.buyer.success.tip2')}</li>
              <li>• {t('onboarding.buyer.success.tip3')}</li>
            </ul>
          </div>

          <Button
            onClick={handleContinue}
            className="h-12 w-full rounded-full"
          >
            {t('onboarding.buyer.success.startShopping')}
          </Button>
        </div>
      </div>
    </main>
  );
};