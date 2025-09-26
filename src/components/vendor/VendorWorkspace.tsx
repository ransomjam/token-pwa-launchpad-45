import { useEffect, useRef, useState } from 'react';
import { Plus, ChevronDown, Gavel, Package, Users, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InstallPwaButton } from '@/components/pwa/InstallPwaButton';
import { AccountSheet, languageNames } from '@/components/shell/AccountControls';
import { trackEvent } from '@/lib/analytics';
import type { Session } from '@/types';
import { VendorAuctions } from './VendorAuctions';
import { VendorListings } from './VendorListings';
import { VendorWinnersOrders } from './VendorWinnersOrders';
import { CreateActionSheet } from './CreateActionSheet';

type VendorWorkspaceProps = {
  session: Session;
};

export const VendorWorkspace = ({ session }: VendorWorkspaceProps) => {
  const { t, locale } = useI18n();
  const showPreviewBadge = import.meta.env.MODE !== 'production' || import.meta.env.DEV;
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [activeTab, setActiveTab] = useState<'auctions' | 'listings' | 'orders'>('auctions');
  const [showCreateSheet, setShowCreateSheet] = useState(false);

  useEffect(() => {
    trackEvent('vendor_workspace_view', { userId: session.userId });
  }, [session.userId]);

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

  const modeLabel = t('roles.vendorBadge');

  // Demo KPIs - in real app would come from API
  const kpis = [
    { label: t('vendor.kpiLiveAuctions'), value: '3', icon: Gavel },
    { label: t('vendor.kpiLiveListings'), value: '12', icon: Package },
    { label: t('vendor.kpiOnTime'), value: '94%', icon: Users },
    { label: t('vendor.kpiDisputes'), value: '2%', icon: AlertTriangle },
  ];

  const tabs = [
    { key: 'auctions' as const, label: t('vendor.auctionsTab'), icon: Gavel },
    { key: 'listings' as const, label: t('vendor.directListingsTab'), icon: Package },
    { key: 'orders' as const, label: t('vendor.winnersOrdersTab'), icon: Users },
  ];

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
              
              <div className="order-2 flex items-center gap-2 sm:order-3">
                <Button
                  onClick={() => setShowCreateSheet(true)}
                  className="flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('vendor.createAction')}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
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

          {/* KPI Strip */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {kpis.map((kpi, index) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={index}
                  className="rounded-2xl border border-white/80 bg-white/90 p-4 shadow-soft backdrop-blur"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                      <p className="truncate text-xs text-muted-foreground">{kpi.label}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tabs */}
          <div className="rounded-3xl border border-white/80 bg-white/90 shadow-[0_22px_55px_rgba(14,116,144,0.08)] backdrop-blur">
            <div className="border-b border-border/40 px-6 pt-6">
              <div className="flex space-x-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                        isActive
                          ? 'border-primary text-primary'
                          : 'border-transparent text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'auctions' && <VendorAuctions />}
              {activeTab === 'listings' && <VendorListings />}
              {activeTab === 'orders' && <VendorWinnersOrders />}
            </div>
          </div>
        </div>
      </div>

      <CreateActionSheet
        open={showCreateSheet}
        onOpenChange={setShowCreateSheet}
      />
    </main>
  );
};