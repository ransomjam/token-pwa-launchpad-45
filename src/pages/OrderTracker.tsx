import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  Loader2,
  MapPin,
  PackageCheck,
  Plane,
  QrCode,
  ShieldCheck,
  Phone,
  FileText,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useI18n } from '@/context/I18nContext';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { trackEvent } from '@/lib/analytics';
import { activateDemoMode, primaryDemoListing, primaryDemoListingId } from '@/lib/demoMode';
import { findWinByOrderId, WINS_UPDATED_EVENT } from '@/lib/auctionData';
import { DEMO_INVOICE, findStoredInvoiceByOrderId, INVOICE_UPDATED_EVENT } from '@/invoices/demoInvoice';
import { getDemoOrder } from '@/lib/demoOrderStorage';
import type { MilestoneCode, OrderDetailResponse, OrderStatus } from '@/types';

type EvidenceKind = 'supplierInvoice' | 'awb';

const milestoneOrder: MilestoneCode[] = ['POOL_LOCKED', 'SUPPLIER_PAID', 'EXPORTED', 'ARRIVED', 'COLLECTED'];

const milestoneIcons: Record<MilestoneCode, ComponentType<{ className?: string }>> = {
  POOL_LOCKED: ShieldCheck,
  SUPPLIER_PAID: BadgeCheck,
  EXPORTED: Plane,
  ARRIVED: MapPin,
  COLLECTED: PackageCheck,
};

const primaryStatuses: Partial<Record<OrderStatus, string>> = {
  POOL_LOCKED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  ESCROW_HELD: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  FULFILLING: 'bg-sky-50 text-sky-600 border-sky-200',
  ARRIVED: 'bg-indigo-50 text-indigo-600 border-indigo-200',
  COLLECTED: 'bg-purple-50 text-purple-600 border-purple-200',
  ESCROW_RELEASED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  CLOSED: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  LATE: 'bg-rose-50 text-rose-600 border-rose-200',
  REFUNDED: 'bg-slate-50 text-slate-700 border-slate-200',
};

const defaultStatusClasses = 'bg-muted/50 text-muted-foreground border-border/60';
const finalStatuses: OrderStatus[] = ['REFUNDED', 'ESCROW_RELEASED', 'CLOSED'];
const lateEligibleStatuses: OrderStatus[] = ['POOL_LOCKED', 'ESCROW_HELD', 'FULFILLING', 'ARRIVED'];

const formatOrderId = (value: string) => `#${value.slice(-6).toUpperCase()}`;

const formatCountdownTime = (seconds: number) => {
  const safeSeconds = Math.max(0, seconds);
  const days = Math.floor(safeSeconds / 86400);
  const hours = Math.floor((safeSeconds % 86400) / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const secs = safeSeconds % 60;
  const pad = (val: number) => val.toString().padStart(2, '0');
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(`${pad(hours)}h`, `${pad(minutes)}m`, `${pad(secs)}s`);
  return parts.join(' ');
};

const EvidenceCard = ({
  label,
  type,
  url,
  onOpen,
  placeholder,
  openLabel,
}: {
  label: string;
  type: EvidenceKind;
  url?: string | null;
  onOpen: (kind: EvidenceKind, link: string) => void;
  placeholder: string;
  openLabel: string;
}) => {
  const [loaded, setLoaded] = useState(false);

  if (!url) {
    return (
      <div className="flex h-full flex-col justify-between rounded-2xl border border-dashed border-border/60 bg-muted/40 p-4 text-left">
        <div className="flex h-36 items-center justify-center rounded-xl bg-muted/40">
          <span className="text-sm text-muted-foreground">{placeholder}</span>
        </div>
        <p className="mt-3 text-sm font-medium text-muted-foreground">{label}</p>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(type, url)}
      className="group flex h-full flex-col justify-between rounded-2xl border border-border bg-card/70 p-4 text-left shadow-soft transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/70"
    >
      <div className="relative h-36 overflow-hidden rounded-xl bg-muted">
        <img
          src={url}
          alt={label}
          onLoad={() => setLoaded(true)}
          className={cn(
            'h-full w-full object-cover transition-opacity duration-500 ease-out',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-between p-3 text-xs font-medium text-white">
          <span>{label}</span>
          <span>{openLabel}</span>
        </div>
      </div>
      <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
    </button>
  );
};

const OrderTracker = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const isOnline = useNetworkStatus();

  const [now, setNow] = useState(() => Date.now());
  const [invoiceVersion, setInvoiceVersion] = useState(0);
  const [actionLoading, setActionLoading] = useState<'refund' | null>(null);
  const [lightbox, setLightbox] = useState<{ type: EvidenceKind; url: string; label: string } | null>(null);
  const [refundedAt, setRefundedAt] = useState<Date | null>(null);
  const [winsVersion, setWinsVersion] = useState(0);

  const viewTrackedRef = useRef(false);
  const eligibleTrackedRef = useRef(false);

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) throw new Error('Missing order id');
      const stored = getDemoOrder(id);
      if (stored) return stored;
      return api<OrderDetailResponse>(`/api/orders/${id}`);
    },
    enabled: Boolean(id),
    staleTime: 0,
    refetchOnWindowFocus: false,
    initialData: () => {
      if (!id) return undefined;
      return getDemoOrder(id) ?? undefined;
    },
  });

  const order = orderQuery.data;

  useEffect(() => {
    if (orderQuery.isError && !order) {
      activateDemoMode();
    }
  }, [order, orderQuery.isError]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    viewTrackedRef.current = false;
    eligibleTrackedRef.current = false;
    setRefundedAt(null);
    setLightbox(null);
  }, [id]);

  useEffect(() => {
    if (!order || !id || viewTrackedRef.current) return;
    trackEvent('order_view', { orderId: id });
    viewTrackedRef.current = true;
  }, [id, order]);

  useEffect(() => {
    if (!id) return;
    const interval = window.setInterval(() => {
      if (!isOnline) return;
      trackEvent('order_refresh_auto', { orderId: id, reason: 'interval' });
      orderQuery.refetch();
    }, 30_000);
    return () => window.clearInterval(interval);
  }, [id, isOnline, orderQuery]);

  useEffect(() => {
    if (!id) return;
    const handleFocus = () => {
      if (!isOnline) return;
      trackEvent('order_refresh_auto', { orderId: id, reason: 'focus' });
      orderQuery.refetch();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id, isOnline, orderQuery]);

  useEffect(() => {
    const handleWinsUpdate = () => setWinsVersion(prev => prev + 1);
    window.addEventListener(WINS_UPDATED_EVENT, handleWinsUpdate);
    window.addEventListener('storage', handleWinsUpdate);
    return () => {
      window.removeEventListener(WINS_UPDATED_EVENT, handleWinsUpdate);
      window.removeEventListener('storage', handleWinsUpdate);
    };
  }, []);

  useEffect(() => {
    const handleInvoiceUpdate = () => setInvoiceVersion(prev => prev + 1);
    window.addEventListener(INVOICE_UPDATED_EVENT, handleInvoiceUpdate);
    window.addEventListener('storage', handleInvoiceUpdate);
    return () => {
      window.removeEventListener(INVOICE_UPDATED_EVENT, handleInvoiceUpdate);
      window.removeEventListener('storage', handleInvoiceUpdate);
    };
  }, []);

  const deadlineDate = useMemo(() => {
    if (!order) return null;
    return new Date(order.countdown.deadline);
  }, [order]);

  const secondsLeft = useMemo(() => {
    if (!deadlineDate) return null;
    return Math.max(0, Math.floor((deadlineDate.getTime() - now) / 1000));
  }, [deadlineDate, now]);

  const relatedWin = useMemo(() => {
    if (!id) return undefined;
    return findWinByOrderId(id);
  }, [id, winsVersion]);

  const storedInvoice = useMemo(() => {
    if (!id) return null;
    return findStoredInvoiceByOrderId(id);
  }, [id, invoiceVersion]);

  const relatedInvoiceNo = storedInvoice?.invoiceNo ?? relatedWin?.checkout?.invoiceNo ?? DEMO_INVOICE.invoiceNo;
  const canViewInvoice = Boolean(
    (relatedWin && (relatedWin.status === 'paid_pickup_selected' || relatedWin.status === 'completed')) ||
      storedInvoice?.paymentStatus === 'PAID'
  );

  const handleInvoiceShortcut = () => {
    if (!id) return;
    trackEvent('order_view_invoice', { orderId: id, winId: relatedWin?.id ?? 'preorder' });
    navigate(`/invoice/${relatedInvoiceNo}`);
  };

  const derivedStatus = useMemo<OrderStatus | null>(() => {
    if (!order) return null;
    if (order.status === 'REFUNDED') return 'REFUNDED';
    if (order.status === 'ESCROW_RELEASED' || order.status === 'CLOSED') return order.status;
    if (order.status === 'LATE') return 'LATE';
    if (secondsLeft !== null && secondsLeft <= 0 && lateEligibleStatuses.includes(order.status)) {
      return 'LATE';
    }
    return order.status;
  }, [order, secondsLeft]);

  const statusLabel = derivedStatus ? t(`order.status.${derivedStatus}`) : '—';
  const statusClasses = derivedStatus ? primaryStatuses[derivedStatus] ?? defaultStatusClasses : defaultStatusClasses;

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );

  useEffect(() => {
    if (!order || order.status !== 'REFUNDED' || refundedAt) return;
    const collectedAt = order.milestones.find(m => m.code === 'COLLECTED')?.at;
    const fallback = collectedAt ?? order.countdown.deadline;
    if (fallback) {
      setRefundedAt(new Date(fallback));
    }
  }, [order, refundedAt]);

  const releaseEstimate = useMemo(() => {
    const collectedAt = order?.milestones.find(m => m.code === 'COLLECTED')?.at;
    if (!collectedAt) return null;
    const base = new Date(collectedAt).getTime();
    return new Date(base + 24 * 60 * 60 * 1000);
  }, [order?.milestones]);

  const timeline = useMemo(() => {
    if (!order) return [];
    let pendingMarked = false;
    return milestoneOrder.map(code => {
      const existing = order.milestones.find(item => item.code === code) ?? { code, at: null };
      const completed = Boolean(existing.at);
      const current = !completed && !pendingMarked;
      if (!completed && !pendingMarked) pendingMarked = true;
      return { ...existing, completed, current };
    });
  }, [order]);

  const countdownActive = derivedStatus && !finalStatuses.includes(derivedStatus);
  const isLate = derivedStatus === 'LATE';
  const countdownText = useMemo(() => {
    if (!order || secondsLeft === null || !derivedStatus) return '';
    if (!countdownActive) {
      if (derivedStatus === 'REFUNDED') return t('order.countdownBanner.refunded');
      if (derivedStatus === 'ESCROW_RELEASED' || derivedStatus === 'CLOSED') return t('order.countdownBanner.released');
      return '';
    }
    if (isLate) {
      return t('order.countdownBanner.late');
    }
    return t('order.countdownBanner.active', { time: formatCountdownTime(secondsLeft) });
  }, [order, secondsLeft, derivedStatus, countdownActive, isLate, t]);

  const countdownAria = useMemo(() => {
    if (!countdownActive || secondsLeft === null) return undefined;
    if (isLate) return t('order.countdownLateAria');
    return t('order.countdownAria', { time: formatCountdownTime(secondsLeft) });
  }, [countdownActive, secondsLeft, isLate, t]);

  const deadlineLabel = deadlineDate ? dateFormatter.format(deadlineDate) : null;

  const distanceLocale = locale === 'fr' ? frLocale : undefined;
  const lastUpdatedLabel = orderQuery.dataUpdatedAt
    ? formatDistanceToNow(orderQuery.dataUpdatedAt, { addSuffix: false, locale: distanceLocale })
    : null;

  const canRefund = Boolean(order && (order.eligibility.canRefund || derivedStatus === 'LATE'));
  const canDispute = Boolean(order?.eligibility.canDispute);

  useEffect(() => {
    if (!order || !id) return;
    if (canRefund && !eligibleTrackedRef.current) {
      trackEvent('refund_eligible_view', { orderId: id });
      eligibleTrackedRef.current = true;
    }
  }, [canRefund, id, order]);

  const handleRefund = useCallback(async () => {
    if (!id || !order || !canRefund) return;
    setActionLoading('refund');
    trackEvent('refund_request_click', { orderId: id });
    try {
      await api(`/api/orders/${id}/refund`, { method: 'POST' });
      trackEvent('refund_success', { orderId: id });
      setRefundedAt(new Date());
      await orderQuery.refetch();
    } catch (error) {
      console.error(error);
    } finally {
      setActionLoading(null);
    }
  }, [canRefund, id, order, orderQuery]);

  const handleManualRefresh = () => {
    if (!id) return;
    trackEvent('order_refresh_manual', { orderId: id });
    orderQuery.refetch();
  };

  const handleEvidenceOpen = (type: EvidenceKind, url: string) => {
    const label = type === 'awb' ? t('order.evidence.awb') : t('order.evidence.supplierInvoice');
    if (id) {
      trackEvent('evidence_open', { orderId: id, type });
    }
    setLightbox({ type, url, label });
  };

  const handleOpenQr = () => {
    if (!id) return;
    trackEvent('pickup_qr_open', { orderId: id });
    navigate(`/order/${id}/qr`);
  };

  const handleOpenDispute = () => {
    if (!id) return;
    trackEvent('dispute_open_click', { orderId: id });
    window.location.href = `mailto:${t('order.actions.contactEmail')}?subject=Dispute%20${id}`;
  };

  const contactEmail = t('order.actions.contactEmail');

  return (
    <main className="min-h-dvh bg-background pb-24">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <header className="space-y-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full border"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">Back</span>
            </Button>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('order.title')}</p>
              <h1 className="text-xl font-semibold text-foreground">{t('order.subtitle')}</h1>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card/70 px-6 py-5 shadow-soft">
            {order ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{t('order.headerLabel')}</span>
                  <span className="text-lg font-semibold text-foreground">{formatOrderId(order.id)}</span>
                  {deadlineLabel && (
                    <span className="text-xs text-muted-foreground">{deadlineLabel}</span>
                  )}
                </div>
                <div className="flex flex-col items-start gap-3 sm:items-end">
                  <div
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full border px-4 py-1 text-sm font-medium transition-colors',
                      statusClasses,
                    )}
                    aria-live="polite"
                    role="status"
                  >
                    <span className="inline-flex h-2 w-2 rounded-full bg-current" />
                    {statusLabel}
                  </div>
                  {canViewInvoice && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full px-3 text-xs font-medium"
                      onClick={handleInvoiceShortcut}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      {t('winnerCheckout.actions.viewInvoice')}
                    </Button>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <Badge
                      variant="outline"
                      className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 text-primary"
                    >
                      <ShieldCheck className="h-4 w-4" />
                      {t('order.escrowBadge')}
                    </Badge>
                    <button
                      type="button"
                      className="text-xs font-medium text-primary underline-offset-4 transition hover:underline"
                      onClick={() => window.open(`/policy/refunds?orderId=${id ?? ''}&source=order`, '_blank')}
                    >
                      {t('order.viewRefundPolicy')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Skeleton className="h-20 rounded-2xl" />
                <Skeleton className="h-20 rounded-2xl" />
              </div>
            )}
          </div>
        </header>

        {!isOnline && order && (
          <div className="flex items-center justify-between rounded-2xl border border-dashed border-border/60 bg-muted/40 px-4 py-3 text-sm">
            <span className="font-medium text-foreground">{t('order.offline.title')}</span>
            {lastUpdatedLabel && (
              <span className="text-muted-foreground">
                {t('order.offline.lastUpdated', { time: lastUpdatedLabel })}
              </span>
            )}
          </div>
        )}

        {orderQuery.isLoading && (
          <div className="space-y-6">
            <Skeleton className="h-32 w-full rounded-3xl" />
            <Skeleton className="h-72 w-full rounded-3xl" />
            <Skeleton className="h-48 w-full rounded-3xl" />
          </div>
        )}

        {orderQuery.isError && !order && (
          <div className="space-y-4 rounded-3xl border border-amber-200 bg-amber-50/90 p-6 text-left shadow-soft">
            <Badge variant="outline" className="rounded-full border-dashed border-amber-300 bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-700">
              {t('home.demoData')}
            </Badge>
            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">{t('order.demoFallbackTitle')}</p>
              <p className="text-sm text-muted-foreground">
                {t('order.demoFallbackSubtitle', { listing: primaryDemoListing.title })}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button className="rounded-full" onClick={() => navigate(`/listings/${primaryDemoListingId}`)}>
                {t('order.backToListing')}
              </Button>
            </div>
          </div>
        )}

        {order && (
          <>
            {countdownText && (
              <section
                aria-label={countdownAria ?? countdownText}
                className={cn(
                  'space-y-4 rounded-3xl border p-6 shadow-soft transition-colors',
                  countdownActive
                    ? isLate
                      ? 'border-rose-200 bg-rose-50'
                      : 'border-primary/20 bg-primary/10'
                    : derivedStatus === 'REFUNDED'
                      ? 'border-border bg-card/70'
                      : 'border-emerald-200 bg-emerald-50',
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full border border-border/50 bg-background shadow-sm">
                    <Clock className={cn('h-5 w-5', isLate ? 'text-rose-500' : 'text-primary')} />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-sm font-medium text-foreground" aria-live="polite" aria-atomic="true">
                      {countdownText}
                    </p>
                    {countdownActive && secondsLeft !== null && !isLate && (
                      <p className="font-mono text-sm text-muted-foreground tabular-nums" aria-live="off">
                        {formatCountdownTime(secondsLeft)}
                      </p>
                    )}
                    {deadlineLabel && countdownActive && (
                      <p className="text-xs text-muted-foreground">{deadlineLabel}</p>
                    )}
                  </div>
                </div>
              </section>
            )}

            <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-semibold text-foreground">{t('order.timelineTitle')}</p>
                <Separator className="flex-1" />
              </div>
              <ul className="space-y-6" aria-live="polite">
                {timeline.map((item, index) => {
                  const Icon = milestoneIcons[item.code];
                  const nextLine = index < timeline.length - 1;
                  const timestamp = item.at ? dateFormatter.format(new Date(item.at)) : t('order.milestonePending');
                  return (
                    <li
                      key={item.code}
                      tabIndex={0}
                      className="flex gap-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2"
                      aria-label={`${t(`order.milestone.${item.code}`)} · ${timestamp}`}
                    >
                      <div className="flex flex-col items-center">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-full border text-sm font-semibold transition-all duration-300 ease-out',
                            item.completed
                              ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                              : item.current
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-border bg-background text-muted-foreground',
                          )}
                        >
                          {item.completed ? (
                            <Check className="h-5 w-5 animate-in fade-in zoom-in-95" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                        </div>
                        {nextLine && (
                          <div
                            className={cn(
                              'mt-1 w-px flex-1 rounded-full border border-dashed',
                              item.completed ? 'border-primary/40' : 'border-border/70',
                            )}
                          />
                        )}
                      </div>
                      <div className="flex-1 rounded-2xl border border-border/60 bg-background/60 p-4 shadow-sm transition-colors">
                        <p className="text-sm font-semibold text-foreground">
                          {t(`order.milestone.${item.code}`)}
                        </p>
                        <p className="text-xs text-muted-foreground">{timestamp}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-semibold text-foreground">{t('order.evidenceTitle')}</p>
                <Separator className="flex-1" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <EvidenceCard
                  label={t('order.evidence.supplierInvoice')}
                  type="supplierInvoice"
                  url={order.evidence?.supplierInvoice}
                  onOpen={handleEvidenceOpen}
                  placeholder={t('order.evidence.placeholder')}
                  openLabel={t('order.evidence.open', { label: t('order.evidence.supplierInvoice') })}
                />
                <EvidenceCard
                  label={t('order.evidence.awb')}
                  type="awb"
                  url={order.evidence?.awb}
                  onOpen={handleEvidenceOpen}
                  placeholder={t('order.evidence.placeholder')}
                  openLabel={t('order.evidence.open', { label: t('order.evidence.awb') })}
                />
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-semibold text-foreground">{t('order.pickupTitle')}</p>
                <Separator className="flex-1" />
              </div>
              <div className="flex flex-col gap-4 rounded-2xl border border-border/70 bg-background/60 p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">{t('order.pickup.heading')}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.pickupPoint?.name ?? t('order.pickup.awaiting')}
                      </p>
                      {order.pickupPoint?.address && (
                        <p className="text-xs text-muted-foreground">{order.pickupPoint.address}</p>
                      )}
                      {order.pickupPoint?.phone && (
                        <a
                          href={`tel:${order.pickupPoint.phone}`}
                          className="inline-flex items-center gap-2 text-xs font-medium text-primary"
                        >
                          <Phone className="h-3.5 w-3.5" />
                          {order.pickupPoint.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className="rounded-full"
                    onClick={handleOpenQr}
                  >
                    <QrCode className="mr-2 h-4 w-4" />
                    {t('order.pickup.openQr')}
                  </Button>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  {derivedStatus === 'ARRIVED' && (
                    <p>{t('order.pickup.instructions')}</p>
                  )}
                  {derivedStatus === 'COLLECTED' && releaseEstimate && (
                    <p>{t('order.pickup.release', { date: dateFormatter.format(releaseEstimate) })}</p>
                  )}
                  {(derivedStatus === 'ESCROW_RELEASED' || derivedStatus === 'CLOSED') && releaseEstimate && (
                    <p>{t('order.pickup.released', { date: dateFormatter.format(releaseEstimate) })}</p>
                  )}
                  {derivedStatus === 'REFUNDED' && (
                    <p>
                      {t('order.pickup.refunded', {
                        date: refundedAt ? dateFormatter.format(refundedAt) : deadlineLabel ?? '',
                      })}
                    </p>
                  )}
                </div>
              </div>
            </section>

            <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-6 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <p className="text-base font-semibold text-foreground">{t('order.actionsTitle')}</p>
                <Separator className="flex-1" />
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Tooltip disableHoverableContent={!canRefund}>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        className="rounded-full"
                        onClick={handleRefund}
                        disabled={!canRefund || actionLoading === 'refund'}
                      >
                        {actionLoading === 'refund' && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {t('order.actions.requestRefund')}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canRefund && (
                    <TooltipContent>{t('order.actions.disabledLate')}</TooltipContent>
                  )}
                </Tooltip>

                <Tooltip disableHoverableContent={canDispute}>
                  <TooltipTrigger asChild>
                    <span>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={handleOpenDispute}
                        disabled={!canDispute}
                      >
                        {t('order.actions.openDispute')}
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {!canDispute && (
                    <TooltipContent>{t('order.actions.disabledDispute')}</TooltipContent>
                  )}
                </Tooltip>

                <Button variant="ghost" className="rounded-full" asChild>
                  <a href={`mailto:${contactEmail}`}>
                    {t('order.actions.contactSupport')}
                  </a>
                </Button>
              </div>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/60 bg-card/50 px-4 py-3 text-sm text-muted-foreground">
              <button
                type="button"
                onClick={handleManualRefresh}
                className="inline-flex items-center gap-2 text-primary underline-offset-4 transition hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                disabled={orderQuery.isFetching}
              >
                {orderQuery.isFetching && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('order.refreshManual')}
              </button>
              {lastUpdatedLabel && (
                <span>{t('order.offline.lastUpdated', { time: lastUpdatedLabel })}</span>
              )}
            </div>
          </>
        )}
      </div>

      <Dialog open={Boolean(lightbox)} onOpenChange={open => !open && setLightbox(null)}>
        <DialogContent className="max-w-xl">
          {lightbox && (
            <>
              <DialogHeader>
                <DialogTitle>{lightbox.label}</DialogTitle>
              </DialogHeader>
              <div className="overflow-hidden rounded-2xl bg-black/5">
                <img src={lightbox.url} alt={lightbox.label} className="h-full w-full object-contain" />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default OrderTracker;
