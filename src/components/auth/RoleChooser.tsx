import { useState } from 'react';
import { ShoppingBag, Boxes, Store, Check, Megaphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AuthStepIndicator } from './AuthStepIndicator';
import { useI18n } from '@/context/I18nContext';
import type { Session } from '@/types';
import { trackEvent } from '@/lib/analytics';

type Role = Session['role'];

type RoleChooserProps = {
  initialRole: Role;
  onRoleChosen: (role: Role) => void;
};

const options: { role: Role; titleKey: string; descriptionKey: string; summaryKey: string; icon: typeof ShoppingBag }[] = [
  {
    role: 'buyer',
    titleKey: 'roles.buyerTitle',
    descriptionKey: 'roles.buyerSubtitle',
    summaryKey: 'roles.buyerSummary',
    icon: ShoppingBag,
  },
  {
    role: 'vendor',
    titleKey: 'roles.vendorTitle',
    descriptionKey: 'roles.vendorSubtitle',
    summaryKey: 'roles.vendorSummary',
    icon: Store,
  },
  {
    role: 'importer',
    titleKey: 'roles.importerTitle',
    descriptionKey: 'roles.importerSubtitle',
    summaryKey: 'roles.importerSummary',
    icon: Boxes,
  },
  {
    role: 'merchant',
    titleKey: 'roles.merchantTitle',
    descriptionKey: 'roles.merchantSubtitle',
    summaryKey: 'roles.merchantSummary',
    icon: Megaphone,
  },
];

export const RoleChooser = ({ initialRole, onRoleChosen }: RoleChooserProps) => {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Role | null>(initialRole);

  const handleContinue = () => {
    if (!selected) return;
    trackEvent('role_select', { role: selected, source: 'onboarding' });
    onRoleChosen(selected);
  };

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col gap-8 px-6 py-10">
        <AuthStepIndicator current="role" />

        <header className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">{t('roles.prompt')}</h1>
          <p className="text-muted-foreground">{t('roles.description')}</p>
        </header>

        <div className="grid gap-4">
          {options.map(option => {
            const Icon = option.icon;
            const isActive = selected === option.role;
            return (
              <button
                key={option.role}
                type="button"
                onClick={() => setSelected(option.role)}
                className={`relative flex items-start gap-5 rounded-3xl border border-border/70 bg-card p-5 text-left shadow-soft transition-all hover:border-primary/50 hover:shadow-card ${
                  isActive ? 'border-primary bg-primary/5 shadow-card' : ''
                }`}
                aria-pressed={isActive}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-semibold leading-tight">{t(option.titleKey)}</h2>
                  <p className="text-sm text-muted-foreground">{t(option.descriptionKey)}</p>
                  <p className="text-sm font-medium text-muted-foreground/80">{t(option.summaryKey)}</p>
                </div>
                {isActive && (
                  <span className="pointer-events-none absolute right-5 top-5 flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                    <Check className="h-4 w-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {selected && (
          <div className="mt-auto pt-2">
            <Button
              onClick={handleContinue}
              className="h-12 w-full rounded-full text-base font-semibold shadow-soft"
            >
              {t('common.continue')}
            </Button>
          </div>
        )}
      </div>
    </main>
  );
};
