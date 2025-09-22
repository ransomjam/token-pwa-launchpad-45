import { useState } from 'react';
import { ShoppingBag, Boxes } from 'lucide-react';
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
    role: 'importer',
    titleKey: 'roles.importerTitle',
    descriptionKey: 'roles.importerSubtitle',
    summaryKey: 'roles.importerSummary',
    icon: Boxes,
  },
];

export const RoleChooser = ({ initialRole, onRoleChosen }: RoleChooserProps) => {
  const { t } = useI18n();
  const [selected, setSelected] = useState<Role>(initialRole);

  const handleContinue = () => {
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
                className={`flex items-center gap-4 rounded-2xl border-2 p-4 text-left transition-all ${
                  isActive ? 'border-primary bg-primary/5 shadow-sm' : 'border-border'
                }`}
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold">{t(option.titleKey)}</h2>
                    {isActive && <span className="rounded-full bg-primary px-2 py-0.5 text-xs text-primary-foreground">✔</span>}
                  </div>
                  <p className="text-sm text-muted-foreground">{t(option.descriptionKey)}</p>
                  <p className="text-sm font-medium text-muted-foreground/80">{t(option.summaryKey)}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Button onClick={handleContinue} className="h-12 rounded-xl text-base font-semibold">
          {t('common.continue')}
        </Button>
      </div>
    </main>
  );
};
