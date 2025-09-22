import { useMemo, useState } from 'react';
import { Languages, UserRound, ChevronRight } from 'lucide-react';
import { SignInFlow } from '@/components/auth/SignInFlow';
import { RoleChooser } from '@/components/auth/RoleChooser';
import { useSession } from '@/context/SessionContext';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import type { Session } from '@/types';
import { cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

const languageNames: Record<'en' | 'fr', string> = {
  en: 'English',
  fr: 'Français',
};

type Role = Session['role'];

const LanguageToggle = ({ className }: { className?: string }) => {
  const { locale, setLocale, t } = useI18n();
  const nextLocale = locale === 'en' ? 'fr' : 'en';

  return (
    <Button
      variant="outline"
      size="sm"
      className={cn('h-10 rounded-full border-primary/40 px-4 text-xs font-semibold uppercase', className)}
      onClick={() => setLocale(nextLocale)}
      aria-label={t('common.changeLanguage')}
    >
      <Languages className="h-4 w-4" />
      <span>{locale.toUpperCase()}</span>
      <span className="hidden text-muted-foreground sm:inline">{t('common.changeLanguage')}</span>
    </Button>
  );
};

const AccountSheet = ({ session }: { session: Session }) => {
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

const BuyerHome = ({ session }: { session: Session }) => {
  const { t } = useI18n();

  const stats = useMemo(
    () => [
      { label: t('dashboard.buyerStatusPool'), value: '3' },
      { label: t('dashboard.buyerStatusDeliveries'), value: '2' },
      { label: t('dashboard.buyerStatusWallet'), value: '180,000 XAF' },
    ],
    [t],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-primary/15 via-primary/5 to-background p-6 shadow-sm">
        <h2 className="text-xl font-semibold tracking-tight">
          {t('dashboard.buyerWelcome', { name: session.displayName })}
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('roles.buyerSummary')}</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('dashboard.buyerActionsTitle')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="secondary" className="h-12 rounded-xl justify-between">
            {t('dashboard.buyerActionBrowse')}
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="secondary" className="h-12 rounded-xl justify-between">
            {t('dashboard.buyerActionTrack')}
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="secondary" className="h-12 rounded-xl justify-between">
            {t('dashboard.buyerActionSupport')}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('dashboard.statusTitle')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-2xl border border-border p-4 shadow-sm">
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const ImporterDashboard = ({ session }: { session: Session }) => {
  const { t } = useI18n();

  const stats = useMemo(
    () => [
      { label: t('dashboard.importerStatusActive'), value: '2' },
      { label: t('dashboard.importerStatusLogistics'), value: '1' },
      { label: t('dashboard.importerStatusBalance'), value: '520,000 XAF' },
    ],
    [t],
  );

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-gradient-to-br from-emerald-100/40 via-background to-background p-6 shadow-sm">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold tracking-tight">
            {t('dashboard.importerWelcome', { name: session.displayName })}
          </h2>
          <Badge variant={session.verifiedImporter ? 'default' : 'secondary'}>
            {session.verifiedImporter ? t('dashboard.importerStatusVerified') : t('dashboard.importerStatusPending')}
          </Badge>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{t('roles.importerSummary')}</p>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('dashboard.importerActionsTitle')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          <Button variant="secondary" className="h-12 rounded-xl justify-between">
            {t('dashboard.importerActionCreate')}
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="secondary" className="h-12 rounded-xl justify-between">
            {t('dashboard.importerActionReview')}
            <ChevronRight className="h-5 w-5" />
          </Button>
          <Button variant="secondary" className="h-12 rounded-xl justify-between">
            {t('dashboard.importerActionDocs')}
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {t('dashboard.statusTitle')}
        </h3>
        <div className="grid gap-3 sm:grid-cols-3">
          {stats.map(stat => (
            <div key={stat.label} className="rounded-2xl border border-border p-4 shadow-sm">
              <p className="text-2xl font-semibold text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

const AuthenticatedShell = ({ session }: { session: Session }) => {
  const { t, locale } = useI18n();
  const modeLabel = session.role === 'buyer' ? t('roles.buyerBadge') : t('roles.importerBadge');

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-10">
        <header className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase text-primary/80">{t('app.tagline')}</p>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">{t('app.name')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle />
              <AccountSheet session={session} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="outline" className="rounded-full border-primary/60 bg-primary/10 px-3 py-1 text-primary">
              {modeLabel}
            </Badge>
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {languageNames[locale]}
            </span>
          </div>
        </header>

        {session.role === 'buyer' ? <BuyerHome session={session} /> : <ImporterDashboard session={session} />}
      </div>
    </main>
  );
};

const Index = () => {
  const { session, setSession, updateSession } = useSession();

  if (!session) {
    return <SignInFlow onAuthenticated={setSession} />;
  }

  if (!session.hasSelectedRole) {
    return (
      <RoleChooser
        initialRole={session.role}
        onRoleChosen={role => updateSession(current => ({ ...current, role, hasSelectedRole: true }))}
      />
    );
  }

  return <AuthenticatedShell session={session} />;
};

export default Index;
