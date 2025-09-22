import { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';
import { SignInFlow } from '@/components/auth/SignInFlow';
import { RoleChooser } from '@/components/auth/RoleChooser';
import { useSession } from '@/context/SessionContext';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Session } from '@/types';
import { HomeFeed } from '@/components/home/HomeFeed';
import { AccountSheet, LanguageToggle, languageNames } from '@/components/shell/AccountControls';

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

  if (session.role === 'buyer') {
    return <HomeFeed session={session} />;
  }

  const modeLabel = t('roles.importerBadge');

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

        <ImporterDashboard session={session} />
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
