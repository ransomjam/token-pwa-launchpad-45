import { useState } from 'react';
import { Languages, UserRound, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { useSession } from '@/context/SessionContext';
import type { Session } from '@/types';
import { trackEvent } from '@/lib/analytics';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';

type Role = Session['role'];

export const languageNames: Record<'en' | 'fr', string> = {
  en: 'English',
  fr: 'Français',
};

export const LanguageToggle = ({ className }: { className?: string }) => {
  const { locale, setLocale, t } = useI18n();
  const nextLocale = locale === 'en' ? 'fr' : 'en';

  const handleClick = () => {
    setLocale(nextLocale);
    trackEvent('lang_change', { locale: nextLocale });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('h-10 rounded-full border-primary/40 px-4 text-xs font-semibold uppercase', className)}
      onClick={handleClick}
      aria-label={t('common.changeLanguage')}
    >
      <Languages className="h-4 w-4" />
      <span>{locale.toUpperCase()}</span>
      <span className="hidden text-muted-foreground sm:inline">{t('common.changeLanguage')}</span>
    </Button>
  );
};

type AccountRoleOptionProps = {
  active: boolean;
  label: string;
  description: string;
  onClick: () => void;
};

const AccountRoleOption = ({ active, label, description, onClick }: AccountRoleOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'flex items-start justify-between rounded-2xl border-2 p-4 text-left transition-all',
      active ? 'border-primary bg-primary/5 shadow-sm' : 'border-border hover:border-primary/50',
    )}
  >
    <div className="space-y-1">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
    <ChevronRight className="h-5 w-5 text-muted-foreground" />
  </button>
);

export const AccountSheet = ({ session }: { session: Session }) => {
  const { t, locale } = useI18n();
  const { updateSession } = useSession();
  const [open, setOpen] = useState(false);

  const handleRoleChange = (role: Role) => {
    if (session.role === role) return;
    updateSession(current => ({ ...current, role, hasSelectedRole: true }));
    trackEvent('role_switch', { role });
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full border border-border bg-background shadow-sm"
        >
          <UserRound className="h-5 w-5" />
          <span className="sr-only">{t('common.account')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-6 sm:max-w-sm">
        <SheetHeader className="space-y-1 text-left">
          <SheetTitle>{t('common.account')}</SheetTitle>
          <SheetDescription>{session.contact}</SheetDescription>
        </SheetHeader>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('roles.switchTitle')}
          </h3>
          <p className="text-sm text-muted-foreground">{t('roles.switchNote')}</p>
          <div className="grid gap-3">
            <AccountRoleOption
              active={session.role === 'buyer'}
              label={t('roles.buyerBadge')}
              description={t('roles.buyerSummary')}
              onClick={() => handleRoleChange('buyer')}
            />
            <AccountRoleOption
              active={session.role === 'importer'}
              label={t('roles.importerBadge')}
              description={t('roles.importerSummary')}
              onClick={() => handleRoleChange('importer')}
            />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            {t('common.language')}
          </h3>
          <p className="text-sm text-muted-foreground">{languageNames[locale]}</p>
          <LanguageToggle className="w-full justify-center" />
        </section>
      </SheetContent>
    </Sheet>
  );
};
