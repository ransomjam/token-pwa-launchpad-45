import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { ArrowUpRight, Clock, Eye, Heart } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import { formatTimeLeft, toggleWatchlist, isWatched } from '@/lib/auctionData';
import type { AuctionListing } from '@/types/auctions';

type AuctionCardProps = {
  auction: AuctionListing;
  onViewDetails: (auction: AuctionListing) => void;
  onViewSeller: (sellerId: string) => void;
  onPlaceBid: (auction: AuctionListing) => void;
};

export const AuctionCard = ({ auction, onViewDetails, onViewSeller, onPlaceBid }: AuctionCardProps) => {
  const { t, locale } = useI18n();
  const [watched, setWatched] = useState(() => isWatched(auction.id));
  const [timeLeft, setTimeLeft] = useState(auction.timeLeftSec);

  const currencyFormatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  });

  useEffect(() => {
    if (timeLeft <= 0) return;

    const interval = window.setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => window.clearInterval(interval);
  }, [timeLeft]);

  const handleToggleWatch = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    const newWatchedState = toggleWatchlist(auction.id);
    setWatched(newWatchedState);
    trackEvent('auction_watch_toggle', {
      auctionId: auction.id,
      watched: newWatchedState,
    });
  };

  const handlePlaceBid = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onPlaceBid(auction);
  };

  const handleViewDetails = () => {
    trackEvent('auction_view', { auctionId: auction.id });
    onViewDetails(auction);
  };

  const handleViewSeller = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    trackEvent('vendor_profile_view', { vendorId: auction.seller.id });
    onViewSeller(auction.seller.id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleViewDetails();
    }
  };

  const isEnding = timeLeft <= 3600;
  const hasEnded = timeLeft <= 0;
  const watchersLabel = t('auctions.watchersLabel', { count: auction.watchers });
  const laneLabel = auction.lane ? t('auctions.laneOnTime', { percent: Math.round(auction.lane.onTimePct * 100) }) : null;

  return (
    <article
      role="link"
      tabIndex={0}
      onClick={handleViewDetails}
      onKeyDown={handleKeyDown}
      className="group relative flex cursor-pointer flex-row items-stretch gap-4 overflow-hidden rounded-3xl border border-white/50 bg-white/75 p-4 shadow-soft backdrop-blur transition-all duration-200 hover:-translate-y-1 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-[1px] before:absolute before:inset-0 before:-z-10 before:rounded-[inherit] before:bg-gradient-to-br before:from-blue/20 before:via-transparent before:to-primary/20 before:opacity-0 before:transition-opacity before:content-[''] group-hover:before:opacity-100 sm:p-5 md:flex-col"
    >
      <div className="relative flex w-32 flex-shrink-0 flex-col gap-2 sm:w-36 md:w-full">
        <AspectRatio ratio={4 / 3} className="h-full overflow-hidden rounded-2xl bg-muted">
          <img
            src={auction.images[0] ?? '/placeholder.svg'}
            alt={auction.title}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute left-3 top-3">
            <Badge
              variant={hasEnded ? 'secondary' : isEnding ? 'destructive' : 'default'}
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold shadow-soft',
                hasEnded && 'bg-muted/80 text-muted-foreground',
                isEnding && 'bg-destructive/90 text-destructive-foreground animate-pulse',
                !hasEnded && !isEnding && 'bg-primary/90 text-primary-foreground',
              )}
            >
              <Clock className="h-3 w-3" />
              {formatTimeLeft(timeLeft)}
            </Badge>
          </div>
        </AspectRatio>
        <div className="space-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/70">
            {t('auctions.currentBid')}
          </span>
          <p className="text-sm font-semibold text-foreground sm:text-base">
            {currencyFormatter.format(auction.currentBidXAF)}
          </p>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 md:gap-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-foreground sm:text-base">
                {auction.title}
              </h3>
              <button
                type="button"
                onClick={handleViewSeller}
                className="inline-flex w-fit items-center gap-1.5 rounded-full border border-white/60 bg-white/80 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-sm transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:px-3 sm:py-1.5 sm:text-xs"
              >
                <span className="truncate">{t('auctions.sellerByline', { name: auction.seller.name })}</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {auction.seller.city && (
            <p className="text-xs text-muted-foreground/90 sm:text-sm">{auction.seller.city}</p>
          )}

          <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground/90 sm:gap-3 sm:text-xs">
            <span className="pill gap-1.5 border-white/60 bg-white/70 text-muted-foreground">
              <Eye className="h-3.5 w-3.5" />
              {watchersLabel}
            </span>
            <span className="pill gap-1.5 border-primary/30 bg-primary/15 text-primary">
              {t('auctions.minimumIncrement')}: {currencyFormatter.format(auction.minIncrementXAF)}
            </span>
            {laneLabel && <span className="pill gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-600">{laneLabel}</span>}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handlePlaceBid}
            disabled={hasEnded}
            className="h-11 flex-1 rounded-full text-sm font-semibold shadow-lux"
          >
            {hasEnded ? t('auctions.ended') : t('auctions.placeBid')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleToggleWatch}
            aria-label={watched ? t('auctions.removedFromWatchlist') : t('auctions.addedToWatchlist')}
            className={cn(
              'rounded-full border-white/70 bg-white/80 text-muted-foreground shadow-soft transition hover:text-destructive',
              watched && 'border-destructive/40 bg-destructive/10 text-destructive',
            )}
          >
            <Heart className={cn('h-4 w-4', watched && 'fill-current')} />
          </Button>
        </div>
      </div>
    </article>
  );
};
