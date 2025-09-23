import { useCallback, useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  loadImporterPublicProfile,
  type PublicImporterListing,
  type PublicImporterProfile,
} from '@/lib/profile-data';
import { useI18n } from '@/context/I18nContext';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/components/ui/use-toast';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  MessageCircle,
  PackageCheck,
  ShieldCheck,
  Share2,
  Sparkles,
} from 'lucide-react';

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  })
    .format(value)
    .replace('XAF', 'XAF');

type ReliabilityTone = 'emerald' | 'amber' | 'rose';

const reliabilityTone = (pct: number): ReliabilityTone => {
  if (pct >= 90) return 'emerald';
  if (pct >= 80) return 'amber';
  return 'rose';
};

const reliabilityStyles: Record<
  ReliabilityTone,
  { chip: string; dot: string; text: string }
> = {
  emerald: {
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dot: 'bg-emerald-500',
    text: 'text-emerald-700',
  },
  amber: {
    chip: 'border-amber-200 bg-amber-50 text-amber-700',
    dot: 'bg-amber-500',
    text: 'text-amber-700',
  },
  rose: {
    chip: 'border-rose-200 bg-rose-50 text-rose-700',
    dot: 'bg-rose-500',
    text: 'text-rose-700',
  },
};

const formatPercent = (value: number) => {
  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
};

type MetricId = 'ontime' | 'dispute' | 'response' | 'orders';

type MetricDefinition = {
  id: MetricId;
  label: string;
  value: string;
  icon: LucideIcon;
  tooltip: string;
  ariaLabel: string;
  valueClassName?: string;
};

type ListingCardProps = {
  listing: PublicImporterListing;
  onOpen: (listing: PublicImporterListing) => void;
  formatPrice: (value: number) => string;
  t: ReturnType<typeof useI18n>['t'];
};

const ListingCard = ({ listing, onOpen, formatPrice: priceFormatter, t }: ListingCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const progressPercent = listing.moqTarget
    ? Math.min(100, Math.round((listing.moqCommitted / listing.moqTarget) * 100))
    : 0;

  const tone = reliabilityTone(listing.laneOnTimePct ?? 0);
  const toneStyles = reliabilityStyles[tone];
  const etaText = t('publicProfile.listings.eta', { eta: listing.etaLabel });
  const priceLabel = priceFormatter(listing.priceXAF);
  const cardLabel = t('publicProfile.listings.cardAria', {
    title: listing.title,
    price: priceLabel,
    eta: listing.etaLabel,
  });
  const laneAria = t('publicProfile.listings.laneBadgeAria', {
    lane: listing.laneLabel,
    pct: Math.round(listing.laneOnTimePct ?? 0),
  });

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onOpen(listing);
    }
  };

  const imageSrc = imageError ? '/placeholder.svg' : listing.image;

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={cardLabel}
      onClick={() => onOpen(listing)}
      onKeyDown={handleKeyDown}
      className="group relative flex h-full flex-col rounded-3xl border border-border/60 bg-card/90 p-4 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
    >
      <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-2xl bg-muted">
        <img
          src={imageSrc}
          alt={listing.title}
          loading="lazy"
          decoding="async"
          className={cn(
            'h-full w-full object-cover transition duration-700',
            imageLoaded ? 'scale-100 blur-0 opacity-100' : 'scale-105 blur-lg opacity-70',
          )}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            if (!imageError) {
              setImageError(true);
            }
          }}
        />
      </AspectRatio>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge
          variant="outline"
          aria-label={laneAria}
          className={cn(
            'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-soft',
            toneStyles.chip,
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', toneStyles.dot)} aria-hidden />
          <span>
            {listing.laneLabel} • {t('publicProfile.laneReliability', { pct: Math.round(listing.laneOnTimePct ?? 0) })}
          </span>
        </Badge>
        <Badge
          variant="outline"
          className="rounded-full border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground"
        >
          {etaText}
        </Badge>
      </div>

      <h3 className="mt-3 line-clamp-2 text-base font-semibold text-foreground">{listing.title}</h3>
      <p className="mt-1 text-sm font-semibold text-primary">{priceLabel}</p>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{t('publicProfile.listings.progressLabel', { committed: listing.moqCommitted, target: listing.moqTarget })}</span>
          <span className="font-semibold text-foreground">{progressPercent}%</span>
        </div>
        <Progress
          value={progressPercent}
          max={100}
          aria-label={t('publicProfile.listings.progressLabel', {
            committed: listing.moqCommitted,
            target: listing.moqTarget,
          })}
          className="h-2 w-full overflow-hidden rounded-full bg-muted"
        />
      </div>
    </article>
  );
};

const PublicImporterProfile = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const profile: PublicImporterProfile = useMemo(() => loadImporterPublicProfile(id), [id]);
  const { t } = useI18n();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [showAllListings, setShowAllListings] = useState(false);
  const [openMetric, setOpenMetric] = useState<MetricId | null>(null);

  useEffect(() => {
    trackEvent('imp_public_profile_view', { importerId: profile.id });
  }, [profile.id]);

  const performance = profile.metrics;

  const laneMap = useMemo(() => {
    const map = new Map<string, { label: string; onTimePct: number }>();
    profile.lanes.forEach(lane => {
      map.set(lane.id, { label: lane.label, onTimePct: lane.onTimePct });
    });
    return map;
  }, [profile.lanes]);

  const listings = useMemo(
    () =>
      profile.recentListings.map(listing => {
        const lane = laneMap.get(listing.laneId);
        return {
          ...listing,
          laneLabel: listing.laneLabel ?? lane?.label ?? listing.laneId,
          laneOnTimePct: listing.laneOnTimePct ?? lane?.onTimePct ?? performance.onTimePct,
        };
      }),
    [laneMap, performance.onTimePct, profile.recentListings],
  );

  const categories = useMemo(() => profile.categories, [profile.categories]);

  useEffect(() => {
    if (activeCategory !== 'all' && !categories.some(category => category.id === activeCategory)) {
      setActiveCategory('all');
    }
  }, [activeCategory, categories]);

  useEffect(() => {
    setShowAllListings(false);
  }, [activeCategory]);

  const categoryChips = useMemo(
    () => [{ id: 'all', label: t('publicProfile.categories.all') }, ...categories],
    [categories, t],
  );

  const filteredListings = useMemo(() => {
    if (activeCategory === 'all') {
      return listings;
    }
    return listings.filter(listing => listing.categories.includes(activeCategory));
  }, [activeCategory, listings]);

  const displayedListings = useMemo(
    () => (showAllListings ? filteredListings : filteredListings.slice(0, 3)),
    [filteredListings, showAllListings],
  );

  const canToggleListings = filteredListings.length > 3;
  const usingSampleListings = filteredListings.length > 0 && filteredListings.every(listing => listing.isSample);

  const metricsConfig = useMemo<MetricDefinition[]>(() => {
    const onTimeTone = reliabilityTone(performance.onTimePct);
    const onTimeDisplay = formatPercent(performance.onTimePct);
    const disputeDisplay = formatPercent(performance.disputeRatePct);

    return [
      {
        id: 'ontime',
        label: t('publicProfile.metrics.onTime'),
        value: onTimeDisplay,
        icon: Clock3,
        tooltip: t('publicProfile.metrics.tooltips.onTime'),
        ariaLabel: t('publicProfile.metrics.aria.onTime', { value: onTimeDisplay }),
        valueClassName: reliabilityStyles[onTimeTone].text,
      },
      {
        id: 'dispute',
        label: t('publicProfile.metrics.dispute'),
        value: disputeDisplay,
        icon: AlertTriangle,
        tooltip: t('publicProfile.metrics.tooltips.dispute'),
        ariaLabel: t('publicProfile.metrics.aria.dispute', { value: disputeDisplay }),
      },
      {
        id: 'response',
        label: t('publicProfile.metrics.response', { time: performance.responseTimeLabel }),
        value: performance.responseTimeLabel,
        icon: MessageCircle,
        tooltip: t('publicProfile.metrics.tooltips.response'),
        ariaLabel: t('publicProfile.metrics.aria.response', { value: performance.responseTimeLabel }),
      },
      {
        id: 'orders',
        label: t('publicProfile.metrics.orders'),
        value: performance.ordersFulfilledLabel,
        icon: PackageCheck,
        tooltip: t('publicProfile.metrics.tooltips.orders'),
        ariaLabel: t('publicProfile.metrics.aria.orders', { value: performance.ordersFulfilledLabel }),
      },
    ];
  }, [performance.disputeRatePct, performance.onTimePct, performance.ordersFulfilledLabel, performance.responseTimeLabel, t]);

  const copyShareLink = useCallback(async () => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(profile.shareUrl);
        toast({ title: t('publicProfile.shareToast') });
        return;
      }
      throw new Error('Clipboard API unavailable');
    } catch (error) {
      toast({ title: t('publicProfile.shareFallbackTitle'), description: profile.shareUrl });
    }
  }, [profile.shareUrl, t]);

  const handleShareCopy = useCallback(async () => {
    trackEvent('imp_public_profile_share_click', { importerId: profile.id, channel: 'copy' });
    await copyShareLink();
  }, [copyShareLink, profile.id]);

  const handleWhatsAppShare = useCallback(() => {
    trackEvent('imp_public_profile_share_click', { importerId: profile.id, channel: 'whatsapp' });
    const message = t('publicProfile.shareMessage', { store: profile.storeName, url: profile.shareUrl });
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    toast({ title: t('publicProfile.shareWhatsappToast') });
  }, [profile.id, profile.shareUrl, profile.storeName, t]);

  const handleCategorySelect = useCallback(
    (categoryId: string) => {
      setActiveCategory(categoryId);
      trackEvent('imp_public_profile_category_filter', { importerId: profile.id, category: categoryId });
    },
    [profile.id],
  );

  const handleListingOpen = useCallback(
    (listing: PublicImporterListing) => {
      trackEvent('imp_public_profile_listing_click', { importerId: profile.id, listingId: listing.id });
      navigate(`/listings/${listing.id}`);
    },
    [navigate, profile.id],
  );

  const handleReport = useCallback(() => {
    trackEvent('imp_public_profile_report_click', { importerId: profile.id });
    const subject = t('publicProfile.reportEmailSubject', { store: profile.storeName });
    const mailto = `mailto:support@prolist.africa?subject=${encodeURIComponent(subject)}`;
    window.open(mailto, '_blank', 'noopener,noreferrer');
  }, [profile.id, profile.storeName, t]);

  const hasListings = filteredListings.length > 0;

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="inline-flex w-fit items-center gap-2 rounded-full border border-border/70 bg-card/80 px-4 py-2 text-sm font-semibold text-muted-foreground shadow-soft transition-all hover:-translate-y-0.5 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('publicProfile.back')}
        </button>

        <header className="space-y-6 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 rounded-2xl border border-border/70 shadow-soft">
                <AvatarFallback className="rounded-2xl bg-primary/10 text-lg font-semibold text-primary">
                  {profile.avatarInitials}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">{profile.storeName}</h1>
                  {profile.verified ? (
                    <Badge
                      variant="outline"
                      role="status"
                      aria-label={t('publicProfile.badges.verifiedAria')}
                      className="flex items-center gap-1 rounded-full border-emerald-400 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden />
                      {t('publicProfile.badges.verified')}
                    </Badge>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" aria-hidden />
                  <span>{profile.city}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {profile.lanes.map(lane => {
                    const toneKey = reliabilityTone(lane.onTimePct);
                    const toneClass = reliabilityStyles[toneKey];
                    return (
                      <Badge
                        key={lane.id}
                        variant="outline"
                        aria-label={`${lane.label} • ${t('publicProfile.laneReliability', { pct: Math.round(lane.onTimePct) })}`}
                        className={cn(
                          'flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-soft',
                          toneClass.chip,
                        )}
                      >
                        <span className={cn('h-2 w-2 rounded-full', toneClass.dot)} aria-hidden />
                        <span>
                          {lane.label} • {t('publicProfile.laneReliability', { pct: Math.round(lane.onTimePct) })}
                        </span>
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                onClick={handleShareCopy}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
              >
                <Share2 className="h-4 w-4" aria-hidden />
                {t('publicProfile.shareCta')}
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                aria-label={t('publicProfile.shareWhatsapp')}
                onClick={handleWhatsAppShare}
                className="rounded-full bg-card/80 shadow-soft"
              >
                <MessageCircle className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-soft sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden />
              <span>{t('publicProfile.trustStrip')}</span>
            </div>
          </div>
        </header>

        <section className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">{t('publicProfile.metrics.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('publicProfile.metrics.subtitle')}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {metricsConfig.map(metric => {
              const Icon = metric.icon;
              const isOpen = openMetric === metric.id;
              return (
                <Popover
                  key={metric.id}
                  open={isOpen}
                  onOpenChange={open => {
                    setOpenMetric(open ? metric.id : null);
                    if (open) {
                      trackEvent('imp_public_profile_metric_tooltip_open', {
                        importerId: profile.id,
                        metric: metric.id,
                      });
                    }
                  }}
                >
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-label={metric.ariaLabel}
                      className="group flex w-full flex-col gap-2 rounded-2xl border border-border/70 bg-card/90 px-4 py-5 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
                    >
                      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                        <Icon className="h-4 w-4" aria-hidden />
                        <span>{metric.label}</span>
                      </div>
                      <span className={cn('text-2xl font-semibold tracking-tight text-foreground', metric.valueClassName)}>
                        {metric.value}
                      </span>
                    </button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="max-w-xs rounded-2xl border border-border/70 bg-card/95 text-sm text-muted-foreground shadow-soft">
                    <p>{metric.tooltip}</p>
                    {performance.source === 'platform_average' ? (
                      <p className="mt-3 text-xs text-muted-foreground">{t('publicProfile.metrics.tooltips.average')}</p>
                    ) : null}
                  </PopoverContent>
                </Popover>
              );
            })}
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground sm:text-xl">{t('publicProfile.categories.title')}</h2>
              <p className="text-sm text-muted-foreground">{t('publicProfile.categories.subtitle')}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {categoryChips.map(category => {
              const isActive = category.id === activeCategory;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handleCategorySelect(category.id)}
                  aria-pressed={isActive}
                  aria-label={t('publicProfile.categories.filterAria', { category: category.label })}
                  className={cn(
                    'group relative overflow-hidden rounded-full border border-border/70 px-4 py-2 text-sm font-semibold text-foreground shadow-soft transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60',
                    isActive ? 'bg-foreground text-background' : 'bg-background/60 hover:border-foreground/30',
                  )}
                >
                  <span>{category.label}</span>
                  <span
                    aria-hidden
                    className={cn(
                      'absolute inset-x-3 bottom-1 h-0.5 rounded-full bg-current transition-all duration-200',
                      isActive ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100',
                    )}
                  />
                </button>
              );
            })}
          </div>
        </section>
        <section className="space-y-5 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-foreground sm:text-xl">{t('publicProfile.listings.title')}</h2>
                {usingSampleListings ? (
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {t('publicProfile.listings.sampleLabel')}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {t('publicProfile.listings.subtitle', { count: filteredListings.length })}
              </p>
            </div>
            {canToggleListings ? (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setShowAllListings(previous => !previous)}
                className="rounded-full px-4 text-sm font-semibold text-muted-foreground hover:text-foreground"
              >
                {showAllListings
                  ? t('publicProfile.listings.viewLess')
                  : t('publicProfile.listings.viewAll')}
              </Button>
            ) : null}
          </div>

          {hasListings ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {displayedListings.map(listing => (
                <ListingCard
                  key={listing.id}
                  listing={listing}
                  onOpen={handleListingOpen}
                  formatPrice={formatPrice}
                  t={t}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border/70 bg-background/70 px-6 py-10 text-center shadow-soft">
              <Sparkles className="h-6 w-6 text-amber-500" aria-hidden />
              <h3 className="text-base font-semibold text-foreground">{t('publicProfile.listings.emptyTitle')}</h3>
              <p className="max-w-sm text-sm text-muted-foreground">{t('publicProfile.listings.emptyBody')}</p>
              <Button
                type="button"
                onClick={handleShareCopy}
                className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
              >
                {t('publicProfile.listings.shareCta')}
              </Button>
            </div>
          )}
        </section>

        <section className="space-y-6 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">{t('publicProfile.about.title')}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{profile.about}</p>
          </div>

          <div className="space-y-3 rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <ShieldCheck className="h-4 w-4" aria-hidden />
              <span>{t('publicProfile.policies.title')}</span>
            </div>
            <p className="text-sm text-muted-foreground">{t('publicProfile.policies.summary')}</p>
            <a
              href={profile.policyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-emerald-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <span>{t('publicProfile.policies.link')}</span>
              <ExternalLink className="h-4 w-4" aria-hidden />
            </a>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">
              {t('publicProfile.pickups.title')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {profile.pickupHubs.map(hub => (
                <Badge
                  key={hub}
                  variant="outline"
                  className="rounded-full border-border/70 bg-background/70 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  {hub}
                </Badge>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" aria-hidden />
            <h2 className="text-lg font-semibold text-foreground sm:text-xl">
              {t('publicProfile.socialProof.title')}
            </h2>
          </div>
          {profile.socialProof.length ? (
            <ul className="space-y-3">
              {profile.socialProof.map(snippet => (
                <li
                  key={snippet.id}
                  className="rounded-2xl border border-border/60 bg-background/80 p-4 text-sm leading-relaxed text-muted-foreground shadow-soft"
                >
                  {snippet.quote}
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border/60 bg-background/70 p-4 text-sm text-muted-foreground">
              {t('publicProfile.socialProof.empty')}
            </p>
          )}
        </section>

        <footer className="mt-auto flex flex-col gap-4 rounded-3xl border border-border/70 bg-card/90 p-6 shadow-soft sm:flex-row sm:items-center sm:justify-between">
          <Button
            type="button"
            onClick={handleShareCopy}
            className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground shadow-soft hover:bg-primary/90"
          >
            <Share2 className="h-4 w-4" aria-hidden />
            {t('publicProfile.footer.share')}
          </Button>
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            <button
              type="button"
              onClick={handleReport}
              className="underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              {t('publicProfile.footer.report')}
            </button>
            <a
              href="mailto:support@prolist.africa"
              className="underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              {t('publicProfile.footer.support')}
            </a>
          </div>
        </footer>
      </div>
    </main>
  );
};

export default PublicImporterProfile;
