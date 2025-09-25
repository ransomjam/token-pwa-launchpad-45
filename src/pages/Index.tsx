import { useEffect, useRef, useState } from 'react';

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
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const updateHeight = () => {
      setHeaderHeight(node.getBoundingClientRect().height);
    };

    updateHeight();

    let observer: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => updateHeight());
      observer.observe(node);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
      observer?.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  if (session.role === 'buyer') {
    return <HomeFeedWithToggle session={session} />;
  }

  const modeLabel = t('roles.importerBadge');

  return (
    <main className="relative min-h-dvh overflow-hidden bg-slate-50 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(15,191,109,0.08),transparent_55%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.12),transparent_50%)]" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header
          ref={headerRef}
          className="fixed inset-x-0 top-0 z-40 border-b border-border/40 bg-white/90 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/75"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="order-1 flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-teal/5 to-blue/10 shadow-soft">
                  <Logo wrapperClassName="h-8 w-8" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-foreground">ProList</span>
                {showPreviewBadge && (
                  <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    {t('common.preview')}
                  </Badge>
                )}
              </div>
              <div className="order-3 ml-auto flex items-center gap-2 sm:order-4 sm:ml-0 sm:gap-3">
                <InstallPwaButton className="hidden rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft sm:inline-flex" />
                <AccountSheet session={session} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <span className="pill bg-primary/20 text-primary normal-case">{modeLabel}</span>
              <span className="pill bg-blue/10 text-blue-600 normal-case">{languageNames[locale]}</span>
              <span className="pill bg-muted/60 text-muted-foreground normal-case">{session.displayName}</span>
            </div>
          </div>
        </header>

        <div aria-hidden className="shrink-0" style={{ height: headerHeight }} />

        <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 pb-12 pt-8">
          <div className="sm:hidden">
            <InstallPwaButton className="w-full rounded-2xl bg-primary/90 py-3 text-sm font-semibold text-primary-foreground shadow-soft" />
          </div>
          <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_22px_55px_rgba(14,116,144,0.08)] backdrop-blur">
            <ImporterDashboard session={session} />
          </div>
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
