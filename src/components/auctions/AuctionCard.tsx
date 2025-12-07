import { useEffect, useState, type KeyboardEvent, type MouseEvent } from 'react';
import { ArrowUpRight, Clock, Eye, MapPin, Share2, Users } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import { formatTimeLeft } from '@/lib/auctionData';
import type { AuctionListing } from '@/types/auctions';
import { useToast } from '@/components/ui/use-toast';
import { normalizeAuction, shareContent } from '@/lib/unifiedShare';
import ShareFallbackDialog from '@/components/posts/ShareFallbackDialog';

type AuctionCardProps = {
  auction: AuctionListing;
  onViewDetails: (auction: AuctionListing) => void;
  onViewSeller: (sellerId: string) => void;
  onPlaceBid: (auction: AuctionListing) => void;
};

export const AuctionCard = ({ auction, onViewDetails, onViewSeller, onPlaceBid }: AuctionCardProps) => {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [timeLeft, setTimeLeft] = useState(auction.timeLeftSec);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);
  const [fallbackCaption, setFallbackCaption] = useState('');
  const [sharing, setSharing] = useState(false);

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

  const handlePlaceBid = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onPlaceBid(auction);
  };

  const handleQuickView = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    handleViewDetails();
  };

  const handleShare = async (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    trackEvent('auction_share', { auctionId: auction.id });
    setSharing(true);

    const content = normalizeAuction(auction);

    await shareContent(content, {
      onSuccess: () => {
        toast({ description: t('auctions.shareCopied') });
        setSharing(false);
      },
      onError: (error) => {
        toast({ description: error, variant: 'destructive' });
        setSharing(false);
      },
      onFallback: (blobUrl, caption) => {
        if (fallbackImageUrl) {
          URL.revokeObjectURL(fallbackImageUrl);
        }
        setFallbackImageUrl(blobUrl);
        setFallbackCaption(caption);
        setFallbackOpen(true);
        setSharing(false);
      },
    });
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
  const timeRemainingLabel = hasEnded ? t('auctions.ended') : formatTimeLeft(timeLeft, locale);
  const watchersLabel = t('auctions.watchersLabel', { count: auction.watchers });
  const startingBidXAF = Math.max(0, auction.currentBidXAF - auction.minIncrementXAF);
  const halfTitleLength = Math.ceil(auction.title.length / 2);
  const displayedTitle = auction.title.slice(0, halfTitleLength);
  const truncatedTitle =
    displayedTitle.length < auction.title.length ? `${displayedTitle}\u2026` : auction.title;

  const timeBadge = (
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
      {timeRemainingLabel}
    </Badge>
  );

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
        </AspectRatio>
        <div className="space-y-2">
          <div className="space-y-1">
            {timeBadge}
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-muted-foreground shadow-soft sm:text-xs">
              <Users className="h-3 w-3 text-muted-foreground/70" />
              <span className="text-muted-foreground/80">{watchersLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-3 md:gap-4">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-col gap-1.5">
              <h3 className="truncate text-sm font-semibold leading-snug text-foreground sm:text-base">
                {truncatedTitle}
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

          <div className="space-y-2">
            {auction.seller.city && (
              <p className="flex items-center gap-1 text-xs text-muted-foreground/90 sm:text-sm">
                <MapPin className="h-3.5 w-3.5" />
                {auction.seller.city}
              </p>
            )}
            <div className="flex items-center gap-3 rounded-full bg-white/70 px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="whitespace-nowrap text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/80">
                  Start
                </span>
                <p className="inline-flex items-center justify-center rounded-full bg-blue/10 px-2 py-1 text-xs font-semibold text-blue">
                  {currencyFormatter.format(startingBidXAF)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleQuickView}
            aria-label={t('auctions.viewAria', { title: auction.title })}
            className="h-9 w-9 rounded-full border border-white/60 bg-white/80 p-0 text-blue shadow-soft transition-colors hover:border-primary/40 hover:text-blue"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleShare}
            aria-label={t('auctions.shareAria', { title: auction.title })}
            className="h-9 w-9 rounded-full border border-blue/40 bg-blue/10 p-0 text-blue shadow-soft transition-colors hover:border-blue/60 hover:bg-blue/15 hover:text-blue"
          >
            <Share2 className="h-4 w-4" />
          </Button>
          <Button
            onClick={handlePlaceBid}
            disabled={hasEnded}
            className="h-9 flex-none rounded-full px-4 text-sm font-semibold shadow-lux"
          >
            {hasEnded ? t('auctions.ended') : t('auctions.placeBid')}
          </Button>
        </div>
      </div>

      <ShareFallbackDialog
        open={fallbackOpen}
        onOpenChange={(open) => {
          setFallbackOpen(open);
          if (!open && fallbackImageUrl) {
            URL.revokeObjectURL(fallbackImageUrl);
            setFallbackImageUrl(null);
          }
        }}
        imageUrl={fallbackImageUrl}
        caption={fallbackCaption}
      />
    </article>
  );
};
