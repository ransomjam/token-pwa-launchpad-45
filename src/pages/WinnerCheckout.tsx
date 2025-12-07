import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Lock,
  MapPin,
  Wallet,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { AppNav } from '@/components/navigation/AppNav';
import { useI18n } from '@/context/I18nContext';
import {
  findWinByOrderId,
  getAuctionById,
  getWinById,
  isDemoWinsSeed,
  updateWinRecord,
  WINS_UPDATED_EVENT,
} from '@/lib/auctionData';
import { trackEvent } from '@/lib/analytics';
import { buildPickupQrPayload, generateInvoiceNo, generateOrderId } from '@/lib/invoice';
import { cn } from '@/lib/utils';
import type { AuctionListing, AuctionWin, AuctionWinHub } from '@/types/auctions';
import InvoiceDocument from '@/invoices/InvoiceDocument';
import { buildInvoiceFromWin, FALLBACK_NOTES } from '@/invoices/invoiceUtils';

const PREVIEW_BADGE_VISIBLE = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

type CheckoutStep = 'payment' | 'pickup' | 'invoice';

const fallbackBuyerName = 'A. Kamga';
const fallbackBuyerContact = '+237 6••• ••45';

const resolveAuction = (win: AuctionWin | null): AuctionListing | null => {
  if (!win) return null;
  return getAuctionById(win.auctionId) ?? null;
};

const getHubById = (hubs: AuctionWinHub[] | undefined, hubId: string | undefined) => {
  if (!hubId || !hubs) return null;
  return hubs.find(hub => hub.id === hubId) ?? null;
};

const WinnerCheckout = () => {
  const { winId } = useParams<{ winId: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const requestedStep = (searchParams.get('step') as CheckoutStep | null) ?? 'payment';
  const [activeStep, setActiveStep] = useState<CheckoutStep>(requestedStep);
  const [win, setWin] = useState<AuctionWin | null>(() => (winId ? getWinById(winId) ?? null : null));
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const invoiceScrollContainerRef = useRef<HTMLDivElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  const pickupSectionRef = useRef<HTMLDivElement>(null);
  const invoiceSectionRef = useRef<HTMLDivElement>(null);
  const usingDemoData = useMemo(() => isDemoWinsSeed(), []);

  const auction = useMemo(() => resolveAuction(win), [win]);

  useEffect(() => {
    const handleUpdate = () => {
      if (!winId) return;
      const next = getWinById(winId) ?? null;
      setWin(next);
    };
    window.addEventListener(WINS_UPDATED_EVENT, handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener(WINS_UPDATED_EVENT, handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [winId]);

  const scrollToStep = (step: CheckoutStep) => {
    const target =
      step === 'payment'
        ? paymentSectionRef.current
        : step === 'pickup'
          ? pickupSectionRef.current
          : invoiceSectionRef.current;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    setActiveStep(step);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('step', step);
      return next;
    });
  };

  useEffect(() => {
    scrollToStep(requestedStep);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedStep, win?.status]);

  useEffect(() => {
    if (invoiceOpen && invoiceScrollContainerRef.current) {
      invoiceScrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [invoiceOpen]);

  const handleBack = () => {
    navigate(-1);
  };

  const paymentCompleted = win ? win.status !== 'pending_payment' : false;
  const pickupCompleted = win ? win.status === 'paid_pickup_selected' || win.status === 'completed' : false;
  const currentCheckout = win?.checkout;
  const hubs = currentCheckout?.hubs ?? [];
  const selectedHubId = currentCheckout?.chosenHubId;
  const suggestedHubId = selectedHubId ?? currentCheckout?.lastHubId;
  const selectedHub = getHubById(hubs, selectedHubId ?? undefined);
  const totalDue = currentCheckout?.totalDueXAF ?? win?.payment?.totalDueXAF ?? win?.finalBidXAF ?? 0;

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const formatCurrency = (value: number) => currencyFormatter.format(value);
  const formatInvoiceCurrency = (value?: number) =>
    typeof value === 'number' ? currencyFormatter.format(value) : '—';

  const invoiceDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }),
    [locale],
  );

  const formatInvoiceDateTime = (value?: string | null) => {
    if (!value) return '—';
    try {
      return invoiceDateFormatter.format(new Date(value));
    } catch (error) {
      return value;
    }
  };

  const invoiceData = useMemo(() => (win ? buildInvoiceFromWin(win) : null), [win]);

  const invoiceTimeline = useMemo(
    () => [
      { id: 'won', label: 'Won / Gagné', at: invoiceData?.wonAt },
      { id: 'paid', label: 'Paid / Payé', at: invoiceData?.paidAt },
      {
        id: 'pickup',
        label: 'Pickup chosen / Point de retrait choisi',
        at: invoiceData?.pickupSelectedAt,
      },
      {
        id: 'escrow',
        label: 'Escrow Held → Release on collection / Séquestre : Actif → Libération lors du retrait',
        at: invoiceData?.pickupSelectedAt ?? invoiceData?.paidAt ?? invoiceData?.createdAt,
      },
    ],
    [invoiceData?.wonAt, invoiceData?.paidAt, invoiceData?.pickupSelectedAt, invoiceData?.createdAt],
  );

  const invoiceNotes = useMemo(() => {
    const baseNotes = Array.isArray(invoiceData?.notes) ? invoiceData.notes : [];
    const combined = [...baseNotes, ...FALLBACK_NOTES];
    return Array.from(new Set(combined));
  }, [invoiceData?.notes]);

  const invoicePickupPayload = useMemo(() => {
    const payload = invoiceData?.qrCodePayload;
    if (payload?.orderId && payload?.invoiceNo && payload?.pickupCode && payload?.hubId) {
      return buildPickupQrPayload(payload);
    }
    if (
      invoiceData?.orderId &&
      invoiceData?.pickup?.hubId &&
      invoiceData?.pickup?.pickupCode
    ) {
      return buildPickupQrPayload({
        orderId: invoiceData.orderId,
        invoiceNo: invoiceData.invoiceNo,
        pickupCode: invoiceData.pickup.pickupCode,
        hubId: invoiceData.pickup.hubId,
      });
    }
    return null;
  }, [invoiceData]);

  const invoiceShareMessage = useMemo(
    () => `Invoice ${invoiceData?.invoiceNo ?? ''} • Pickup code ${invoiceData?.pickup?.pickupCode ?? ''}`,
    [invoiceData?.invoiceNo, invoiceData?.pickup?.pickupCode],
  );

  const handlePayNow = () => {
    setPaymentSheetOpen(true);
    if (win) {
      trackEvent('winner_checkout_pay_open', { winId: win.id });
    }
  };

  const ensureCheckout = useCallback(
    (current: AuctionWin) => {
      if (current.checkout) return current.checkout;
      const base = currentCheckout;
      const sellerName = base?.sellerName ?? auction?.seller?.name ?? 'Partner seller';
      const availableHubs = base?.hubs ?? hubs ?? [];
      current.checkout = {
        sellerName,
        buyerName: base?.buyerName ?? fallbackBuyerName,
        buyerContactMasked: base?.buyerContactMasked ?? fallbackBuyerContact,
        buyerEmailMasked: base?.buyerEmailMasked,
        sellerContactMasked: base?.sellerContactMasked,
        pickupWindowLabel: base?.pickupWindowLabel ?? t('winnerCheckout.pickup.defaultEta'),
        totalDueXAF: base?.totalDueXAF ?? current.payment?.totalDueXAF ?? current.finalBidXAF,
        hubs: availableHubs,
        orderId: base?.orderId,
        invoiceNo: base?.invoiceNo,
        qrCodeValue: base?.qrCodeValue,
        lastHubId: base?.lastHubId,
        chosenHubId: base?.chosenHubId,
        invoiceGeneratedAt: base?.invoiceGeneratedAt,
        paidAt: base?.paidAt,
        pickupSelectedAt: base?.pickupSelectedAt,
        pickupCode: base?.pickupCode,
      };
      return current.checkout;
    },
    [auction?.seller?.name, currentCheckout, hubs, t],
  );

  const ensureInvoiceIdentifiers = useCallback(() => {
    if (!win || !winId) {
      return { invoiceNo: null, orderId: null };
    }
    const existingInvoiceNo = win.checkout?.invoiceNo ?? null;
    const existingOrderId = win.checkout?.orderId ?? null;
    if (existingInvoiceNo && existingOrderId) {
      return { invoiceNo: existingInvoiceNo, orderId: existingOrderId };
    }
    const updated = updateWinRecord(winId, draft => {
      const checkout = ensureCheckout(draft);
      const orderId = checkout.orderId ?? generateOrderId();
      const invoiceNo = checkout.invoiceNo ?? generateInvoiceNo();
      const qrValue = checkout.qrCodeValue ?? orderId;
      const nowIso = new Date().toISOString();
      draft.checkout = {
        ...checkout,
        orderId,
        invoiceNo,
        invoiceGeneratedAt: checkout.invoiceGeneratedAt ?? nowIso,
        qrCodeValue: qrValue,
      };
      return draft;
    });
    if (updated) {
      setWin(updated);
      return {
        invoiceNo: updated.checkout?.invoiceNo ?? null,
        orderId: updated.checkout?.orderId ?? null,
      };
    }
    return {
      invoiceNo: existingInvoiceNo,
      orderId: existingOrderId,
    };
  }, [ensureCheckout, setWin, win, winId]);

  const handleConfirmPayment = () => {
    if (!win || !winId) return;
    const updated = updateWinRecord(winId, draft => {
      const checkout = ensureCheckout(draft);
      const orderId = checkout.orderId ?? generateOrderId();
      const invoiceNo = checkout.invoiceNo ?? generateInvoiceNo();
      const qrValue = checkout.qrCodeValue ?? orderId;
      const sellerName = checkout.sellerName ?? auction?.seller?.name ?? 'Seller';
      const total = draft.payment?.totalDueXAF ?? checkout.totalDueXAF ?? draft.finalBidXAF;
      const nowIso = new Date().toISOString();

      draft.status = 'paid_pickup_pending';
      if (draft.payment) {
        draft.payment.statusLabel = t('winnerCheckout.payment.paidStatus');
        draft.payment.reminderLabel = t('winnerCheckout.payment.paidReminder');
      }
      draft.checkout = {
        ...checkout,
        sellerName,
        buyerName: checkout.buyerName ?? fallbackBuyerName,
        buyerContactMasked: checkout.buyerContactMasked ?? fallbackBuyerContact,
        totalDueXAF: total,
        orderId,
        invoiceNo,
        qrCodeValue: qrValue,
        invoiceGeneratedAt: checkout.invoiceGeneratedAt ?? nowIso,
        paidAt: checkout.paidAt ?? nowIso,
      };
      return draft;
    });

    if (updated) {
      setWin(updated);
      toast({ description: t('winnerCheckout.toasts.paymentSuccess') });
      trackEvent('winner_checkout_paid', { winId: updated.id });
      setPaymentSheetOpen(false);
      scrollToStep('pickup');
    }
  };

  const handleSelectHub = (hubId: string) => {
    if (!win || !winId || !hubId) return;
    const hub = getHubById(win.checkout?.hubs, hubId);
    const updated = updateWinRecord(winId, draft => {
      const checkout = ensureCheckout(draft);
      const orderId = checkout.orderId ?? generateOrderId();
      const invoiceNo = checkout.invoiceNo ?? generateInvoiceNo();
      const qrValue = checkout.qrCodeValue ?? orderId;
      const nowIso = new Date().toISOString();
      const pickupCode = checkout.pickupCode ?? `${Math.floor(1000 + Math.random() * 9000)}`;
      draft.status = 'paid_pickup_selected';
      draft.checkout = {
        ...checkout,
        totalDueXAF: checkout.totalDueXAF ?? draft.payment?.totalDueXAF ?? draft.finalBidXAF,
        chosenHubId: hubId,
        lastHubId: hubId,
        orderId,
        invoiceNo,
        qrCodeValue: qrValue,
        pickupSelectedAt: nowIso,
        pickupCode,
      };
      return draft;
    });

    if (updated) {
      setWin(updated);
      toast({ description: t('winnerCheckout.toasts.pickupSaved', { hub: hub?.label ?? '' }) });
      trackEvent('winner_checkout_pickup_saved', { winId: updated.id, hubId });
      scrollToStep('invoice');
      setInvoiceOpen(true);
    }
  };

  const handleViewInvoice = () => {
    ensureInvoiceIdentifiers();
    setInvoiceOpen(true);
    if (win) {
      trackEvent('winner_checkout_invoice_view', { winId: win.id });
    }
  };

  const handleDownloadInvoice = () => {
    if (!invoiceRef.current || typeof window === 'undefined') return;
    const printable = window.open('', '_blank', 'width=820,height=960');
    if (!printable) return;
    const headMarkup = document?.head?.innerHTML ?? '';
    printable.document.write(`<!doctype html><html><head><title>${t('winnerCheckout.invoice.windowTitle')}</title>${headMarkup}</head><body class="bg-muted/30 p-6">`);
    printable.document.write(invoiceRef.current.outerHTML);
    printable.document.write('</body></html>');
    printable.document.close();
    printable.focus();
    printable.print();
  };

  const handleCopyInvoiceLink = async () => {
    if (typeof window === 'undefined') return;
    const { invoiceNo } = ensureInvoiceIdentifiers();
    if (!invoiceNo) return;
    try {
      const link = `${window.location.origin}/invoice/${invoiceNo}`;
      await navigator.clipboard.writeText(link);
      toast({ description: t('winnerCheckout.toasts.linkCopied') });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCopyInvoiceNo = async () => {
    const { invoiceNo } = ensureInvoiceIdentifiers();
    if (!invoiceNo) return;
    try {
      await navigator.clipboard.writeText(invoiceNo);
      toast({ description: 'Invoice number copied • Numéro copié' });
    } catch (error) {
      console.error(error);
    }
  };

  const openOrderTracker = () => {
    if (!win?.checkout?.orderId) return;
    const orderWin = findWinByOrderId(win.checkout.orderId);
    trackEvent('winner_checkout_order_open', { winId: orderWin?.id, orderId: win.checkout.orderId });
    navigate(`/order/${win.checkout.orderId}`);
  };

  if (!win || !winId) {
    return (
      <main className="min-h-dvh bg-muted/30">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
          <header className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleBack}>
                <ArrowLeft className="h-5 w-5" />
                <span className="sr-only">{t('common.back')}</span>
              </Button>
              <div className="flex-1 text-center">
                <h1 className="text-lg font-semibold text-foreground">{t('winnerCheckout.title')}</h1>
                <p className="text-sm text-muted-foreground">{t('winnerCheckout.subtitle')}</p>
              </div>
              <div className="w-10" aria-hidden />
            </div>
          </header>
          <div className="rounded-3xl border border-dashed border-border/60 bg-card/80 p-6 text-center shadow-soft">
            <p className="text-base font-semibold text-foreground">{t('winnerCheckout.missingTitle')}</p>
            <p className="mt-2 text-sm text-muted-foreground">{t('winnerCheckout.missingSubtitle')}</p>
            <div className="mt-4 flex justify-center">
              <Button className="rounded-full" onClick={() => navigate('/profile/wins')}>
                {t('winnerCheckout.backToWins')}
              </Button>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full" onClick={handleBack}>
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('common.back')}</span>
            </Button>
            <div className="flex flex-1 flex-col items-center gap-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">{t('winnerCheckout.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('winnerCheckout.subtitle')}</p>
            </div>
            {PREVIEW_BADGE_VISIBLE ? (
              <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {t('common.preview')}
              </Badge>
            ) : (
              <div className="w-10" aria-hidden />
            )}
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

        <section
          ref={paymentSectionRef}
          className={cn(
            'space-y-4 rounded-3xl border border-border/60 bg-card/90 p-5 shadow-soft transition',
            activeStep === 'payment' ? 'ring-2 ring-primary/50 ring-offset-1' : '',
          )}
        >
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('winnerCheckout.sections.payment')}</p>
              <h2 className="text-lg font-semibold text-foreground">{t('winnerCheckout.payment.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('winnerCheckout.payment.subtitle')}</p>
            </div>
            {paymentCompleted && (
              <Badge className="rounded-full bg-emerald-500/90 text-xs text-white">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {t('winnerCheckout.payment.paidBadge')}
              </Badge>
            )}
          </header>

          <div className="rounded-2xl border border-border/60 bg-background/80 p-4 shadow-inner">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {t('winnerCheckout.payment.totalDue')}
                </p>
                <p className="text-2xl font-semibold text-foreground">{formatCurrency(totalDue)}</p>
                <p className="text-xs text-muted-foreground">{t('winnerCheckout.payment.escrowLine')}</p>
              </div>
              <Wallet className="h-10 w-10 text-primary" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                {t('winnerCheckout.payment.acceptedWallets')}
              </div>
              {win.payment?.dueByLabel && (
                <div className="rounded-2xl bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
                  {win.payment.dueByLabel}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button className="rounded-full" onClick={handlePayNow} disabled={paymentCompleted}>
              {paymentCompleted ? t('winnerCheckout.payment.paidCta') : t('winnerCheckout.actions.payNow')}
            </Button>
            <p className="text-xs text-muted-foreground">{t('winnerCheckout.payment.helper')}</p>
          </div>
        </section>

        <section
          ref={pickupSectionRef}
          className={cn(
            'relative space-y-4 rounded-3xl border border-border/60 bg-card/90 p-5 shadow-soft transition',
            activeStep === 'pickup' ? 'ring-2 ring-primary/50 ring-offset-1' : '',
          )}
        >
          {!paymentCompleted && (
            <div className="absolute inset-0 z-10 rounded-3xl bg-card/70 backdrop-blur-sm" aria-hidden>
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/90 px-3 py-1 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  {t('winnerCheckout.pickup.locked')}
                </div>
              </div>
            </div>
          )}
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('winnerCheckout.sections.pickup')}</p>
              <h2 className="text-lg font-semibold text-foreground">{t('winnerCheckout.pickup.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('winnerCheckout.pickup.subtitle')}</p>
            </div>
            {pickupCompleted && (
              <Badge className="rounded-full bg-emerald-500/90 text-xs text-white">
                <CheckCircle2 className="mr-1.5 h-4 w-4" />
                {t('winnerCheckout.pickup.savedBadge')}
              </Badge>
            )}
          </header>

          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {hubs.map(hub => {
                const selected = hub.id === selectedHubId;
                const suggested = !selectedHubId && hub.id === suggestedHubId;
                return (
                  <button
                    key={hub.id}
                    type="button"
                    disabled={!paymentCompleted}
                    onClick={() => handleSelectHub(hub.id)}
                    className={cn(
                      'group flex min-w-[12rem] flex-1 flex-col gap-1 rounded-2xl border px-4 py-3 text-left transition',
                      selected
                        ? 'border-primary bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                        : 'border-border/60 bg-background/80 hover:border-primary/40 hover:shadow-soft',
                    )}
                  >
                    <span className="text-sm font-semibold tracking-tight">
                      {hub.label}
                      {suggested && !selectedHubId && (
                        <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          {t('winnerCheckout.pickup.lastUsed')}
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground group-hover:text-foreground">
                      {hub.address}
                    </span>
                    <span className="text-xs text-primary group-hover:text-primary-foreground">
                      {hub.etaLabel}
                    </span>
                  </button>
                );
              })}
            </div>
            {currentCheckout?.pickupWindowLabel && (
              <p className="text-xs text-muted-foreground">
                {currentCheckout.pickupWindowLabel}
              </p>
            )}
          </div>
        </section>

        <section
          ref={invoiceSectionRef}
          className={cn(
            'relative space-y-4 rounded-3xl border border-border/60 bg-card/90 p-5 shadow-soft transition',
            activeStep === 'invoice' ? 'ring-2 ring-primary/50 ring-offset-1' : '',
          )}
          aria-disabled={!pickupCompleted}
        >
          {!pickupCompleted && (
            <div className="absolute inset-0 z-10 rounded-3xl bg-card/70 backdrop-blur-sm" aria-hidden>
              <div className="flex h-full items-center justify-center">
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-background/90 px-3 py-1 text-xs text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  {t('winnerCheckout.invoice.locked')}
                </div>
              </div>
            </div>
          )}

          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{t('winnerCheckout.sections.invoice')}</p>
              <h2 className="text-lg font-semibold text-foreground">{t('winnerCheckout.invoice.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('winnerCheckout.invoice.subtitle')}</p>
            </div>
            {pickupCompleted && (
              <Badge className="rounded-full bg-primary text-xs text-primary-foreground">
                <FileText className="mr-1.5 h-4 w-4" />
                {t('winnerCheckout.invoice.readyBadge')}
              </Badge>
            )}
          </header>

          <div className="space-y-3">
            <div className="rounded-2xl border border-border/60 bg-background/80 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>{t('winnerCheckout.invoice.summaryTitle')}</p>
                  {selectedHub && (
                    <p className="flex items-center gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-4 w-4 text-primary" />
                      {selectedHub.label}
                    </p>
                  )}
                </div>
                <p className="text-lg font-semibold text-foreground">{formatCurrency(totalDue)}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                className="rounded-full"
                onClick={handleViewInvoice}
                disabled={!pickupCompleted}
              >
                {t('winnerCheckout.actions.viewInvoice')}
              </Button>
              <Button
                variant="outline"
                className="rounded-full"
                onClick={openOrderTracker}
                disabled={!win.checkout?.orderId}
              >
                {t('winnerCheckout.actions.viewOrder')}
              </Button>
            </div>
          </div>
        </section>
      </div>

      <Sheet open={paymentSheetOpen} onOpenChange={setPaymentSheetOpen}>
        <SheetContent side="bottom" className="space-y-6 rounded-t-[28px]">
          <SheetHeader className="text-left">
            <SheetTitle>{t('winnerCheckout.sheet.title')}</SheetTitle>
            <SheetDescription>{t('winnerCheckout.sheet.subtitle')}</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
              <p className="text-sm font-medium text-foreground">{auction?.title}</p>
              <p className="text-xs text-muted-foreground">{currentCheckout?.sellerName ?? auction?.seller?.name}</p>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('winnerCheckout.sheet.total')}</span>
                <span className="text-lg font-semibold text-foreground">{formatCurrency(totalDue)}</span>
              </div>
            </div>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>{t('winnerCheckout.sheet.escrowCopy')}</li>
              <li>{t('winnerCheckout.sheet.paymentCopy')}</li>
            </ul>
          </div>
          <SheetFooter className="flex flex-col gap-3 sm:flex-row">
            <SheetClose asChild>
              <Button variant="outline" className="w-full rounded-full">
                {t('winnerCheckout.sheet.cancel')}
              </Button>
            </SheetClose>
            <Button className="w-full rounded-full" onClick={handleConfirmPayment}>
              {t('winnerCheckout.sheet.confirm')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={invoiceOpen} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-3xl rounded-[28px] overflow-hidden sm:max-h-[85vh] max-h-[calc(100vh-2rem)]">
          <DialogHeader>
            <DialogTitle>{t('winnerCheckout.invoice.dialogTitle')}</DialogTitle>
          </DialogHeader>
          <div
            ref={invoiceScrollContainerRef}
            className="max-h-[calc(100vh-6rem)] overflow-y-auto pr-1 sm:max-h-[75vh] sm:pr-2"
          >
            <InvoiceDocument
              ref={invoiceRef}
              invoice={invoiceData}
              formatCurrency={formatInvoiceCurrency}
              formatDateTime={formatInvoiceDateTime}
              pickupPayload={invoicePickupPayload}
              shareMessage={invoiceShareMessage}
              timeline={invoiceTimeline}
              noteEntries={invoiceNotes}
              onCopyInvoiceNo={handleCopyInvoiceNo}
              onCopyLink={handleCopyInvoiceLink}
              onDownload={handleDownloadInvoice}
            />
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default WinnerCheckout;
