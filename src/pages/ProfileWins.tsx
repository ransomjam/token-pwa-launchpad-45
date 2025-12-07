import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, MapPin, ShieldCheck, Trophy } from 'lucide-react';

import { AppNav } from '@/components/navigation/AppNav';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import { getAuctionById, isDemoWinsSeed, loadWins, WINS_UPDATED_EVENT } from '@/lib/auctionData';
import { cn } from '@/lib/utils';
import { DEMO_INVOICE } from '@/invoices/demoInvoice';
import type { AuctionListing, AuctionWin } from '@/types/auctions';

const PREVIEW_BADGE_VISIBLE = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

type CheckoutStep = 'payment' | 'pickup' | 'invoice';

type PrimaryAction = {
  labelKey: string;
  step: CheckoutStep;
};

type StatusConfig = {
  tone: string;
  action: PrimaryAction;
};

const STATUS_CONFIG: Record<AuctionWin['status'], StatusConfig> = {
  pending_payment: {
    tone: 'border-amber-200 bg-amber-50 text-amber-800',
    action: { labelKey: 'profile.wins.actions.payNow', step: 'payment' },
  },
  paid_pickup_pending: {
    tone: 'border-primary/40 bg-primary/10 text-primary',
    action: { labelKey: 'profile.wins.actions.choosePickup', step: 'pickup' },
  },
  paid_pickup_selected: {
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    action: { labelKey: 'profile.wins.actions.viewInvoice', step: 'invoice' },
  },
  completed: {
    tone: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    action: { labelKey: 'profile.wins.actions.viewInvoice', step: 'invoice' },
  },
};

const resolveAuction = (win: AuctionWin): AuctionListing | null => {
  const auction = getAuctionById(win.auctionId);
  return auction ?? null;
};

const ProfileWins = () => {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [wins, setWins] = useState<AuctionWin[]>(() => loadWins());
  const usingDemoData = useMemo(() => isDemoWinsSeed(), []);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );

  useEffect(() => {
    const handleUpdate = () => setWins(loadWins());
    window.addEventListener(WINS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(WINS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const handleBack = () => navigate(-1);

  const handleOpenCheckout = (win: AuctionWin, step: CheckoutStep) => {
    trackEvent('profile_wins_checkout_open', { winId: win.id, step });
    if (step === 'invoice') {
      const invoiceNo = win.checkout?.invoiceNo ?? DEMO_INVOICE.invoiceNo;
      navigate(`/invoice/${invoiceNo}`);
      return;
    }
    navigate(`/profile/wins/${win.id}/checkout?step=${step}`);
  };

  const handleTrackOrder = (win: AuctionWin) => {
    const orderId = win.checkout?.orderId;
    if (!orderId) return;
    trackEvent('profile_wins_order_track', { winId: win.id, orderId });
    navigate(`/order/${orderId}`);
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number') return '—';
    return currencyFormatter.format(value);
  };

  const formatWonDate = (value: string) => {
    try {
      return dateFormatter.format(new Date(value));
    } catch (error) {
      return value;
    }
  };

  const computePayDeadline = (win: AuctionWin) => {
    if (win.status !== 'pending_payment') return null;
    try {
      const wonAt = new Date(win.wonAt);
      const deadline = new Date(wonAt.getTime() + 24 * 60 * 60 * 1000);
      return dateFormatter.format(deadline);
    } catch (error) {
      return null;
    }
  };

  const renderWinCard = (win: AuctionWin) => {
    const auction = resolveAuction(win);
    const statusConfig = STATUS_CONFIG[win.status];
    const statusLabel = t(`profile.wins.status.${win.status}`);
    const primaryAction = statusConfig.action;
    const price = win.checkout?.totalDueXAF ?? win.payment?.totalDueXAF ?? win.finalBidXAF;
    const sellerName = win.checkout?.sellerName ?? auction?.seller?.name;
    const payDeadline = computePayDeadline(win);
    const etaLabel = win.checkout?.pickupWindowLabel;
    const thumbnail = auction?.images?.[0] ?? null;
    const canTrackOrder = Boolean(win.checkout?.orderId);

    return (
      <article key={win.id} className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-soft">
        <div className="flex items-start gap-4">
          <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
            {thumbnail ? (
              <img src={thumbnail} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-muted-foreground">
                {t('profile.wins.thumbnailFallback')}
              </div>
            )}
          </div>
          <div className="flex-1 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-foreground">
                  {auction?.title ?? t('profile.wins.fallbackTitle')}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {t('profile.wins.wonOn', { date: formatWonDate(win.wonAt) })}
                </p>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold',
                  statusConfig.tone,
                )}
              >
                <Trophy className="h-3.5 w-3.5" />
                {statusLabel}
              </Badge>
            </div>

            <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
              <div className="flex flex-col rounded-2xl bg-muted/30 px-3 py-2">
                <span className="font-medium text-foreground">
                  {formatCurrency(price)}
                </span>
                <span>{t('profile.wins.card.totalLabel')}</span>
              </div>
              {sellerName && (
                <div className="flex flex-col rounded-2xl bg-muted/30 px-3 py-2">
                  <span className="font-medium text-foreground">{sellerName}</span>
                  <span>{t('profile.wins.card.sellerLabel')}</span>
                </div>
              )}
              {etaLabel && (
                <div className="flex items-center gap-2 rounded-2xl bg-muted/20 px-3 py-2">
                  <MapPin className="h-4 w-4 text-primary" />
                  <div className="flex-1">
                    <p className="text-xs font-medium text-foreground">{etaLabel}</p>
                    <p>{t('profile.wins.card.pickupEta')}</p>
                  </div>
                </div>
              )}
              {payDeadline && (
                <div className="flex flex-col rounded-2xl bg-amber-50/80 px-3 py-2 text-amber-800">
                  <span className="font-medium">{payDeadline}</span>
                  <span>{t('profile.wins.card.payBy')}</span>
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Button className="rounded-full" onClick={() => handleOpenCheckout(win, primaryAction.step)}>
                {t(primaryAction.labelKey)}
              </Button>
              {canTrackOrder && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={() => handleTrackOrder(win)}
                >
                  {t('profile.wins.actions.trackOrder')}
                </Button>
              )}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-[11px] font-medium text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              {t('profile.wins.card.escrowLine')}
            </div>
          </div>
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('common.back')}</span>
            </Button>
            <div className="flex flex-1 flex-col items-center gap-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">{t('profile.wins.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('profile.wins.subtitle')}</p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/60 hover:text-primary"
                onClick={() => navigate('/account/switch-role')}
              >
                <ArrowLeftRight className="h-5 w-5" />
                <span className="sr-only">{t('roles.switchTitle')}</span>
              </Button>
              {PREVIEW_BADGE_VISIBLE ? (
                <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-muted-foreground">
                  {t('common.preview')}
                </Badge>
              ) : null}
            </div>
          </div>
          <AppNav className="justify-center" />
        </header>

        {usingDemoData && (
          <Badge
            variant="outline"
            className="mx-auto rounded-full border-dashed border-border/60 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground"
          >
            {t('home.demoData')}
          </Badge>
        )}

        {wins.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border/70 bg-card/80 p-6 text-center shadow-soft">
            <p className="text-base font-semibold text-foreground">{t('profile.wins.emptyTitle')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('profile.wins.emptySubtitle')}</p>
          </div>
        ) : (
          <div className="space-y-4">{wins.map(renderWinCard)}</div>
        )}
      </div>
    </main>
  );
};

export default ProfileWins;
