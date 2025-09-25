import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  BellRing,
  Building2,
  CheckCircle2,
  Circle,
  Clock3,
  QrCode,
  ShieldCheck,
  Timer,
  Trophy,
  type LucideIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AppNav } from '@/components/navigation/AppNav';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { getAuctionById, isDemoWinsSeed, loadWins } from '@/lib/auctionData';
import type { AuctionListing, AuctionWin, AuctionWinJourneyStage, AuctionWinSla } from '@/types/auctions';

const PREVIEW_BADGE_VISIBLE = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

const resolveAuction = (win: AuctionWin): AuctionListing | null => {
  const auction = getAuctionById(win.auctionId);
  if (auction) return auction;
  return null;
};

const stageIcons: Record<AuctionWinJourneyStage['status'], LucideIcon> = {
  complete: CheckCircle2,
  current: Timer,
  upcoming: Circle,
};

const stagePills: Record<AuctionWinJourneyStage['status'], string> = {
  complete: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  current: 'border-primary/30 bg-primary/10 text-primary',
  upcoming: 'border-border/70 bg-muted text-muted-foreground',
};

const metaTone: Record<NonNullable<AuctionWinJourneyStage['meta']>[number]['tone'] | 'default', string> = {
  default: 'border-border/60 bg-background text-muted-foreground',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
};

const slaTone: Record<AuctionWinSla['status'], string> = {
  on_track: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-800',
  overdue: 'border-rose-200 bg-rose-50 text-rose-700',
};

const ProfileWins = () => {
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  const wins = useMemo(() => loadWins(), []);
  const usingDemoData = useMemo(() => isDemoWinsSeed(), []);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const statusStyles: Record<AuctionWin['status'], string> = {
    pending_payment: 'bg-amber-100 text-amber-800 border-amber-200',
    paid: 'bg-primary/15 text-primary border-primary/30',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const formatCurrency = (value?: number) => {
    if (typeof value !== 'number') return '—';
    return currencyFormatter.format(value);
  };

  const handleBack = () => navigate(-1);

  const handleViewAuction = (auctionId: string) => {
    trackEvent('profile_wins_auction_open', { auctionId });
    navigate(`/auction/${auctionId}`);
  };

  const handleViewSeller = (sellerId?: string) => {
    if (!sellerId) return;
    trackEvent('profile_wins_seller_open', { sellerId });
    navigate(`/seller/${sellerId}`);
  };

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-3">
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
          <Badge variant="outline" className="mx-auto rounded-full border-dashed border-border/60 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {t('home.demoData')}
          </Badge>
        )}

        <div className="space-y-4">
          {wins.map(win => {
            const auction = resolveAuction(win);
            const seller = auction?.seller;
            const statusLabel = t(`profile.wins.status.${win.status}`);

            const paymentBreakdown = win.payment
              ? [
                  { label: t('profile.wins.finalBid'), value: win.payment.hammerPriceXAF },
                  {
                    label: t('profile.wins.buyerPremiumLabel', { pct: win.payment.buyerPremiumPct }),
                    value: win.payment.buyerPremiumXAF,
                  },
                  { label: t('profile.wins.serviceFeeLabel'), value: win.payment.serviceFeeXAF },
                  win.payment.centreHandlingFeeXAF
                    ? {
                        label: t('profile.wins.handlingFeeLabel'),
                        value: win.payment.centreHandlingFeeXAF,
                      }
                    : null,
                ].filter(Boolean) as { label: string; value: number }[]
              : [];

            return (
              <article key={win.id} className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-soft">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {auction?.title ?? t('profile.wins.fallbackTitle')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.wins.wonAt', {
                        date: new Date(win.wonAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US'),
                      })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold',
                      statusStyles[win.status]
                    )}
                  >
                    <Trophy className="h-4 w-4" />
                    {statusLabel}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('profile.wins.finalBid')}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">{formatCurrency(win.finalBidXAF)}</p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('profile.wins.sellerLabel')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {seller?.name ?? t('profile.wins.sellerFallback')}
                    </p>
                    {seller?.city && <p className="text-xs text-muted-foreground">{seller.city}</p>}
                  </div>
                  {win.payment && (
                    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-3">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        {t('profile.wins.totalDueLabel')}
                      </p>
                      <p className="mt-1 text-lg font-semibold text-primary">
                        {formatCurrency(win.payment.totalDueXAF)}
                      </p>
                      <p className="text-xs text-primary/80">{win.payment.statusLabel}</p>
                    </div>
                  )}
                </div>

                {win.payment && (
                  <div className="mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                          {t('profile.wins.nextAction')}
                        </p>
                        <p className="mt-1 text-sm font-medium text-primary">{win.payment.statusLabel}</p>
                        <p className="mt-1 text-xs text-primary/80">{win.payment.reminderLabel}</p>
                      </div>
                      <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/10 text-[11px] text-primary">
                        {t('profile.wins.paymentDue')}: {win.payment.dueByLabel}
                      </Badge>
                    </div>
                  </div>
                )}

                <div className="mt-6 grid gap-5 lg:grid-cols-3">
                  <section className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm lg:col-span-2">
                    <header className="flex flex-col gap-1">
                      <h3 className="text-base font-semibold text-foreground">{t('profile.wins.journeyTitle')}</h3>
                      <p className="text-sm text-muted-foreground">{t('profile.wins.journeySubtitle')}</p>
                    </header>
                    {win.journey?.length ? (
                      <div className="mt-5 space-y-6">
                        {win.journey.map((stage, index) => {
                          const Icon = stageIcons[stage.status];
                          return (
                            <div key={stage.id} className="relative flex gap-4">
                              <div className="flex flex-col items-center">
                                <span
                                  className={cn(
                                    'flex h-9 w-9 items-center justify-center rounded-full border text-sm',
                                    stagePills[stage.status]
                                  )}
                                >
                                  <Icon className="h-5 w-5" />
                                </span>
                                {index < win.journey!.length - 1 && (
                                  <span className="mt-2 h-full w-px grow bg-border/60" aria-hidden />
                                )}
                              </div>
                              <div className="flex-1 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-soft">
                                <div className="flex flex-wrap items-start justify-between gap-3">
                                  <div className="space-y-1">
                                    <p className="text-sm font-semibold text-foreground">{stage.title}</p>
                                    <p className="text-xs text-muted-foreground">{stage.description}</p>
                                  </div>
                                  <div className="flex flex-col items-end gap-1 text-right">
                                    <Badge
                                      variant="outline"
                                      className={cn(
                                        'rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                                        stagePills[stage.status]
                                      )}
                                    >
                                      {t(`profile.wins.journeyStatus.${stage.status}`)}
                                    </Badge>
                                    {stage.occurredAtLabel && (
                                      <span className="text-xs text-muted-foreground">{stage.occurredAtLabel}</span>
                                    )}
                                  </div>
                                </div>
                                <div className="mt-3 flex flex-wrap gap-2">
                                  <Badge variant="secondary" className="rounded-full bg-muted/60 text-xs font-medium text-muted-foreground">
                                    {t('profile.wins.journeyStateLabel')}: {stage.stateLabel}
                                  </Badge>
                                  {stage.meta?.map(meta => (
                                    <span
                                      key={`${stage.id}-${meta.label}`}
                                      className={cn(
                                        'inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                                        metaTone[meta.tone ?? 'default']
                                      )}
                                    >
                                      {meta.label}: {meta.value}
                                    </span>
                                  ))}
                                </div>
                                {stage.highlights?.length ? (
                                  <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                                    {stage.highlights.map(highlight => (
                                      <li key={highlight} className="flex gap-2">
                                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                                        <span>{highlight}</span>
                                      </li>
                                    ))}
                                  </ul>
                                ) : null}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="mt-4 text-sm text-muted-foreground">{t('profile.wins.emptyJourney')}</p>
                    )}
                  </section>

                  <div className="flex flex-col gap-5">
                    <section className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm">
                      <header className="flex items-center gap-2">
                        <BadgeCheck className="h-4 w-4 text-primary" />
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{t('profile.wins.paymentTitle')}</h3>
                        </div>
                      </header>
                      {win.payment ? (
                        <div className="mt-4 space-y-4">
                          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('profile.wins.totalDueLabel')}
                            </p>
                            <p className="mt-1 text-lg font-semibold text-foreground">
                              {formatCurrency(win.payment.totalDueXAF)}
                            </p>
                            <p className="text-xs text-muted-foreground">{win.payment.dueByLabel}</p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('profile.wins.paymentBreakdown')}
                            </p>
                            <ul className="mt-2 space-y-2 text-sm text-foreground">
                              {paymentBreakdown.map(item => (
                                <li key={item.label} className="flex items-center justify-between gap-3">
                                  <span>{item.label}</span>
                                  <span className="font-medium">{formatCurrency(item.value)}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          <div className="rounded-2xl border border-border/60 bg-card/80 p-4">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              {t('profile.wins.momoLabel')}
                            </p>
                            <p className="mt-1 font-mono text-sm text-foreground">{win.payment.momoInstructions}</p>
                          </div>
                          <div className="flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50/90 p-3">
                            <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-500" />
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">
                                {t('profile.wins.paymentReminder')}
                              </p>
                              <p className="mt-1 text-xs text-amber-600">{win.payment.reminderLabel}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">{t('profile.wins.emptyPayment')}</p>
                      )}
                    </section>

                    <section className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm">
                      <header className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        <div>
                          <h3 className="text-base font-semibold text-foreground">{t('profile.wins.logisticsTitle')}</h3>
                          <p className="text-xs text-muted-foreground">{t('profile.wins.logisticsSubtitle')}</p>
                        </div>
                      </header>
                      {win.logistics ? (
                        <div className="mt-4 space-y-4 text-sm text-foreground">
                          <div>
                            <p className="text-sm font-semibold">{win.logistics.centreName}</p>
                            <p className="text-xs text-muted-foreground">{win.logistics.centreAddress}</p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.wins.centreHours')}: {win.logistics.centreHours}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {t('profile.wins.centreContact')}: {win.logistics.centreContact}
                            </p>
                          </div>
                          <div className="grid gap-3">
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('profile.wins.dropoffCode')}
                              </p>
                              <div className="mt-1 flex items-center gap-2">
                                <QrCode className="h-5 w-5 text-primary" />
                                <span className="font-mono text-sm">{win.logistics.dropoffCode}</span>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t('profile.wins.dropoffDeadline')}: {win.logistics.dropoffDeadlineLabel}
                              </p>
                            </div>
                            <div className="rounded-2xl border border-border/60 bg-card/80 p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('profile.wins.pickupCode')}
                              </p>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <QrCode className="h-5 w-5 text-primary" />
                                <span className="font-mono text-sm">{win.logistics.pickupCode}</span>
                                <Badge variant="outline" className="rounded-full border-primary/40 bg-primary/5 text-[11px] text-primary">
                                  OTP {win.logistics.pickupOtp}
                                </Badge>
                              </div>
                              <p className="mt-1 text-xs text-muted-foreground">
                                {t('profile.wins.pickupDeadline')}: {win.logistics.pickupDeadlineLabel}
                              </p>
                            </div>
                          </div>
                          {win.logistics.notes?.length ? (
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                {t('profile.wins.logisticsNotes')}
                              </p>
                              <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                                {win.logistics.notes.map(note => (
                                  <li key={note} className="flex gap-2">
                                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                                    <span>{note}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">{t('profile.wins.emptyLogistics')}</p>
                      )}
                    </section>

                    <section className="rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm">
                      <header className="flex items-center gap-2">
                        <Clock3 className="h-4 w-4 text-primary" />
                        <h3 className="text-base font-semibold text-foreground">{t('profile.wins.slasTitle')}</h3>
                      </header>
                      {win.slas?.length ? (
                        <ul className="mt-4 space-y-3">
                          {win.slas.map(sla => (
                            <li key={sla.id} className="rounded-2xl border border-border/60 bg-card/80 p-3">
                              <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                  <p className="text-sm font-medium text-foreground">{sla.label}</p>
                                  <p className="text-xs text-muted-foreground">{sla.dueLabel}</p>
                                </div>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    'rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
                                    slaTone[sla.status]
                                  )}
                                >
                                  {t(`profile.wins.slaStatus.${sla.status}`)}
                                </Badge>
                              </div>
                              <p className="mt-2 text-xs text-muted-foreground">{sla.state}</p>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="mt-4 text-sm text-muted-foreground">{t('profile.wins.emptySlas')}</p>
                      )}
                    </section>
                  </div>
                </div>

                <section className="mt-6 rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm">
                  <header className="flex items-center gap-2">
                    <BellRing className="h-4 w-4 text-primary" />
                    <div>
                      <h3 className="text-base font-semibold text-foreground">{t('profile.wins.notificationsTitle')}</h3>
                      <p className="text-xs text-muted-foreground">{t('profile.wins.notificationsSubtitle')}</p>
                    </div>
                  </header>
                  {win.notifications?.length ? (
                    <ul className="mt-4 space-y-3">
                      {win.notifications.map(notification => (
                        <li key={notification.id} className="rounded-2xl border border-border/60 bg-card/80 p-3">
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <p className="text-sm font-medium text-foreground">{notification.message}</p>
                            <Badge variant="outline" className="rounded-full border px-2.5 py-0.5 text-[11px] text-muted-foreground">
                              {t(`profile.wins.notificationsChannel.${notification.channel}`)}
                            </Badge>
                          </div>
                          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{t(`profile.wins.notificationsAudience.${notification.audience}`)}</span>
                            <span className="inline-flex items-center gap-1">
                              <Clock3 className="h-3 w-3" />
                              {notification.sentAtLabel}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-4 text-sm text-muted-foreground">{t('profile.wins.emptyNotifications')}</p>
                  )}
                </section>

                <section className="mt-6 rounded-3xl border border-border/60 bg-background/80 p-5 shadow-sm">
                  <header className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-primary" />
                    <h3 className="text-base font-semibold text-foreground">{t('profile.wins.policyTitle')}</h3>
                  </header>
                  {win.policyNotes?.length ? (
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {win.policyNotes.map(note => (
                        <li key={note} className="flex gap-2">
                          <span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-sm text-muted-foreground">{t('profile.wins.emptyPolicy')}</p>
                  )}
                </section>

                <div className="mt-6 grid gap-2 sm:grid-cols-2">
                  <Button onClick={() => handleViewAuction(win.auctionId)} className="rounded-full">
                    {t('profile.wins.viewAuction')}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleViewSeller(seller?.id)}
                    disabled={!seller?.id}
                  >
                    {t('profile.wins.viewSeller')}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default ProfileWins;
