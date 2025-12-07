import { useCallback, useEffect, useMemo, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import type { ListingSummary } from '@/types';
import { Clock3, MessageCircle, ShieldCheck, ArrowUpRight } from 'lucide-react';
import { useIntersectionOnce } from '@/hooks/use-intersection-once';
import { useI18n } from '@/context/I18nContext';
import { useNavigate } from 'react-router-dom';

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
    navigate(`/creator/${listing.importer.id}`);
  };

  return (
    <article
      ref={viewRef}
      role="link"
      tabIndex={0}
      aria-label={cardAria}
      onKeyDown={handleKeyDown}
      onClick={handleOpen}
      className="group relative flex cursor-pointer flex-row items-stretch gap-4 overflow-hidden rounded-3xl border border-white/50 bg-white/75 p-4 shadow-soft backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-[1px] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-blue/20 before:via-transparent before:to-primary/20 before:opacity-0 before:transition-opacity before:content-[''] group-hover:before:opacity-100 sm:p-5 md:flex-col"
    >
      <div className="relative flex w-32 flex-shrink-0 flex-col gap-2 sm:w-36 md:w-full">
        <AspectRatio ratio={4 / 3} className="h-full overflow-hidden rounded-2xl bg-muted">
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
        <p className="text-sm font-semibold text-foreground sm:text-base">{formattedPrice}</p>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 md:gap-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h3 className="line-clamp-1 text-sm font-semibold leading-snug text-foreground sm:text-base">
                {listing.title}
              </h3>
              <button
                type="button"
                onClick={handleImporterProfile}
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                <span className="truncate">
                  {t('home.importerByline', { name: listing.importer.displayName })}
                </span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <p className="text-xs text-muted-foreground/90 sm:text-sm">{factsLine}</p>

          <div className="flex items-center gap-2">
            <Progress value={progressValue} aria-label={progressAria} className="h-2 flex-1" />
            {percent >= 80 && (
              <span className="pill gap-1.5 border-primary/40 bg-primary/20 px-2 py-0.5 text-[11px] text-primary sm:px-2.5 sm:py-1 sm:text-xs">
                {t('home.almostThere')}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground/90 sm:gap-3 sm:text-xs">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary shadow-inner sm:h-8 sm:w-8">
              <ShieldCheck className="h-4 w-4" />
            </span>
            <span className="whitespace-nowrap text-xs font-medium leading-tight text-foreground/80 sm:text-sm">
              {t('home.heroCopy')}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 pt-1">
          <Button
            onClick={handlePreOrder}
            aria-label={`${t('home.preorder')} ${listing.title}`}
            className="h-8 basis-1/2 rounded-full text-[11px] font-semibold shadow-lux sm:h-9 sm:text-xs"
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
                className="h-9 w-9 rounded-full border border-white/60 bg-white/80 p-0 text-muted-foreground shadow-soft backdrop-blur transition-colors hover:border-primary/40 hover:text-primary sm:h-10 sm:w-10"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t('home.share')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <span className="sr-only">{cardPositionLabel}</span>
      <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-1">
        <span
          aria-label={etaChipAria}
          className="pill gap-1 bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-foreground/80 shadow-soft normal-case"
        >
          <Clock3 className="h-3 w-3 text-blue" />
          {etaChipLabel}
        </span>
      </div>
    </article>
  );
};
