import { useState } from 'react';
import { Languages, ChevronRight, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { useSession } from '@/context/SessionContext';
import type { Session } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { VerificationDialog, type VerificationPayload } from '@/components/verification/VerificationDialog';

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
  description?: string;
  onClick: () => void;
};

const AccountRoleOption = ({ active, label, description, onClick }: AccountRoleOptionProps) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      'group relative overflow-hidden rounded-2xl border p-4 text-left transition-all sm:p-5',
      active
        ? 'border-transparent bg-gradient-to-br from-primary/90 via-blue/80 to-ocean/80 text-white shadow-card'
        : 'border-border/70 bg-card/70 backdrop-blur hover:-translate-y-[1px] hover:border-primary/50 hover:shadow-soft',
    )}
  >
    <div className="flex items-start justify-between gap-3 sm:gap-4">
      <div className="space-y-2">
        <p className={cn('text-sm font-semibold', active ? 'text-white' : 'text-foreground')}>{label}</p>
        {description && (
          <p
            className={cn(
              'text-xs leading-snug sm:leading-relaxed',
              active ? 'text-white/80' : 'text-muted-foreground',
            )}
          >
            {description}
          </p>
        )}
      </div>
      <span
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold transition-all sm:h-9 sm:w-9',
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

const getInitials = (value: string) => {
  const normalized = value.replace(/[^\p{L}\p{N}\s]+/gu, ' ').trim();
  if (!normalized) return '';
  return normalized
    .split(/\s+/)
    .filter(Boolean)
    .map(part => part[0]!.toUpperCase())
    .join('')
    .slice(0, 2);
};

type AccountSwitcherContentProps = {
  session: Session;
  onClose?: () => void;
};

export const AccountSwitcherContent = ({ session, onClose }: AccountSwitcherContentProps) => {
  const { t, locale } = useI18n();
  const { updateSession } = useSession();
  const navigate = useNavigate();
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [pendingRole, setPendingRole] = useState<Role | null>(null);

  const activeRoleLabel =
    session.role === 'buyer'
      ? t('roles.buyerBadge')
      : session.role === 'importer'
        ? t('roles.importerBadge')
        : session.role === 'vendor'
          ? t('roles.vendorBadge')
          : t('roles.merchantBadge');

  const activeRoleSummary =
    session.role === 'buyer'
      ? t('roles.buyerTag')
      : session.role === 'importer'
        ? t('roles.importerTag')
        : session.role === 'vendor'
          ? t('roles.vendorTag')
          : t('roles.merchantTag');

  const applyRoleChange = (role: Role) => {
    updateSession(current => ({ ...current, role, hasSelectedRole: true }));
    trackEvent('role_switch', { role });
    onClose?.();

    switch (role) {
      case 'merchant':
        navigate('/merchant');
        break;
      case 'vendor':
        navigate('/vendor');
        break;
      case 'importer':
      case 'buyer':
        navigate('/');
        break;
      default:
        break;
    }
  };

  const handleRoleChange = (role: Role) => {
    if (!session.isVerified && role !== 'buyer' && session.role !== role) {
      setPendingRole(role);
      setVerificationOpen(true);
      return;
    }
    applyRoleChange(role);
  };

  const handleVerificationComplete = (payload: VerificationPayload) => {
    updateSession(current => ({
      ...current,
      businessName: payload.businessName,
      isVerified: true,
      verification: {
        status: 'verified',
        ...payload,
      },
    }));
    const nextRole = pendingRole;
    setPendingRole(null);
    if (nextRole && nextRole !== session.role) {
      applyRoleChange(nextRole);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-6">
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
            description={t('roles.buyerTag')}
            onClick={() => handleRoleChange('buyer')}
          />
          <AccountRoleOption
            active={session.role === 'importer'}
            label={t('roles.importerBadge')}
            description={t('roles.importerTag')}
            onClick={() => handleRoleChange('importer')}
          />
          <AccountRoleOption
            active={session.role === 'vendor'}
            label={t('roles.vendorBadge')}
            description={t('roles.vendorTag')}
            onClick={() => handleRoleChange('vendor')}
          />
          <AccountRoleOption
            active={session.role === 'merchant'}
            label={t('roles.merchantBadge')}
            description={t('roles.merchantTag')}
            onClick={() => handleRoleChange('merchant')}
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
      </div>
      <VerificationDialog
        open={verificationOpen}
        onOpenChange={open => {
          setVerificationOpen(open);
          if (!open) {
            setPendingRole(null);
          }
        }}
        initialBusinessName={session.businessName}
        onComplete={handleVerificationComplete}
      />
    </>
  );
};

export const AccountSheet = ({ session }: { session: Session }) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const fallbackLabel = session.personalName?.trim() || session.displayName?.trim() || session.contact;
  const initials = getInitials(fallbackLabel) || fallbackLabel.slice(0, 2).toUpperCase() || '?';

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-11 w-11 rounded-2xl border border-border/80 bg-card/80 p-0 text-foreground shadow-soft hover:border-primary/50 hover:text-primary"
      onClick={() => navigate('/account')}
    >
      <Avatar className="h-full w-full rounded-2xl">
        {session.avatarUrl ? (
          <AvatarImage src={session.avatarUrl} alt={session.personalName || session.displayName || session.contact} />
        ) : (
          <AvatarFallback className="rounded-2xl bg-primary/10 text-sm font-semibold text-primary">
            {initials}
          </AvatarFallback>
        )}
      </Avatar>
      <span className="sr-only">{t('common.account')}</span>
    </Button>
  );
};
