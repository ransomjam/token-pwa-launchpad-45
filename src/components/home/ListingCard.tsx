import { useCallback, useEffect, useMemo, useState } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ListingSummary } from '@/types';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MessageCircle,
  ShieldCheck,
  XCircle,
  CheckCheck,
  ArrowUpRight,
} from 'lucide-react';
import { useIntersectionOnce } from '@/hooks/use-intersection-once';
import { useI18n } from '@/context/I18nContext';
import { useNavigate } from 'react-router-dom';

const laneBadgeStyles = {
  green: {
    base: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2,
  },
  amber: {
    base: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: AlertTriangle,
  },
  red: {
    base: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: XCircle,
  },
} as const;

type LaneTone = keyof typeof laneBadgeStyles;

type ListingCardProps = {
  listing: ListingSummary;
  position: number;
  onView: (id: string) => void;
  onOpen: (listing: ListingSummary) => void;
  onPreOrder: (listing: ListingSummary) => void;
  onShare: (listing: ListingSummary) => void;
  formattedPrice: string;
  lockCountdown: string;
};

const laneTone = (pct: number): LaneTone => {
  if (pct >= 0.9) return 'green';
  if (pct >= 0.75) return 'amber';
  return 'red';
};

const preloadImage = (src: string) => {
  if (typeof window === 'undefined') return;
  const img = new window.Image();
  img.src = src;
};

export const ListingCard = ({
  listing,
  position,
  onView,
  onOpen,
  onPreOrder,
  onShare,
  formattedPrice,
  lockCountdown,
}: ListingCardProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const { t } = useI18n();
  const navigate = useNavigate();

  const primaryImage = useMemo(() => listing.images[0] ?? '/placeholder.svg', [listing.images]);
  const displayImage = imageError ? '/placeholder.svg' : primaryImage;

  const etaChipLabel = useMemo(
    () => t('home.etaChip', { min: listing.etaDays.min, max: listing.etaDays.max }),
    [listing.etaDays.max, listing.etaDays.min, t],
  );

  const etaChipAria = useMemo(
    () => t('home.etaChipAria', { min: listing.etaDays.min, max: listing.etaDays.max }),
    [listing.etaDays.max, listing.etaDays.min, t],
  );

  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [primaryImage]);

  useEffect(() => {
    preloadImage(primaryImage);
  }, [primaryImage]);

  const percent = Math.min(100, Math.round((listing.moq.committed / listing.moq.target) * 100));

  const moqLabel = useMemo(
    () => t('home.moqLabel', { value: listing.moq.target }),
    [listing.moq.target, t],
  );

  const factsLine = useMemo(
    () => t('home.factsLine', {
      joined: `${listing.moq.committed}/${listing.moq.target}`,
      target: listing.moq.target,
      locks: lockCountdown,
    }),
    [listing.moq.committed, listing.moq.target, lockCountdown, t],
  );

  const progressAria = useMemo(
    () => t('home.moqProgressAria', { percent: progressValue }),
    [progressValue, t],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setProgressValue(percent), 80);
    return () => window.clearTimeout(timer);
  }, [percent]);

  const notifyView = useCallback(() => onView(listing.id), [listing.id, onView]);
  const intersectionOptions = useMemo<IntersectionObserverInit>(() => ({ threshold: 0.5 }), []);
  const viewRef = useIntersectionOnce<HTMLDivElement>(notifyView, intersectionOptions);

  const tone = laneTone(listing.lane.onTimePct);
  const LaneIcon = laneBadgeStyles[tone].icon;
  const [origin = '', destination = '', modeRaw = ''] = listing.lane.code.split('-');
  const modeLabel = modeRaw.toLowerCase() === 'air' ? t('home.modeAir') : t('home.modeSea');
  const laneLabel = t('home.laneLabel', {
    origin,
    destination,
    mode: modeLabel,
    pct: Math.round(listing.lane.onTimePct * 100),
  });

  const cardAria = useMemo(
    () => t('home.cardAriaLabel', { title: listing.title }),
    [listing.title, t],
  );

  const cardPositionLabel = useMemo(
    () => t('home.cardPosition', { position: position + 1 }),
    [position, t],
  );

  const handleOpen = () => {
    onOpen(listing);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  const handlePreOrder = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onPreOrder(listing);
  };

  const handleShare = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onShare(listing);
  };

  const handleImporterProfile = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    navigate(`/importers/${listing.importer.id}/profile`);
  };

  return (
    <article
      ref={viewRef}
      role="link"
      tabIndex={0}
      aria-label={cardAria}
      onKeyDown={handleKeyDown}
      onClick={handleOpen}
      className="group relative flex cursor-pointer flex-col gap-5 rounded-3xl border border-border/70 bg-card p-5 shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 active:translate-y-[1px]"
    >
      <div className="relative">
        <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-2xl bg-muted">
          <img
            src={displayImage}
            loading="lazy"
            decoding="async"
            alt={listing.title}
            className={cn(
              'h-full w-full object-cover transition-opacity duration-500',
              imageLoaded ? 'opacity-100' : 'opacity-0',
            )}
            onLoad={() => setImageLoaded(true)}
            onError={() => {
              if (!imageError) {
                setImageError(true);
                setImageLoaded(true);
              }
            }}
          />
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-muted via-muted/60 to-muted/40" aria-hidden />
          )}
        </AspectRatio>
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span
            aria-label={etaChipAria}
            className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-background/90 px-3 py-1 text-xs font-medium text-foreground shadow-sm backdrop-blur"
          >
            <Clock3 className="h-3.5 w-3.5" />
            {etaChipLabel}
          </span>
        </div>
        <div className="absolute right-4 top-4">
          <span
            className={cn(
              'inline-flex max-w-[220px] items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium shadow-sm backdrop-blur',
              laneBadgeStyles[tone].base,
            )}
            aria-label={`${laneLabel}`}
          >
            <LaneIcon className="h-3.5 w-3.5" />
            <span className="truncate">{laneLabel}</span>
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start gap-2">
              <h3 className="line-clamp-2 flex-1 text-base font-semibold leading-tight text-foreground">
                {listing.title}
              </h3>
              {listing.importer.verified && (
                <span className="flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                  <CheckCheck className="h-3.5 w-3.5" />
                  {t('home.verifiedImporter')}
                </span>
              )}
            </div>
            <div>
              <button
                type="button"
                onClick={handleImporterProfile}
                className="inline-flex items-center gap-1 rounded-full bg-muted/70 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className="truncate">
                  {t('home.importerByline', { name: listing.importer.displayName })}
                </span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold text-foreground">{formattedPrice}</p>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{moqLabel}</p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground">{factsLine}</p>

        <div className="flex items-center gap-3">
          <Progress value={progressValue} aria-label={progressAria} className="h-2.5 flex-1 rounded-full bg-muted" />
          {percent >= 80 && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
              {t('home.almostThere')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>{t('home.heroCopy')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-1">
        <Button
          onClick={handlePreOrder}
          aria-label={`${t('home.preorder')} ${listing.title}`}
          className="h-12 flex-1 rounded-full text-base font-semibold shadow-soft"
        >
          {t('home.preorder')}
        </Button>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              onClick={handleShare}
              aria-label={t('home.shareWhatsapp', { title: listing.title })}
              className="h-12 w-12 rounded-full border border-border bg-card p-0 text-foreground shadow-sm"
            >
              <MessageCircle className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('home.share')}</TooltipContent>
        </Tooltip>
      </div>

      <span className="sr-only">{cardPositionLabel}</span>
    </article>
  );
};
