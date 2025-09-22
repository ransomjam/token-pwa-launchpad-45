import { useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Clock3, MessageCircle, ShieldCheck, Store, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import type { ListingSummary } from '@/types';
import { useI18n } from '@/context/I18nContext';
import { languageNames } from '@/components/shell/AccountControls';
import { trackEvent } from '@/lib/analytics';
import { FALLBACK_LISTINGS } from '@/components/home/HomeFeed';

const laneTone = (pct: number) => {
  if (pct >= 0.9) return 'green' as const;
  if (pct >= 0.75) return 'amber' as const;
  return 'red' as const;
};

const laneStyles = {
  green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  amber: 'bg-amber-50 text-amber-700 border-amber-200',
  red: 'bg-rose-50 text-rose-700 border-rose-200',
} as const;

const fetchListingById = async (id: string) => {
  const response = await fetch(`/api/listings/${id}`);
  if (!response.ok) {
    throw new Error('Listing not found');
  }
  return response.json() as Promise<ListingSummary>;
};

const ListingDetails = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const id = params.id;

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListingById(id!),
    enabled: Boolean(id),
  });

  const fallbackListing = useMemo(() => {
    if (!id) return null;
    return FALLBACK_LISTINGS.find(item => item.id === id) ?? null;
  }, [id]);

  const fallbackActive = Boolean(!data && !isLoading && fallbackListing && (isError || data === undefined));
  const listing = data ?? (fallbackActive ? fallbackListing : null);

  const priceFormatter = useMemo(() => {
    const localeKey = locale === 'fr' ? 'fr-CM' : 'en-US';
    return new Intl.NumberFormat(localeKey, {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    });
  }, [locale]);

  const formatLockCountdown = useCallback((iso: string) => {
    const now = Date.now();
    const lockTime = new Date(iso).getTime();
    const diff = lockTime - now;
    if (Number.isNaN(diff)) return t('home.locksSoon');
    if (diff <= 0) return t('home.lockingNow');
    const minutes = Math.floor(diff / 60000);
    if (minutes >= 1440) {
      return t('home.locksInDays', { value: Math.round(minutes / 1440) });
    }
    if (minutes >= 60) {
      return t('home.locksInHours', { value: Math.floor(minutes / 60) });
    }
    return t('home.locksInMinutes', { value: Math.max(1, minutes) });
  }, [t]);

  const handleShare = useCallback(async (listing: ListingSummary) => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    const shareUrl = `${window.location.origin}/listings/${listing.id}`;
    trackEvent('share_click', { id: listing.id, channel: 'whatsapp' });
    const message = t('home.shareMessage', {
      title: listing.title,
      price: priceFormatter.format(listing.priceXAF),
      url: shareUrl,
    });
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, text: message, url: shareUrl });
        toast({ description: t('home.shareOpened') });
        return;
      } catch (error) {
        // fallback to clipboard
      }
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        toast({ description: t('home.shareCopied') });
      } catch (error) {
        toast({ description: t('home.shareFailed'), variant: 'destructive' });
      }
    } else {
      toast({ description: `${t('home.shareFallback')} ${shareUrl}` });
    }
  }, [priceFormatter, t, toast]);

  if (isLoading) {
    return (
      <main className="min-h-dvh bg-background px-6 py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <Skeleton className="h-10 w-32 rounded-full" />
          <Skeleton className="h-56 w-full rounded-3xl" />
          <Skeleton className="h-12 w-2/3 rounded-2xl" />
          <Skeleton className="h-16 w-full rounded-2xl" />
        </div>
      </main>
    );
  }

  if (!listing || !id) {
    return (
      <main className="min-h-dvh bg-background px-6 py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold text-foreground">{t('home.detailUnavailable')}</p>
          <p className="text-sm text-muted-foreground">{t('home.detailUnavailableSubtitle')}</p>
          <Button onClick={() => navigate(-1)}>{t('common.close')}</Button>
        </div>
      </main>
    );
  }

  const etaLabel = t('home.etaChip', { min: listing.etaDays.min, max: listing.etaDays.max });
  const etaAria = t('home.etaChipAria', { min: listing.etaDays.min, max: listing.etaDays.max });
  const [origin = '', destination = '', modeRaw = ''] = listing.lane.code.split('-');
  const modeLabel = modeRaw.toLowerCase() === 'air' ? t('home.modeAir') : t('home.modeSea');
  const laneLabel = t('home.laneLabel', {
    origin,
    destination,
    mode: modeLabel,
    pct: Math.round(listing.lane.onTimePct * 100),
  });
  const laneVariant = laneTone(listing.lane.onTimePct);
  const LaneIcon = laneVariant === 'green' ? CheckCircle2 : laneVariant === 'amber' ? AlertTriangle : XCircle;

  const progress = Math.min(100, Math.round((listing.moq.committed / listing.moq.target) * 100));
  const moqLabel = t('home.moqLabel', { value: listing.moq.target });
  const moqLocked = t('home.moqLocked', { committed: listing.moq.committed, target: listing.moq.target });
  const progressAria = t('home.moqProgressAria', { percent: progress });

  return (
    <main className="min-h-dvh bg-background px-6 py-8">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <header className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full border" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">{t('home.back')}</span>
          </Button>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase text-primary/80">{languageNames[locale]}</span>
            <h1 className="text-xl font-semibold text-foreground">{listing.title}</h1>
          </div>
        </header>

        <div className="space-y-4">
          <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-3xl bg-muted">
            <img src={listing.images[0]} alt={listing.title} className="h-full w-full object-cover" loading="lazy" />
          </AspectRatio>
          <div className="flex flex-wrap gap-2">
            <span
              className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm"
              aria-label={etaAria}
            >
              <Clock3 className="h-3.5 w-3.5" />
              {etaLabel}
            </span>
            <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm ${laneStyles[laneVariant]}`}>
              <LaneIcon className="h-3.5 w-3.5" />
              {laneLabel}
            </span>
          </div>
        </div>

        <section className="space-y-4 rounded-3xl border border-border bg-card p-5 shadow-soft">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <h2 className="text-lg font-semibold text-foreground">{listing.title}</h2>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Store className="h-4 w-4" />
                <span>{listing.importer.displayName}</span>
                {listing.importer.verified && (
                  <Badge variant="outline" className="rounded-full border-emerald-300 bg-emerald-50 text-emerald-700">
                    {t('dashboard.importerStatusVerified')}
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{priceFormatter.format(listing.priceXAF)}</p>
              <p className="text-xs text-muted-foreground">{moqLabel}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
              <span>{moqLocked}</span>
              <span>{formatLockCountdown(listing.moq.lockAt)}</span>
            </div>
            <Progress value={progress} aria-label={progressAria} />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>{t('home.heroCopy')}</span>
          </div>

          <div className="flex flex-wrap gap-3 pt-2">
            <Button className="flex-1 rounded-2xl py-2 text-base font-semibold" onClick={() => trackEvent('listing_card_click', { id: listing.id, position: 'detail' })}>
              {t('home.preorder')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              className="h-12 w-12 rounded-2xl border border-border"
              onClick={() => handleShare(listing)}
              aria-label={t('home.shareWhatsapp', { title: listing.title })}
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </div>
        </section>

        {listing.specs.length > 0 && (
          <section className="space-y-3 rounded-3xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{t('home.keySpecs')}</h2>
            <ul className="grid gap-2 text-sm text-foreground">
              {listing.specs.map(spec => (
                <li key={spec} className="rounded-2xl bg-muted px-3 py-2 text-muted-foreground">{spec}</li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </main>
  );
};

export default ListingDetails;
