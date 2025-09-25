import { SignInFlow } from '@/components/auth/SignInFlow';
import { RoleChooser } from '@/components/auth/RoleChooser';
import { useSession } from '@/context/SessionContext';
import { useI18n } from '@/context/I18nContext';
import type { Session } from '@/types';
import { HomeFeedWithToggle } from '@/components/home/HomeFeedWithToggle';
import { AccountSheet, languageNames } from '@/components/shell/AccountControls';
import { ImporterDashboard } from '@/components/importer/ImporterDashboard';
import { Logo } from '@/components/Logo';
import { InstallPwaButton } from '@/components/pwa/InstallPwaButton';
import { Badge } from '@/components/ui/badge';

const AuthenticatedShell = ({ session }: { session: Session }) => {
  const { t, locale } = useI18n();
  const showPreviewBadge = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

  if (session.role === 'buyer') {
    return <HomeFeedWithToggle session={session} />;
  }

  const modeLabel = t('roles.importerBadge');

  return (
    <main className="relative min-h-dvh overflow-hidden text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-white/80 via-white/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />
      <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-8 px-6 py-10">
        <header className="sticky top-6 z-20 flex flex-col gap-5 rounded-3xl bg-background p-6 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="sm:order-1">
              <AccountSheet session={session} />
            </div>
            <div className="flex items-center justify-end gap-3 sm:order-3">
              <InstallPwaButton className="shadow-glow sm:order-2" />
              <div className="glass-card inline-flex items-center justify-center rounded-3xl p-3 shadow-lux">
                <Logo className="h-[4.5rem] w-auto drop-shadow-[0_18px_40px_-16px_rgba(15,191,109,0.45)]" />
              </div>
              {showPreviewBadge && (
                <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {t('common.preview')}
                </Badge>
              )}
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
