import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
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
    base: 'border border-primary/40 bg-primary/15 text-primary shadow-soft',
    icon: CheckCircle2,
  },
  amber: {
    base: 'border border-amber-300/50 bg-amber-100/40 text-amber-700 shadow-soft',
    icon: AlertTriangle,
  },
  red: {
    base: 'border border-rose-300/50 bg-rose-100/40 text-rose-600 shadow-soft',
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

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleOpen();
    }
  };

  const handlePreOrder = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onPreOrder(listing);
  };

  const handleShare = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onShare(listing);
  };

  const handleImporterProfile = (event: MouseEvent<HTMLButtonElement>) => {
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
      className="group relative flex cursor-pointer flex-col gap-3 overflow-hidden rounded-3xl border border-white/50 bg-white/75 p-4 shadow-soft backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-[1px] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-blue/20 before:via-transparent before:to-primary/20 before:opacity-0 before:transition-opacity before:content-[''] group-hover:before:opacity-100"
    >
      {listing.importer.verified && (
        <span className="absolute right-4 top-4 z-10 inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/15 px-2.5 py-1 text-[11px] font-medium text-primary shadow-soft">
          <CheckCheck className="h-3 w-3" />
          {t('home.verifiedImporter')}
        </span>
      )}
      <div className="relative">
        <AspectRatio ratio={5 / 2} className="overflow-hidden rounded-2xl bg-muted">
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
            className="pill gap-1 bg-white/85 px-2 py-1 text-xs text-foreground/80 shadow-soft normal-case"
          >
            <Clock3 className="h-3 w-3 text-blue" />
            {etaChipLabel}
          </span>
        </div>
        <div className="absolute left-4 bottom-4">
          <span
            className={cn(
              'pill max-w-[220px] gap-1 bg-white/80 px-2 py-1 text-[11px] text-foreground/80 normal-case',
              laneBadgeStyles[tone].base,
            )}
            aria-label={`${laneLabel}`}
          >
            <LaneIcon className="h-3 w-3" />
            <span className="truncate">{laneLabel}</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start gap-1.5">
              <h3 className="line-clamp-2 flex-1 text-sm font-semibold leading-snug text-foreground">
                {listing.title}
              </h3>
            </div>
            <div>
              <button
                type="button"
                onClick={handleImporterProfile}
                className="inline-flex items-center gap-1 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              >
                <span className="truncate">
                  {t('home.importerByline', { name: listing.importer.displayName })}
                </span>
                <ArrowUpRight className="h-3 w-3" />
              </button>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-foreground">{formattedPrice}</p>
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{moqLabel}</p>
          </div>
        </div>

        <p className="text-xs text-muted-foreground/90">{factsLine}</p>

        <div className="flex items-center gap-2">
          <Progress value={progressValue} aria-label={progressAria} className="flex-1 h-1.5" />
          {percent >= 80 && (
            <span className="pill gap-1 border-primary/40 bg-primary/20 px-2 py-1 text-[11px] text-primary">
              {t('home.almostThere')}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-muted-foreground/90">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner">
            <ShieldCheck className="h-3.5 w-3.5" />
          </span>
          <span className="font-medium text-foreground/80 leading-tight">{t('home.heroCopy')}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <Button
          onClick={handlePreOrder}
          aria-label={`${t('home.preorder')} ${listing.title}`}
          className="h-10 flex-1 rounded-full text-sm font-semibold shadow-lux"
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
              className="h-10 w-10 rounded-full border border-white/60 bg-white/80 p-0 text-muted-foreground shadow-soft backdrop-blur hover:border-primary/40 hover:text-primary"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t('home.share')}</TooltipContent>
        </Tooltip>
      </div>

      <span className="sr-only">{cardPositionLabel}</span>
    </article>
  );
};
