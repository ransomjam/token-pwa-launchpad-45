import { useState } from 'react';
import { Languages, UserRound, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { useSession } from '@/context/SessionContext';
import type { Session } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { useNavigate } from 'react-router-dom';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const locales = Object.keys(languageNames) as Array<keyof typeof languageNames>;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'inline-flex h-10 min-w-[3.25rem] items-center gap-2 rounded-full border border-border bg-background px-4 text-xs font-semibold uppercase shadow-sm transition-colors hover:border-primary/50 focus-visible:ring-2 focus-visible:ring-primary/40',
            className,
          )}
          aria-label={t('common.changeLanguage')}
        >
          <Languages className="h-4 w-4" />
          <span>{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-44 rounded-2xl border border-border bg-popover p-1 shadow-soft"
      >
        {locales.map(code => (
          <DropdownMenuItem
            key={code}
            className="flex items-center justify-between gap-3 rounded-xl px-3 py-2 text-sm font-medium text-foreground focus:bg-muted/60"
            onClick={() => {
              if (locale === code) return;
              setLocale(code);
              trackEvent('lang_change', { locale: code });
            }}
          >
            <span>{languageNames[code]}</span>
            {locale === code && <Check className="h-4 w-4 text-primary" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
      'group relative overflow-hidden rounded-2xl border p-5 text-left transition-all',
      active
        ? 'border-transparent bg-gradient-to-br from-primary/90 via-blue/80 to-ocean/80 text-white shadow-card'
        : 'border-border/70 bg-card/70 backdrop-blur hover:-translate-y-[1px] hover:border-primary/50 hover:shadow-soft',
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div className="space-y-2">
        <p className={cn('text-sm font-semibold', active ? 'text-white' : 'text-foreground')}>{label}</p>
        <p className={cn('text-xs leading-relaxed', active ? 'text-white/80' : 'text-muted-foreground')}>{description}</p>
      </div>
      <span
        className={cn(
          'flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold transition-all',
          active ? 'border-white/40 bg-white/20 text-white' : 'border-primary/30 bg-primary/10 text-primary',
        )}
      >
        {active ? <Check className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </span>
    </div>
    {active && (
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-white/40 ring-offset-2 ring-offset-primary/30"
        aria-hidden
      />
    )}
  </button>
);

export const AccountSheet = ({ session }: { session: Session }) => {
  const { t, locale } = useI18n();
  const { updateSession } = useSession();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const activeRoleLabel =
    session.role === 'buyer'
      ? t('roles.buyerBadge')
      : session.role === 'importer'
        ? t('roles.importerBadge')
        : t('roles.vendorBadge');

  const activeRoleSummary =
    session.role === 'buyer'
      ? t('roles.buyerSummary')
      : session.role === 'importer'
        ? t('roles.importerSummary')
        : t('roles.vendorSummary');

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
          className="h-11 w-11 rounded-2xl border border-border/80 bg-card/80 text-foreground shadow-soft hover:border-primary/50 hover:text-primary"
        >
          <UserRound className="h-5 w-5" />
          <span className="sr-only">{t('common.account')}</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="flex w-full flex-col gap-6 bg-gradient-to-b from-ocean/5 via-background to-background px-6 py-8 sm:max-w-sm"
      >
        <SheetHeader className="text-left">
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-primary via-blue to-ocean p-[1px] shadow-card">
            <div className="rounded-[calc(theme(borderRadius.3xl)-1px)] bg-black/10 p-6">
              <div className="flex items-start justify-between gap-4 text-white">
                <div className="flex items-start gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                    <UserRound className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <SheetTitle className="text-lg font-semibold tracking-tight text-white">
                      {t('common.account')}
                    </SheetTitle>
                    <SheetDescription className="text-sm text-white/70">
                      {session.contact}
                    </SheetDescription>
                  </div>
                </div>
                <Sparkles className="h-5 w-5 text-white/70" aria-hidden />
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-white/90">
                  {activeRoleLabel}
                </span>
                <p className="text-xs text-white/70">{activeRoleSummary}</p>
              </div>
            </div>
          </div>
        </SheetHeader>

        <Button
          className="group relative flex w-full items-center justify-between overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-r from-primary via-blue to-ocean px-6 py-3 text-sm font-semibold text-primary-foreground shadow-soft transition hover:shadow-card focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-primary/30"
          onClick={() => {
            setOpen(false);
            navigate('/account');
          }}
        >
          <span>{t('profile.viewProfile')}</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition group-hover:translate-x-1">
            <ChevronRight className="h-4 w-4" />
          </div>
        </Button>

        <section className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              {t('roles.switchTitle')}
            </h3>
            <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
          </div>
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
            <AccountRoleOption
              active={session.role === 'vendor'}
              label={t('roles.vendorBadge')}
              description={t('roles.vendorSummary')}
              onClick={() => handleRoleChange('vendor')}
            />
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/60 bg-card/80 p-5 shadow-soft backdrop-blur">
          <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            {t('common.language')}
          </h3>
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 bg-background/80 px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">{languageNames[locale]}</p>
              <p className="text-xs text-muted-foreground">{t('common.changeLanguage')}</p>
            </div>
            <LanguageToggle className="w-auto rounded-full border border-white/40 bg-white/70 text-foreground hover:border-primary/50" />
          </div>
        </section>
      </SheetContent>
    </Sheet>
  );
};
