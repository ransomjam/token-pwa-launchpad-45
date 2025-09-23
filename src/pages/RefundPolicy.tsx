import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Clock, Lock, ShieldAlert, ShieldCheck, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/context/I18nContext';
import { api } from '@/lib/api';
import { trackEvent } from '@/lib/analytics';
import { activateDemoMode, getDemoListingById, primaryDemoListing } from '@/lib/demoMode';
import { cn } from '@/lib/utils';
import type { OrderDetailResponse } from '@/types';

const formatOrderId = (value: string) => `#${value.slice(-6).toUpperCase()}`;

const formatDuration = (seconds: number) => {
  const safe = Math.max(0, seconds);
  const days = Math.floor(safe / 86400);
  const hours = Math.floor((safe % 86400) / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const parts: string[] = [];
  if (days > 0) parts.push(`${days}d`);
  parts.push(hours.toString().padStart(2, '0') + 'h');
  parts.push(minutes.toString().padStart(2, '0') + 'm');
  return parts.join(' ');
};

type FooterAction = {
  type: 'refund' | 'dispute' | 'view' | 'browse';
  label: string;
  onClick: () => void;
  disabled?: boolean;
};

const RefundPolicy = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const rawSource = searchParams.get('source');
  const source = rawSource === 'checkout' || rawSource === 'order' ? rawSource : 'listings';

  const [now, setNow] = useState(() => Date.now());
  const [actionLoading, setActionLoading] = useState<'refund' | null>(null);

  const orderQuery = useQuery<OrderDetailResponse>({
    queryKey: ['refund-policy-order', orderId],
    queryFn: async () => {
      if (!orderId) throw new Error('Missing order id');
      return api<OrderDetailResponse>(`/api/orders/${orderId}`);
    },
    enabled: Boolean(orderId),
    refetchOnWindowFocus: false,
    staleTime: 0,
  });

  const order = orderQuery.data;

  useEffect(() => {
    trackEvent('policy_view', { source });
  }, [source]);

  useEffect(() => {
    if (orderQuery.isError) {
      activateDemoMode();
    }
  }, [orderQuery.isError]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => window.clearInterval(interval);
  }, []);

  const listingMeta = useMemo(() => {
    if (order?.listing?.id) {
      return getDemoListingById(order.listing.id) ?? primaryDemoListing;
    }
    return primaryDemoListing;
  }, [order?.listing?.id]);

  const etaText = t('refundPolicyPage.timeline.duration.eta', {
    min: listingMeta.etaDays.min,
    max: listingMeta.etaDays.max,
  });

  const deadlineMs = order?.countdown?.deadline ? new Date(order.countdown.deadline).getTime() : null;
  const secondsRemaining = deadlineMs ? Math.max(0, Math.floor((deadlineMs - now) / 1000)) : null;

  const hasRefunded = order?.status === 'REFUNDED';
  const isLate = Boolean(
    order &&
      !hasRefunded &&
      (order.status === 'LATE' || (secondsRemaining === 0 && order.status !== 'CLOSED')),
  );
  const canRefund = Boolean(order && !hasRefunded && (order.eligibility.canRefund || isLate));

  const refundButtonLabel = order
    ? t('refundPolicyPage.actions.requestRefundFor', { id: formatOrderId(order.id) })
    : t('refundPolicyPage.actions.requestRefund');

  const statusMessage = order
    ? hasRefunded
      ? t('refundPolicyPage.hero.statusRefunded')
      : isLate
        ? t('refundPolicyPage.hero.statusLate')
        : secondsRemaining !== null
          ? t('refundPolicyPage.hero.statusCountdown', { time: formatDuration(secondsRemaining) })
          : t('refundPolicyPage.hero.timerHint')
    : t('refundPolicyPage.status.demo');

  const countdownPillText = order
    ? hasRefunded
      ? t('refundPolicyPage.hero.statusRefunded')
      : isLate
        ? t('refundPolicyPage.hero.statusLate')
        : secondsRemaining !== null
          ? t('refundPolicyPage.hero.statusCountdown', { time: formatDuration(secondsRemaining) })
          : null
    : null;

  const refundDisabledReason = !order
    ? t('refundPolicyPage.eligibility.tiles.late.joinPoolReason')
    : hasRefunded
      ? t('refundPolicyPage.eligibility.tiles.late.refundedReason')
      : !canRefund
        ? t('refundPolicyPage.eligibility.tiles.late.disabledReason')
        : '';

  const chips = useMemo(
    () => [
      { id: 'late', label: t('refundPolicyPage.chips.late') },
      { id: 'moq', label: t('refundPolicyPage.chips.moq') },
      { id: 'nas', label: t('refundPolicyPage.chips.nas') },
    ],
    [t],
  );

  const faqItems = useMemo(
    () => [
      { id: 'timer', question: t('refundPolicyPage.faq.items.timer.q'), answer: t('refundPolicyPage.faq.items.timer.a') },
      { id: 'speed', question: t('refundPolicyPage.faq.items.speed.q'), answer: t('refundPolicyPage.faq.items.speed.a') },
      { id: 'cancel', question: t('refundPolicyPage.faq.items.cancel.q'), answer: t('refundPolicyPage.faq.items.cancel.a') },
      { id: 'evidence', question: t('refundPolicyPage.faq.items.evidence.q'), answer: t('refundPolicyPage.faq.items.evidence.a') },
      { id: 'window', question: t('refundPolicyPage.faq.items.window.q'), answer: t('refundPolicyPage.faq.items.window.a') },
      { id: 'fees', question: t('refundPolicyPage.faq.items.fees.q'), answer: t('refundPolicyPage.faq.items.fees.a') },
    ],
    [t],
  );

  const scrollToId = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  const handleJump = useCallback((id: string) => {
    scrollToId(id);
    trackEvent('policy_tile_open', { tile: id });
  }, [scrollToId]);

  const handleRefund = useCallback(async () => {
    trackEvent('policy_cta_refund_click', {
      state: canRefund ? 'eligible' : 'ineligible',
      orderId: order?.id ?? null,
    });
    if (!order || !canRefund) return;
    try {
      setActionLoading('refund');
      await api(`/api/orders/${order.id}/refund`, { method: 'POST' });
      toast({
        title: t('refundPolicyPage.actions.toast.refundRequested'),
        description: t('refundPolicyPage.actions.toast.refundRequestedBody'),
      });
      await orderQuery.refetch();
    } catch (error) {
      toast({ title: t('refundPolicyPage.actions.toast.refundFailed') });
    } finally {
      setActionLoading(null);
    }
  }, [canRefund, order, orderQuery, t, toast]);

  const handleDispute = useCallback(() => {
    trackEvent('policy_cta_dispute_click', { orderId: order?.id ?? null });
    const contactEmail = t('order.actions.contactEmail');
    const subject = order ? `Dispute ${formatOrderId(order.id)}` : 'Dispute request';
    window.location.href = `mailto:${contactEmail}?subject=${encodeURIComponent(subject)}`;
  }, [order, t]);

  const handleViewOrder = useCallback(() => {
    if (!order) return;
    navigate(`/order/${order.id}`);
  }, [navigate, order]);

  const handleBrowse = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const footerAction: FooterAction = useMemo(() => {
    if (order) {
      if (canRefund && !hasRefunded) {
        return {
          type: 'refund',
          label: refundButtonLabel,
          onClick: handleRefund,
          disabled: actionLoading === 'refund',
        };
      }
      if (!hasRefunded) {
        return {
          type: 'dispute',
          label: t('refundPolicyPage.actions.openDispute'),
          onClick: handleDispute,
        };
      }
      return {
        type: 'view',
        label: t('refundPolicyPage.actions.viewOrder'),
        onClick: handleViewOrder,
      };
    }
    return {
      type: 'browse',
      label: t('refundPolicyPage.actions.browse'),
      onClick: handleBrowse,
    };
  }, [
    actionLoading,
    canRefund,
    handleBrowse,
    handleDispute,
    handleRefund,
    handleViewOrder,
    hasRefunded,
    order,
    refundButtonLabel,
    t,
  ]);

  const footerVariant = footerAction.type === 'refund' ? 'default' : footerAction.type === 'dispute' ? 'outline' : 'secondary';

  const footerDisabled = footerAction.type === 'refund' && (!canRefund || actionLoading === 'refund');

  const disputeLink = 'https://support.prolist.africa/disputes';

  return (
    <main className="relative min-h-screen bg-gradient-to-b from-slate-100 via-white to-white pb-24 text-slate-900">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-4 pb-32 pt-6 sm:pt-10">
        <section className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              {t('refundPolicyPage.trustLine')}
            </span>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t('refundPolicyPage.title')}</h1>
            <p className="max-w-xl text-base text-slate-600">{t('refundPolicyPage.hero.subtitle')}</p>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white/80 p-5 shadow-soft backdrop-blur">
            {orderId ? (
              orderQuery.isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-40" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      {t('refundPolicyPage.hero.activeOrder')}
                    </span>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {order?.listing?.title ?? listingMeta.title}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2" aria-live="polite">
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 rounded-full border-emerald-100 bg-emerald-50 text-emerald-600"
                      >
                        <Clock className="h-3.5 w-3.5" aria-hidden />
                        {etaText}
                      </Badge>
                      <span
                        className={cn(
                          'inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold',
                          hasRefunded
                            ? 'border border-slate-200 bg-slate-100 text-slate-700'
                            : isLate
                              ? 'border border-rose-200 bg-rose-50 text-rose-600'
                              : 'border border-emerald-200 bg-emerald-50 text-emerald-700',
                        )}
                      >
                        {statusMessage}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                    <span>{t('refundPolicyPage.hero.orderLabel', { id: order ? formatOrderId(order.id) : '—' })}</span>
                    <Button
                      variant="ghost"
                      className="h-10 px-3 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
                      onClick={handleViewOrder}
                    >
                      {t('refundPolicyPage.actions.viewOrder')}
                    </Button>
                  </div>
                </div>
              )
            ) : (
              <div className="space-y-3">
                <h2 className="text-lg font-semibold text-slate-900">{t('refundPolicyPage.hero.fallbackTitle')}</h2>
                <p className="text-sm text-slate-600">{t('refundPolicyPage.hero.fallbackBody')}</p>
                <p className="text-xs text-slate-500">{t('refundPolicyPage.hero.timerHint')}</p>
              </div>
            )}
            {!orderId && (
              <div className="mt-4">
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 rounded-full border-emerald-100 bg-emerald-50 text-emerald-600"
                >
                  <Clock className="h-3.5 w-3.5" aria-hidden />
                  {etaText}
                </Badge>
              </div>
            )}
            {orderQuery.isError && (
              <p className="mt-3 text-xs text-slate-500">{t('refundPolicyPage.hero.missingOrder')}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {chips.map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={() => handleJump(chip.id)}
                className="group inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1 text-sm font-medium text-slate-600 transition-all duration-150 ease-out hover:-translate-y-0.5 hover:border-emerald-200 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                <span>{chip.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section id="late" className="scroll-mt-28 space-y-4">
          <h2 className="text-2xl font-semibold text-slate-900">{t('refundPolicyPage.eligibility.title')}</h2>
          <div className="space-y-5">
            <div className="rounded-3xl border border-rose-100 bg-white/90 p-5 shadow-soft transition-shadow duration-150 ease-out hover:shadow-lg">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                  <Clock className="h-6 w-6" aria-hidden />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-slate-900">
                        {t('refundPolicyPage.eligibility.tiles.late.label')}
                      </p>
                      <p className="text-sm text-slate-600">
                        {t('refundPolicyPage.eligibility.tiles.late.rule')}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-full border-rose-100 bg-rose-50 text-rose-600"
                    >
                      {t('refundPolicyPage.eligibility.badges.late')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {t('refundPolicyPage.eligibility.tiles.late.micro')}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handleRefund}
                      disabled={!canRefund || actionLoading === 'refund'}
                      aria-label={refundButtonLabel}
                      className="h-11 rounded-2xl text-base font-semibold"
                    >
                      {actionLoading === 'refund' ? (
                        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                      ) : null}
                      {refundButtonLabel}
                    </Button>
                    {refundDisabledReason && (!canRefund || !order) && (
                      <p className="text-xs text-slate-500">{refundDisabledReason}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => scrollToId('timeline')}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {t('refundPolicyPage.eligibility.tiles.late.howItWorks')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>

            <div
              id="moq"
              className="rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-soft transition-shadow duration-150 ease-out hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                  <Lock className="h-6 w-6" aria-hidden />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-slate-900">
                        {t('refundPolicyPage.eligibility.tiles.moq.label')}
                      </p>
                      <p className="text-sm text-slate-600">
                        {t('refundPolicyPage.eligibility.tiles.moq.rule')}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-full border-emerald-100 bg-emerald-50 text-emerald-600"
                    >
                      {t('refundPolicyPage.eligibility.badges.moq')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {t('refundPolicyPage.eligibility.tiles.moq.micro')}
                  </p>
                  <button
                    type="button"
                    onClick={() => scrollToId('timeline')}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {t('refundPolicyPage.eligibility.tiles.moq.howItWorks')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>

            <div
              id="nas"
              className="rounded-3xl border border-amber-100 bg-white/90 p-5 shadow-soft transition-shadow duration-150 ease-out hover:shadow-lg"
            >
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
                  <ShieldAlert className="h-6 w-6" aria-hidden />
                </div>
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <p className="text-lg font-semibold text-slate-900">
                        {t('refundPolicyPage.eligibility.tiles.nas.label')}
                      </p>
                      <p className="text-sm text-slate-600">
                        {t('refundPolicyPage.eligibility.tiles.nas.rule')}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className="rounded-full border-amber-100 bg-amber-50 text-amber-600"
                    >
                      {t('refundPolicyPage.eligibility.badges.nas')}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-500">
                    {t('refundPolicyPage.eligibility.tiles.nas.micro')}
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      className="h-11 rounded-2xl text-base font-semibold"
                      onClick={handleDispute}
                    >
                      {t('refundPolicyPage.eligibility.tiles.nas.cta')}
                    </Button>
                  </div>
                  <button
                    type="button"
                    onClick={() => scrollToId('how')}
                    className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
                  >
                    {t('refundPolicyPage.eligibility.tiles.nas.howItWorks')}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="timeline" className="scroll-mt-28 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-slate-900">{t('refundPolicyPage.timeline.title')}</h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="grid gap-4">
            <div className="flex items-start gap-4 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-soft">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Lock className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {t('refundPolicyPage.timeline.start.label')}
                </p>
                <p className="text-sm text-slate-600">
                  {t('refundPolicyPage.timeline.start.detail')}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-soft">
              <div className="flex items-start gap-4">
                <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <Clock className="h-5 w-5" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {t('refundPolicyPage.timeline.duration.label')}
                  </p>
                  <p className="text-sm text-slate-600">{etaText}</p>
                </div>
              </div>
              {countdownPillText ? (
                <span
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-semibold',
                    isLate
                      ? 'border border-rose-200 bg-rose-50 text-rose-600'
                      : hasRefunded
                        ? 'border border-slate-200 bg-slate-100 text-slate-700'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-700',
                  )}
                  aria-live="polite"
                >
                  {countdownPillText}
                </span>
              ) : (
                <span className="text-sm text-slate-500">{t('refundPolicyPage.hero.timerHint')}</span>
              )}
            </div>
            <div className="flex items-start gap-4 rounded-2xl border border-rose-100 bg-rose-50 p-4 text-rose-700 shadow-soft">
              <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-white/60 text-rose-600">
                <CheckCircle2 className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('refundPolicyPage.timeline.atZero.label')}</p>
                <p className="text-sm">{t('refundPolicyPage.timeline.atZero.detail')}</p>
              </div>
            </div>
          </div>
        </section>

        <section id="how" className="scroll-mt-28 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-slate-900">{t('refundPolicyPage.how.title')}</h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="space-y-4 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-soft">
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <ShieldCheck className="mt-1 h-5 w-5 text-emerald-600" aria-hidden />
              <p>{t('refundPolicyPage.how.escrow')}</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Clock className="mt-1 h-5 w-5 text-emerald-600" aria-hidden />
              <p>{t('refundPolicyPage.how.late')}</p>
            </div>
            <div className="flex items-start gap-3 text-sm text-slate-600">
              <Lock className="mt-1 h-5 w-5 text-emerald-600" aria-hidden />
              <p>{t('refundPolicyPage.how.moq')}</p>
            </div>
            <div className="flex flex-wrap items-start justify-between gap-3 text-sm text-slate-600">
              <div className="flex items-start gap-3">
                <ShieldAlert className="mt-1 h-5 w-5 text-amber-600" aria-hidden />
                <p>{t('refundPolicyPage.how.dispute')}</p>
              </div>
              <a
                href={disputeLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700 transition hover:text-emerald-800"
              >
                {t('refundPolicyPage.how.disputeLink')}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </a>
            </div>
          </div>
        </section>

        <section id="faq" className="scroll-mt-28 space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold text-slate-900">{t('refundPolicyPage.faq.title')}</h3>
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <Accordion
            type="single"
            collapsible
            className="overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-soft"
            onValueChange={value => {
              if (value) trackEvent('policy_faq_open', { questionId: value });
            }}
          >
            {faqItems.map(item => (
              <AccordionItem key={item.id} value={item.id} className="px-4">
                <AccordionTrigger className="text-left text-base font-semibold text-slate-900">
                  {item.question}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-slate-600">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden />
            <span>{t('refundPolicyPage.trustLine')}</span>
          </div>
          <Button
            variant={footerVariant as 'default' | 'outline' | 'secondary'}
            onClick={footerAction.onClick}
            disabled={footerDisabled}
            className="h-11 rounded-2xl px-5 text-sm font-semibold"
          >
            {footerAction.type === 'refund' && actionLoading === 'refund' ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : null}
            {footerAction.label}
          </Button>
        </div>
      </div>
    </main>
  );
};

export default RefundPolicy;
