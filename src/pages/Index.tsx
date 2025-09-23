import { SignInFlow } from '@/components/auth/SignInFlow';
import { RoleChooser } from '@/components/auth/RoleChooser';
import { useSession } from '@/context/SessionContext';
import { useI18n } from '@/context/I18nContext';
import { Badge } from '@/components/ui/badge';
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
