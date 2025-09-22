import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  Loader2,
  MapPin,
  Phone,
  ShieldCheck,
  WifiOff,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { PickupQrCode } from '@/components/PickupQrCode';
import { useI18n } from '@/context/I18nContext';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { DEMO_LISTINGS, DEMO_PICKUPS, activateDemoMode, isDemoActive } from '@/lib/demoMode';
import type { OrderDetailResponse } from '@/types';

const SNAPSHOT_KEY = 'pl.pickup.snapshots';

type StoredSnapshot = {
  storedAt: string;
  data: OrderDetailResponse;
};

const loadSnapshotMap = (): Record<string, StoredSnapshot> => {
  if (typeof window === 'undefined') return {};
  try {
    const raw = window.localStorage.getItem(SNAPSHOT_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<string, StoredSnapshot>;
  } catch (error) {
    console.warn('Failed to parse pickup snapshot', error);
    return {};
  }
};

const getSnapshot = (orderId: string): OrderDetailResponse | null => {
  const map = loadSnapshotMap();
  return map[orderId]?.data ?? null;
};

const setSnapshot = (orderId: string, data: OrderDetailResponse) => {
  if (typeof window === 'undefined') return;
  const map = loadSnapshotMap();
  map[orderId] = { storedAt: new Date().toISOString(), data };
  try {
    window.localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(map));
  } catch (error) {
    console.warn('Failed to persist pickup snapshot', error);
  }
};

const derivePin = (source: string) => {
  const normalized = source.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  if (!normalized) return '000000';
  let hash = 0;
  for (const char of normalized) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_000;
  }
  return hash.toString().padStart(6, '0');
};

const formatDisplayOrderId = (value: string) => {
  const normalized = value.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  if (!normalized) return 'ORD-001';
  const suffix = normalized.slice(-3) || normalized;
  return `ORD-${suffix.padStart(3, '0')}`;
};

const deriveReleaseFromOrder = (order: OrderDetailResponse) => {
  const collectedAt = order.milestones.find(m => m.code === 'COLLECTED')?.at;
  if (collectedAt) {
    const collectedDate = new Date(collectedAt);
    return new Date(collectedDate.getTime() + 24 * 60 * 60 * 1000).toISOString();
  }
  if (order.countdown?.deadline) {
    return order.countdown.deadline;
  }
  return null;
};

const shouldShowSimulate = () => isDemoActive || import.meta.env.DEV;

const OrderPickupQr = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isOnline = useNetworkStatus();
  const { t, locale } = useI18n();
  const { toast } = useToast();

  const [snapshot, setSnapshotState] = useState<OrderDetailResponse | null>(() =>
    id ? getSnapshot(id) : null,
  );
  const [status, setStatus] = useState<'ready' | 'success'>('ready');
  const [pinRevealed, setPinRevealed] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [collectError, setCollectError] = useState<string | null>(null);
  const [releaseAt, setReleaseAt] = useState<string | null>(null);
  const [entering, setEntering] = useState(false);
  const [demoEnabled, setDemoEnabled] = useState(shouldShowSimulate());

  const viewTrackedRef = useRef(false);

  const orderQuery = useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      if (!id) throw new Error('Missing order id');
      return api<OrderDetailResponse>(`/api/orders/${id}`);
    },
    enabled: Boolean(id),
    retry: 1,
    networkMode: 'offlineFirst',
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const order = orderQuery.data ?? snapshot ?? null;

  useEffect(() => {
    const frame = requestAnimationFrame(() => setEntering(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (id && orderQuery.data) {
      setSnapshot(id, orderQuery.data);
      setSnapshotState(orderQuery.data);
    }
  }, [id, orderQuery.data]);

  useEffect(() => {
    if (orderQuery.isError && !order) {
      activateDemoMode();
      setDemoEnabled(true);
    }
  }, [orderQuery.isError, order]);

  useEffect(() => {
    if (!demoEnabled && shouldShowSimulate()) {
      setDemoEnabled(true);
    }
  }, [demoEnabled, orderQuery.data, orderQuery.isError]);

  useEffect(() => {
    if (id && !viewTrackedRef.current) {
      trackEvent('pickup_qr_view', { orderId: id });
      viewTrackedRef.current = true;
    }
  }, [id]);

  useEffect(() => {
    if (!order) return;
    const release = deriveReleaseFromOrder(order);
    if (release) {
      setReleaseAt(prev => prev ?? release);
    }
    if (['COLLECTED', 'ESCROW_RELEASED'].includes(order.status)) {
      setStatus('success');
    }
  }, [order]);

  const pinDigits = useMemo(() => derivePin(id ?? 'demo'), [id]);
  const formattedPin = `${pinDigits.slice(0, 3)} ${pinDigits.slice(3)}`;
  const displayId = id ? formatDisplayOrderId(id) : 'ORD-001';
  const qrPayload = useMemo(
    () => `pl-pickup:${id ?? 'demo'}|pin:${pinDigits}`,
    [id, pinDigits],
  );

  const listing = order?.listing ?? {
    id: DEMO_LISTINGS[0].id,
    title: DEMO_LISTINGS[0].title,
    priceXAF: DEMO_LISTINGS[0].priceXAF,
  };
  const quantity = order?.qty ?? 1;
  const pickup = order?.pickupPoint ?? {
    id: DEMO_PICKUPS[0].id,
    name: DEMO_PICKUPS[0].name,
    address: DEMO_PICKUPS[0].address,
    city: DEMO_PICKUPS[0].city,
    phone: DEMO_PICKUPS[0].phone,
  };

  const priceFormatter = useMemo(() => {
    const localeKey = locale === 'fr' ? 'fr-CM' : 'en-US';
    return new Intl.NumberFormat(localeKey, {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    });
  }, [locale]);

  const unitPriceLabel = priceFormatter.format(listing.priceXAF);
  const totalPriceLabel = priceFormatter.format(listing.priceXAF * quantity);

  const dateFormatter = useMemo(() => {
    const localeKey = locale === 'fr' ? 'fr-FR' : 'en-US';
    return new Intl.DateTimeFormat(localeKey, {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }, [locale]);

  const releaseLabel = useMemo(() => {
    if (!releaseAt) return null;
    try {
      return dateFormatter.format(new Date(releaseAt));
    } catch (error) {
      return null;
    }
  }, [releaseAt, dateFormatter]);

  const handleCopyPin = async () => {
    try {
      await navigator.clipboard.writeText(pinDigits);
      toast({ description: t('pickupQr.pinCopied') });
      trackEvent('pickup_qr_pin_copy');
    } catch (error) {
      console.error(error);
    }
  };

  const handleRevealPin = () => {
    setPinRevealed(prev => !prev);
    if (!pinRevealed) {
      trackEvent('pickup_qr_pin_reveal');
    }
  };

  const handleContactTap = () => {
    if (pickup.phone) {
      trackEvent('pickup_contact_tap', { phone: pickup.phone });
    }
  };

  const handleConfirm = async () => {
    if (!id || collecting) return;
    setCollectError(null);
    setCollecting(true);
    try {
      const response = await api<{ ok: boolean; escrowReleaseAt: string }>(
        `/api/orders/${id}/collect`,
        { method: 'POST' },
      );
      setReleaseAt(response.escrowReleaseAt ?? null);
      setStatus('success');
      trackEvent('pickup_collect_success', { orderId: id, releaseAt: response.escrowReleaseAt });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown';
      setCollectError(message);
      trackEvent('pickup_collect_fail', { errorType: message });
      toast({ description: t('pickupQr.confirmError'), variant: 'destructive' });
    } finally {
      setCollecting(false);
    }
  };

  const handleSimulate = () => {
    if (!id || status === 'success' || collecting || !demoEnabled || !isOnline) return;
    trackEvent('pickup_qr_simulate_scan', { orderId: id });
    handleConfirm();
  };

  const handleBack = () => {
    if (id) {
      navigate(`/order/${id}`);
    } else {
      navigate(-1);
    }
  };

  const showSimulate = demoEnabled && status !== 'success';

  return (
    <main className="min-h-dvh bg-background">
      <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-6 sm:px-6">
        <header className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <div className="text-right">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('pickupQr.title')}</p>
            <p className="text-sm font-semibold text-foreground">{t('pickupQr.orderLabel', { id: displayId })}</p>
          </div>
        </header>

        {!isOnline && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-dashed border-border/60 bg-amber-50/90 px-4 py-3 text-sm text-amber-800 dark:bg-amber-100/20 dark:text-amber-200">
            <WifiOff className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-medium">{t('pickupQr.offlineBanner')}</p>
              <p className="text-xs opacity-80">{t('pickupQr.offlineDetail')}</p>
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-col items-center justify-center gap-8 py-10">
          {status === 'ready' && (
            <div
              className={cn(
                'w-full rounded-[32px] border border-border bg-card/80 p-6 shadow-lg shadow-slate-900/10 backdrop-blur-sm transition-all duration-500 ease-out',
                entering ? 'opacity-100 blur-0' : 'opacity-0 blur-sm',
              )}
            >
              <div className="flex flex-col items-center gap-6">
                <div className="rounded-[28px] border border-white/80 bg-white p-5 shadow-[0_30px_80px_-40px_rgba(15,23,42,0.55)] dark:border-slate-100/10">
                  <PickupQrCode
                    value={qrPayload}
                    ariaLabel={t('pickupQr.qrAlt', { id: displayId })}
                    size={260}
                    className="transition-transform duration-700 ease-out [animation:fade-in_0.6s_ease-out]"
                  />
                </div>
                <div className="w-full space-y-4 text-center">
                  <div className="space-y-1">
                    <h1 className="text-lg font-semibold text-foreground">{listing.title}</h1>
                    <p className="text-sm text-muted-foreground">
                      {t('pickupQr.qtyPrice', { qty: quantity, price: unitPriceLabel })} · {totalPriceLabel}
                    </p>
                    <p className="text-xs text-muted-foreground">{pickup.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">{t('pickupQr.instructions')}</p>
                  <button
                    type="button"
                    onClick={handleRevealPin}
                    className="text-sm font-medium text-primary underline-offset-4 transition hover:underline"
                  >
                    {t('pickupQr.pinReveal')}
                  </button>
                  {pinRevealed && (
                    <div className="flex flex-col items-center gap-3">
                      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-muted/50 px-5 py-4">
                        <span className="select-text font-mono text-3xl tracking-[0.4em] text-foreground">
                          {formattedPin}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopyPin}
                          className="rounded-full"
                        >
                          <Copy className="mr-1.5 h-4 w-4" />
                          {t('pickupQr.pinCopy')}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t('pickupQr.pinHelper')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {status === 'success' && (
            <div
              className={cn(
                'w-full rounded-[32px] border border-emerald-200 bg-emerald-50/90 p-8 text-center shadow-lg shadow-emerald-500/10 transition-all duration-500 ease-out dark:border-emerald-300/50 dark:bg-emerald-400/10',
                entering ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4',
              )}
              aria-live="polite"
            >
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white text-emerald-500 shadow-inner">
                <CheckCircle2 className="h-10 w-10" />
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-emerald-700 dark:text-emerald-200">
                {t('pickupQr.successTitle')}
              </h2>
              {releaseLabel && (
                <div className="mt-3 flex items-center justify-center gap-2 text-sm text-emerald-800 dark:text-emerald-100">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="font-medium">
                        {t('pickupQr.successRelease', { date: releaseLabel })}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>{t('pickupQr.releaseTooltip')}</TooltipContent>
                  </Tooltip>
                </div>
              )}
              <Button
                className="mt-6 rounded-full"
                onClick={handleBack}
              >
                {t('pickupQr.viewStatus')}
              </Button>
            </div>
          )}

          <div className="w-full space-y-6">
            <div className="flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/80 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border/50 bg-background">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div className="space-y-1 text-left">
                  <p className="text-sm font-semibold text-foreground">{t('order.pickup.heading')}</p>
                  <p className="text-sm text-muted-foreground">{pickup.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {pickup.address}
                    {pickup.city ? ` · ${pickup.city}` : ''}
                  </p>
                  {pickup.phone && (
                    <a
                      href={`tel:${pickup.phone}`}
                      onClick={handleContactTap}
                      className="inline-flex items-center gap-2 text-xs font-medium text-primary"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      {pickup.phone}
                    </a>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 text-center">
              {showSimulate && (
                <Button
                  variant="outline"
                  className="rounded-full"
                  onClick={handleSimulate}
                  disabled={collecting || !isOnline}
                >
                  {collecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('pickupQr.simulate')}
                </Button>
              )}
              {collectError && status !== 'success' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-full text-sm text-muted-foreground"
                  onClick={handleConfirm}
                  disabled={collecting || !isOnline}
                >
                  {t('pickupQr.retry')}
                </Button>
              )}
              {!isOnline && status !== 'success' && (
                <p className="text-xs text-muted-foreground">{t('pickupQr.manualOffline')}</p>
              )}
              {isOnline && showSimulate && (
                <p className="text-xs text-muted-foreground">{t('pickupQr.manualDisabled')}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-4 rounded-full border border-border/60 bg-card/70 px-4 py-2 text-xs text-muted-foreground">
              <div className="inline-flex items-center gap-2 text-xs text-primary/80">
                <ShieldCheck className="h-4 w-4" />
                {t('order.escrowBadge')}
              </div>
              <span>{displayId}</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default OrderPickupQr;
