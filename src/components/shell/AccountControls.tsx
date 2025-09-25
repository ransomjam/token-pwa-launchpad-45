import { useState } from 'react';
import { Languages, UserRound, ChevronRight, Check } from 'lucide-react';
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
type ExperienceMode = 'preorder' | 'auctions';

type QuickLink = {
  key: string;
  label: string;
  description: string;
  href?: string;
  state?: unknown;
  badge?: string;
  disabled?: boolean;
};

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

type AccountSheetProps = {
  session: Session;
  experience?: ExperienceMode;
};

export const AccountSheet = ({ session, experience = 'preorder' }: AccountSheetProps) => {
  const { t, locale } = useI18n();
  const { updateSession } = useSession();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleRoleChange = (role: Role) => {
    if (session.role === role) return;
    updateSession(current => ({ ...current, role, hasSelectedRole: true }));
    trackEvent('role_switch', { role });
    setOpen(false);
  };

  const quickLinks: QuickLink[] = experience === 'auctions'
    ? [
        {
          key: 'bids',
          label: t('profile.bids.title'),
          description: t('profile.bids.subtitle'),
          href: '/profile/bids',
        },
        {
          key: 'watchlist',
          label: t('profile.watchlist.title'),
          description: t('profile.watchlist.subtitle'),
          href: '/profile/watchlist',
        },
        {
          key: 'wins',
          label: t('profile.wins.title'),
          description: t('profile.wins.subtitle'),
          href: '/profile/wins',
        },
      ]
    : session.role === 'buyer'
      ? [
          {
            key: 'orders',
            label: t('profile.actions.orders'),
            description: t('profile.actions.ordersHint'),
            href: '/account',
            state: { quickFlow: 'orders' },
          },
          {
            key: 'pickups',
            label: t('profile.actions.pickups'),
            description: t('profile.actions.pickupsHint'),
            href: '/account',
            state: { quickFlow: 'pickups' },
          },
          {
            key: 'payments',
            label: t('profile.actions.paymentsSoon'),
            description: t('profile.actions.paymentsSoonHint'),
            href: '/account',
            state: { quickFlow: 'payments' },
          },
          {
            key: 'support',
            label: t('profile.actions.support'),
            description: t('profile.actions.supportHint'),
            href: '/account',
            state: { quickFlow: 'support' },
          },
        ]
      : [
          {
            key: 'create-listing',
            label: t('profile.actions.createListing'),
            description: t('profile.actions.createListingHint'),
            href: '/importer/create',
          },
          {
            key: 'dashboard',
            label: t('profile.actions.dashboard'),
            description: t('profile.actions.dashboardHint'),
            href: '/',
          },
          {
            key: 'payouts',
            label: t('profile.actions.payouts'),
            description: t('profile.actions.payoutsHint'),
            disabled: true,
            badge: t('profile.badges.comingSoon'),
          },
          {
            key: 'support',
            label: t('profile.actions.support'),
            description: t('profile.actions.supportHint'),
            href: '/account',
            state: { quickFlow: 'support' },
          },
        ];

  const handleQuickLinkSelect = (link: QuickLink) => {
    if (link.disabled) return;
    if (link.href) {
      navigate(link.href, link.state ? { state: link.state } : undefined);
    }
    trackEvent('account_quick_link', { key: link.key, experience });
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

        <Button
          variant="outline"
          className="w-full justify-between rounded-2xl border-primary/60 text-sm font-semibold text-primary"
          onClick={() => {
            setOpen(false);
            navigate('/account');
          }}
        >
          <span>{t('profile.viewProfile')}</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {quickLinks.length > 0 && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {t('common.quickLinks')}
            </h3>
            <div className="grid gap-2">
              {quickLinks.map(link => {
                const disabled = link.disabled;
                return (
                  <button
                    key={link.key}
                    type="button"
                    onClick={() => handleQuickLinkSelect(link)}
                    disabled={disabled}
                    className={cn(
                      'w-full rounded-2xl border border-border/70 bg-card px-4 py-3 text-left shadow-soft transition-all',
                      disabled
                        ? 'cursor-not-allowed opacity-60'
                        : 'hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 active:translate-y-[1px]',
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{link.label}</p>
                        <p className="text-xs text-muted-foreground">{link.description}</p>
                      </div>
                      {link.badge ? (
                        <span className="pill bg-muted/70 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {link.badge}
                        </span>
                      ) : (
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

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
