import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { Minus, Plus, MapPin, ShieldCheck, CheckCircle2, ChevronRight, Loader2, ArrowLeft, X } from 'lucide-react';
import type { ListingSummary, PickupPoint } from '@/types';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';
import { useI18n } from '@/context/I18nContext';
import {
  CheckoutDraft,
  CheckoutPaymentMethod,
  getCheckoutDraft,
  getLastPaymentMethod,
  getLastPickupId,
  setCheckoutDraft,
  setLastPaymentMethod,
  setLastPickupId,
} from '@/lib/checkoutStorage';
import { activateDemoMode, DEMO_PICKUPS, getDemoListingById, isDemoActive, primaryDemoListing } from '@/lib/demoMode';
import { saveDemoOrder, type DemoOrderRecord } from '@/lib/demoOrderStorage';
import { generateOrderId } from '@/lib/invoice';
import { DEMO_INVOICE, findStoredInvoiceByOrderId, saveStoredInvoice } from '@/invoices/demoInvoice';
import { applyPreorderToInvoice, DEMO_PREORDER_ORDER } from '@/invoices/preorderApply';

const paymentOptions: { id: CheckoutPaymentMethod; labelKey: string; hintKey: string }[] = [
  { id: 'mtn', labelKey: 'checkout.paymentOptions.mtn', hintKey: 'checkout.paymentHints.mtn' },
  { id: 'orange', labelKey: 'checkout.paymentOptions.orange', hintKey: 'checkout.paymentHints.orange' },
];

const Checkout = () => {
  const params = useParams<{ listingId: string }>();
  const { listingId } = params;
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const [qty, setQty] = useState(1);
  const [selectedPickupId, setSelectedPickupId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<CheckoutPaymentMethod | null>(null);
  const [pickupSheetOpen, setPickupSheetOpen] = useState(false);
  const [policyOpen, setPolicyOpen] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [demoActive, setDemoActive] = useState(() => isDemoActive);
  const initialisedRef = useRef(false);

  const locationState = (location.state as CheckoutDraft | undefined) ?? undefined;

  useEffect(() => {
    if (initialisedRef.current) return;
    if (!listingId) {
      initialisedRef.current = true;
      return;
    }
    const draft = getCheckoutDraft();
    const lastPayment = getLastPaymentMethod();
    const lastPickup = getLastPickupId();
    const stateForListing = locationState && locationState.listingId === listingId ? locationState : undefined;
    const draftForListing = draft && draft.listingId === listingId ? draft : undefined;

    const initialQty = stateForListing?.qty ?? draftForListing?.qty ?? 1;
    setQty(initialQty);

    const initialPickup = stateForListing?.pickupPointId ?? draftForListing?.pickupPointId ?? lastPickup ?? null;
    setSelectedPickupId(initialPickup ?? null);

    const initialPayment = stateForListing?.paymentMethod ?? draftForListing?.paymentMethod ?? lastPayment ?? null;
    setPaymentMethod(initialPayment ?? null);

    initialisedRef.current = true;
  }, [listingId, locationState]);

  useEffect(() => {
    if (selectedPickupId) {
      setLastPickupId(selectedPickupId);
    }
  }, [selectedPickupId]);

  useEffect(() => {
    if (paymentMethod) {
      setLastPaymentMethod(paymentMethod);
    }
  }, [paymentMethod]);

  const listingQuery = useQuery({
    queryKey: ['listing', listingId],
    queryFn: async () => {
      if (!listingId) throw new Error('Missing listing id');
      return api<ListingSummary>(`/api/listings/${listingId}`);
    },
    enabled: !!listingId,
  });

  const pickupQuery = useQuery({
    queryKey: ['pickups'],
    queryFn: async () => {
      const response = await api<{ items: PickupPoint[] }>(`/api/pickups`);
      return response.items;
    },
  });

  const remoteListing = listingQuery.data;
  const remotePickups = pickupQuery.data ?? [];
  const listingQueryResolved = listingId ? listingQuery.isError || remoteListing !== undefined : true;
  const listingFallbackReason = !listingId || (!listingQuery.isLoading && listingQueryResolved && (listingQuery.isError || remoteListing === undefined));
  const pickupQueryResolved = pickupQuery.isError || pickupQuery.data !== undefined;
  const pickupFallbackReason = !pickupQuery.isLoading && pickupQueryResolved && (pickupQuery.isError || remotePickups.length === 0);

  useEffect(() => {
    if (!demoActive && (listingFallbackReason || pickupFallbackReason)) {
      activateDemoMode();
      setDemoActive(true);
    }
  }, [demoActive, listingFallbackReason, pickupFallbackReason]);

  const shouldUseDemoListing = demoActive || listingFallbackReason;
  const shouldUseDemoPickups = demoActive || pickupFallbackReason;

  const fallbackListing = getDemoListingById(listingId) ?? primaryDemoListing;
  const listing = shouldUseDemoListing ? fallbackListing : remoteListing ?? fallbackListing;
  const pickupOptions = shouldUseDemoPickups ? DEMO_PICKUPS : remotePickups;
  const selectedPickup = pickupOptions.find(point => point.id === selectedPickupId) ?? null;
  const isListingLoading = listingQuery.isLoading && !shouldUseDemoListing;
  const isPickupLoading = pickupQuery.isLoading && !shouldUseDemoPickups;

  useEffect(() => {
    if (pickupOptions.length === 0) return;
    if (!selectedPickupId || !pickupOptions.some(point => point.id === selectedPickupId)) {
      setSelectedPickupId(pickupOptions[0].id);
    }
  }, [pickupOptions, selectedPickupId]);

  const effectiveListingId = listing?.id ?? listingId ?? primaryDemoListing.id;

  useEffect(() => {
    if (!initialisedRef.current) return;
    setCheckoutDraft({
      listingId: effectiveListingId,
      qty,
      pickupPointId: selectedPickupId ?? undefined,
      paymentMethod: paymentMethod ?? undefined,
    });
  }, [effectiveListingId, qty, paymentMethod, selectedPickupId]);

  useEffect(() => {
    if (listing) {
      trackEvent('checkout_view', { listingId: listing.id });
    }
  }, [listing]);

  const priceFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const subtotal = listing ? listing.priceXAF * qty : 0;
  const escrowFee = subtotal > 0 ? Math.max(500, Math.round(subtotal * 0.008)) : 0;
  const platformFee = subtotal > 0 ? 700 : 0;
  const total = subtotal + escrowFee + platformFee;

  const subtotalLabel = priceFormatter.format(subtotal);
  const unitPriceLabel = listing ? priceFormatter.format(listing.priceXAF) : priceFormatter.format(0);
  const escrowLabel = priceFormatter.format(escrowFee);
  const platformLabel = priceFormatter.format(platformFee);
  const totalLabel = priceFormatter.format(total);

  const handleQtyChange = useCallback(
    (delta: number) => {
      setQty(prev => {
        const next = Math.min(5, Math.max(1, prev + delta));
        if (next !== prev) {
          trackEvent('qty_change', { listingId: effectiveListingId, qty: next });
        }
        return next;
      });
    },
    [effectiveListingId],
  );

  const handlePickupOpen = useCallback(() => {
    if (effectiveListingId) {
      trackEvent('pickup_open', { listingId: effectiveListingId });
    }
    setPickupSheetOpen(true);
  }, [effectiveListingId]);

  const handlePickupSelect = useCallback(
    (nextId: string) => {
      setSelectedPickupId(nextId);
      setPickupSheetOpen(false);
      if (effectiveListingId) {
        trackEvent('pickup_select', { listingId: effectiveListingId, pickupPointId: nextId });
      }
      const pickupName = pickupOptions.find(point => point.id === nextId)?.name;
      if (pickupName) {
        toast({ description: t('checkout.pickupConfirmToast', { name: pickupName }) });
      }
    },
    [effectiveListingId, pickupOptions, t, toast],
  );

  const handlePaymentSelect = useCallback(
    (method: CheckoutPaymentMethod) => {
      setPaymentMethod(prev => {
        if (prev !== method && effectiveListingId) {
          trackEvent('payment_method_select', { listingId: effectiveListingId, method });
        }
        return method;
      });
    },
    [effectiveListingId],
  );

  const handleSubmit = useCallback(async () => {
    const activeListing = listing ?? fallbackListing;
    if (!activeListing) {
      setOrderError(t('checkout.orderError'));
      return;
    }

    const resolvedPickup = selectedPickup ?? pickupOptions[0] ?? null;
    if (!resolvedPickup) {
      toast({ description: t('checkout.selectPickupToast') });
      setPickupSheetOpen(true);
      return;
    }
    if (!selectedPickupId) {
      setSelectedPickupId(resolvedPickup.id);
    }

    if (!paymentMethod) {
      toast({ description: t('checkout.selectPaymentToast') });
      return;
    }

    const orderId = generateOrderId();
    const now = new Date();
    const etaDays = Math.max(
      1,
      activeListing.etaDays?.max ?? activeListing.etaDays?.min ?? activeListing.lane?.medianDays ?? 14,
    );
    const deadlineDate = new Date(now.getTime() + etaDays * 24 * 60 * 60 * 1000);
    const countdownSeconds = Math.max(0, Math.floor((deadlineDate.getTime() - now.getTime()) / 1000));

    const demoOrder: DemoOrderRecord = {
      id: orderId,
      listingId: activeListing.id,
      pickupPointId: resolvedPickup.id,
      createdAt: now.toISOString(),
      status: 'ESCROW_HELD',
      countdown: {
        deadline: deadlineDate.toISOString(),
        secondsLeft: countdownSeconds,
      },
      milestones: [
        { code: 'POOL_LOCKED', at: now.toISOString() },
        { code: 'SUPPLIER_PAID', at: null },
        { code: 'EXPORTED', at: null },
        { code: 'ARRIVED', at: null },
        { code: 'COLLECTED', at: null },
      ],
      eligibility: { canRefund: false, canDispute: false },
      listing: {
        id: activeListing.id,
        title: activeListing.title,
        priceXAF: activeListing.priceXAF,
      },
      qty,
      pickupPoint: {
        id: resolvedPickup.id,
        name: resolvedPickup.name,
        address: resolvedPickup.address,
        city: resolvedPickup.city,
        phone: resolvedPickup.phone ?? null,
      },
    };

    try {
      setSubmitting(true);
      setOrderError(null);
      trackEvent('checkout_create_order', {
        listingId: activeListing.id,
        qty,
        pickupPointId: resolvedPickup.id,
        paymentMethod,
      });
      setCheckoutDraft({
        listingId: activeListing.id,
        qty,
        pickupPointId: resolvedPickup.id,
        paymentMethod,
      });

      await new Promise(resolve => window.setTimeout(resolve, 1_200));

      const existingInvoice = findStoredInvoiceByOrderId(orderId);
      const baseInvoice =
        existingInvoice ?? (JSON.parse(JSON.stringify(DEMO_INVOICE)) as typeof DEMO_INVOICE);
      const etaWindow = `${activeListing.etaDays.min}–${activeListing.etaDays.max} days`;
      const preorderOrder = {
        ...DEMO_PREORDER_ORDER,
        orderId,
        poolId: activeListing.id,
        title: activeListing.title,
        image: activeListing.images?.[0] ?? DEMO_PREORDER_ORDER.image,
        qty,
        unitPriceXAF: activeListing.priceXAF,
        serviceFeeXAF: platformFee,
        etaWindow,
        importer: {
          ...DEMO_PREORDER_ORDER.importer,
          name: activeListing.importer?.displayName ?? DEMO_PREORDER_ORDER.importer.name,
          verified: activeListing.importer?.verified ?? DEMO_PREORDER_ORDER.importer.verified,
        },
      };

      const hydratedInvoice = applyPreorderToInvoice(preorderOrder, baseInvoice);
      hydratedInvoice.pickup = {
        ...hydratedInvoice.pickup,
        hubId: resolvedPickup.id,
        hubName: resolvedPickup.name,
        address: resolvedPickup.address,
        city: resolvedPickup.city ?? '',
        hours: ('hours' in resolvedPickup ? resolvedPickup.hours : undefined) ?? '',
        etaWindow: preorderOrder.etaWindow ?? hydratedInvoice.pickup?.etaWindow,
        pickupCode:
          hydratedInvoice.pickup?.pickupCode ?? String(Math.floor(1000 + Math.random() * 9000)),
      };
      hydratedInvoice.qrCodePayload = {
        orderId: orderId,
        invoiceNo: hydratedInvoice.invoiceNo,
        pickupCode: hydratedInvoice.pickup.pickupCode ?? '',
        hubId: hydratedInvoice.pickup.hubId ?? '',
      };
      saveStoredInvoice(hydratedInvoice);

      demoOrder.paymentStatus = 'PAID';
      demoOrder.invoiceNo = hydratedInvoice.invoiceNo;
      demoOrder.invoiceTotalXAF = hydratedInvoice.pricing?.totalXAF ?? total;
      demoOrder.pickupPoint = {
        ...demoOrder.pickupPoint,
        id: resolvedPickup.id,
        name: resolvedPickup.name,
        address: resolvedPickup.address,
        city: resolvedPickup.city,
        phone: resolvedPickup.phone ?? null,
      };

      saveDemoOrder(demoOrder);
      toast({ description: t('checkout.paymentSuccessToast') });
      trackEvent('psp_return_success', { orderId, paymentMethod });
      navigate(`/invoice/${hydratedInvoice.invoiceNo}?focus=pickup`);
    } catch (error) {
      console.error(error);
      setOrderError(t('checkout.orderError'));
    } finally {
      setSubmitting(false);
    }
  }, [
    listing,
    fallbackListing,
    selectedPickup,
    pickupOptions,
    paymentMethod,
    qty,
    selectedPickupId,
    platformFee,
    total,
    t,
    toast,
    navigate,
  ]);

  const itemSkeleton = (
    <div className="flex flex-col gap-4 md:flex-row md:items-center">
      <Skeleton className="h-36 w-full rounded-2xl md:h-32 md:w-32" />
      <div className="flex flex-1 flex-col gap-3">
        <Skeleton className="h-5 w-3/4 rounded-full" />
        <Skeleton className="h-4 w-1/3 rounded-full" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-24 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-dvh bg-background pb-32">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6 sm:px-6">
        <header className="flex items-center gap-3">
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
            <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('checkout.title')}</p>
            <h1 className="text-xl font-semibold text-foreground">
              {isListingLoading ? <Skeleton className="h-6 w-48 rounded-full" /> : listing?.title}
            </h1>
          </div>
        </header>

        {orderError && (
          <Alert className="rounded-3xl border-destructive/30 bg-destructive/10 text-destructive">
            <AlertDescription className="flex items-start justify-between gap-4">
              <span className="text-sm font-medium">{orderError}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-destructive"
                onClick={() => setOrderError(null)}
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Dismiss</span>
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <section className="space-y-6 rounded-3xl border border-border bg-card/70 p-5 shadow-soft">
          {isListingLoading ? (
            itemSkeleton
          ) : listing ? (
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="w-full md:w-auto">
                <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-2xl bg-muted">
                  <img
                    src={listing.images[0] ?? '/placeholder.svg'}
                    alt={listing.title}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={event => {
                      event.currentTarget.onerror = null;
                      event.currentTarget.src = '/placeholder.svg';
                    }}
                  />
                </AspectRatio>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{t('checkout.itemLabel')}</p>
                  <p className="text-lg font-semibold text-foreground">{listing.title}</p>
                </div>
                <p className="text-sm text-muted-foreground">{unitPriceLabel} · {t('checkout.qtyLabel')} × {qty}</p>
                <div className="flex items-center gap-4">
                  <div className="inline-flex items-center rounded-full border border-border bg-background px-1 py-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleQtyChange(-1)}
                      aria-label={t('checkout.qtyDecrease')}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center text-sm font-semibold">{qty}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleQtyChange(1)}
                      aria-label={t('checkout.qtyIncrease')}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="ml-auto text-right">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('checkout.lineItems')}</p>
                    <p className="text-lg font-semibold text-foreground">{subtotalLabel}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-base font-semibold text-foreground">{t('home.detailUnavailable')}</p>
              <p className="text-sm text-muted-foreground">{t('home.detailUnavailableSubtitle')}</p>
            </div>
          )}
        </section>

        <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('checkout.pickupLabel')}</p>
              <p className="text-base font-semibold text-foreground">
                {selectedPickup ? selectedPickup.name : t('checkout.pickupUnset')}
              </p>
              {selectedPickup && (
                <p className="text-sm text-muted-foreground">
                  {selectedPickup.city} · {selectedPickup.address}
                </p>
              )}
            </div>
            <Button variant="ghost" className="rounded-full border px-4" onClick={handlePickupOpen}>
              {t('checkout.pickupChange')}
            </Button>
          </div>
          <div className="rounded-2xl border border-dashed border-border/70 bg-muted/40 p-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="h-5 w-5 text-primary" />
              <span>
                {selectedPickup
                  ? `${selectedPickup.city} • ${selectedPickup.address}`
                  : t('checkout.pickupSheetSubtitle')}
              </span>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded-3xl border border-border bg-card/70 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('checkout.paymentLabel')}</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {paymentOptions.map(option => {
              const selected = paymentMethod === option.id;
              const hint = t(option.hintKey);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handlePaymentSelect(option.id)}
                  className={cn(
                    'group flex h-full flex-col rounded-2xl border px-4 py-4 text-left transition-colors',
                    selected
                      ? 'border-primary bg-primary/10 shadow-soft'
                      : 'border-border bg-background hover:border-foreground/40',
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-base font-semibold text-foreground">{t(option.labelKey)}</p>
                    <div
                      className={cn(
                        'flex h-5 w-5 items-center justify-center rounded-full border text-xs font-semibold',
                        selected
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-muted-foreground',
                      )}
                    >
                      {selected ? <CheckCircle2 className="h-4 w-4" /> : <span />}
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">{hint}</p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="rounded-3xl border border-border bg-gradient-to-r from-primary/10 via-primary/5 to-emerald-50 p-5 shadow-soft">
          <div className="flex items-start gap-3">
            <div className="rounded-full border border-primary/40 bg-primary/10 p-2 text-primary">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{t('checkout.trustCopy')}</p>
              <button
                type="button"
                onClick={() => setPolicyOpen(true)}
                className="mt-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                {t('checkout.refundPolicy')}
              </button>
            </div>
          </div>
        </div>

        <section className="space-y-4 rounded-3xl border border-border bg-card/70 p-5 shadow-soft">
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold text-foreground">{t('checkout.summaryLabel')}</p>
          </div>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t('checkout.lineItems')}</span>
              <span>{subtotalLabel}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t('checkout.escrowFee')}</span>
              <span>{escrowLabel}</span>
            </div>
            <div className="flex items-center justify-between text-muted-foreground">
              <span>{t('checkout.platformFee')}</span>
              <span>{platformLabel}</span>
            </div>
          </div>
          <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-4 py-3">
            <span className="text-sm font-semibold text-muted-foreground">{t('checkout.total')}</span>
            <span className="text-lg font-semibold text-foreground">{totalLabel}</span>
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3">
          <div className="flex flex-1 flex-col">
            <span className="text-xs uppercase tracking-wide text-muted-foreground">{t('checkout.total')}</span>
            <span className="text-lg font-semibold text-foreground">{totalLabel}</span>
          </div>
          <Button
            className="flex-1 rounded-2xl py-4 text-base font-semibold shadow-lg"
            disabled={!selectedPickupId || !paymentMethod || submitting || !listing}
            onClick={handleSubmit}
          >
            {submitting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {t('checkout.processing')}
              </span>
            ) : (
              listing ? t('checkout.payCta', { total: totalLabel }) : t('checkout.payCtaDisabled')
            )}
          </Button>
        </div>
      </div>

      <Drawer open={pickupSheetOpen} onOpenChange={setPickupSheetOpen}>
        <DrawerContent className="rounded-t-3xl">
          <DrawerHeader className="px-6 pt-6 text-left">
            <DrawerTitle>{t('checkout.pickupSheetTitle')}</DrawerTitle>
            <DrawerDescription>{t('checkout.pickupSheetSubtitle')}</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[60vh] space-y-2 overflow-y-auto px-6 pb-6">
            {isPickupLoading && (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                ))}
              </div>
            )}
            {!isPickupLoading && pickupOptions.length === 0 && (
              <p className="text-sm text-muted-foreground">{t('checkout.emptyPickup')}</p>
            )}
            {!isPickupLoading && pickupOptions.map(point => {
              const active = selectedPickupId === point.id;
              return (
                <button
                  key={point.id}
                  type="button"
                  onClick={() => handlePickupSelect(point.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition',
                    active ? 'border-primary bg-primary/10 shadow-soft' : 'border-border bg-background hover:border-foreground/40',
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-primary/40 bg-primary/10 text-primary">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{point.name}</p>
                      <p className="text-xs text-muted-foreground">{point.city} · {point.address}</p>
                    </div>
                  </div>
                  {active ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
                </button>
              );
            })}
          </div>
          <DrawerFooter className="px-6 pb-6">
            <Button variant="secondary" className="rounded-full" onClick={() => setPickupSheetOpen(false)}>
              {t('common.close')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={policyOpen} onOpenChange={setPolicyOpen}>
        <DrawerContent className="rounded-t-3xl">
          <DrawerHeader className="px-6 pt-6 text-left">
            <DrawerTitle>{t('checkout.refundSheetTitle')}</DrawerTitle>
            <DrawerDescription>{t('checkout.refundSheetBody')}</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter className="px-6 pb-6">
            <Button variant="secondary" className="rounded-full" onClick={() => setPolicyOpen(false)}>
              {t('common.close')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </main>
  );
};

export default Checkout;
