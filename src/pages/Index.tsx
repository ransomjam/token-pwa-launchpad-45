import { SignInFlow } from '@/components/auth/SignInFlow';
import { RoleChooser } from '@/components/auth/RoleChooser';
import { useSession } from '@/context/SessionContext';
import { useI18n } from '@/context/I18nContext';
import type { Session } from '@/types';
import { HomeFeed } from '@/components/home/HomeFeed';
import { AccountSheet, LanguageToggle, languageNames } from '@/components/shell/AccountControls';
import { ImporterDashboard } from '@/components/importer/ImporterDashboard';

const AuthenticatedShell = ({ session }: { session: Session }) => {
  const { t, locale } = useI18n();

  if (session.role === 'buyer') {
    return <HomeFeed session={session} />;
  }

  const modeLabel = t('roles.importerBadge');

  return (
    <main className="relative min-h-dvh overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/80 via-white/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-10">
        <header className="glass-card flex flex-col gap-6 px-6 py-6 shadow-lux">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">{t('app.tagline')}</p>
              <h1 className="text-4xl font-semibold tracking-tight text-foreground">{t('app.name')}</h1>
            </div>
            <div className="flex items-center gap-3">
              <LanguageToggle className="rounded-2xl border border-white/40 bg-white/70 px-3 py-2 text-sm font-semibold text-muted-foreground shadow-sm backdrop-blur transition-colors hover:border-primary/40 hover:text-primary" />
              <AccountSheet session={session} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="pill bg-primary/20 text-primary normal-case">{modeLabel}</span>
            <span className="pill bg-white/75 text-muted-foreground/80 normal-case">{languageNames[locale]}</span>
          </div>
        </header>

        <div className="glass-card px-4 py-6 shadow-soft">
          <ImporterDashboard session={session} />
        </div>
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
