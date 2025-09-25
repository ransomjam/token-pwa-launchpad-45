import { useState, useEffect } from 'react';
import { Heart, Eye, Clock } from 'lucide-react';
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

  // Update countdown every second
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleToggleWatch = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newWatchedState = toggleWatchlist(auction.id);
    setWatched(newWatchedState);
    trackEvent('auction_watch_toggle', { 
      auctionId: auction.id, 
      watched: newWatchedState 
    });
  };

  const handlePlaceBid = (e: React.MouseEvent) => {
    e.stopPropagation();
    onPlaceBid(auction);
  };

  const handleViewDetails = () => {
    trackEvent('auction_view', { auctionId: auction.id });
    onViewDetails(auction);
  };

  const handleViewSeller = (e: React.MouseEvent) => {
    e.stopPropagation();
    trackEvent('vendor_profile_view', { vendorId: auction.seller.id });
    onViewSeller(auction.seller.id);
  };

  const isEnding = timeLeft <= 3600; // Less than 1 hour
  const hasEnded = timeLeft <= 0;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-soft transition-all hover:-translate-y-1 hover:shadow-card">
      <div className="relative aspect-[4/3] cursor-pointer" onClick={handleViewDetails}>
        <img
          src={auction.images[0] ?? '/placeholder.svg'}
          alt={auction.title}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
        
        {/* Time left chip */}
        <div className="absolute left-3 top-3">
          <Badge 
            variant={hasEnded ? "secondary" : isEnding ? "destructive" : "default"}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold",
              hasEnded && "bg-muted/80 text-muted-foreground",
              isEnding && "bg-destructive/90 text-destructive-foreground animate-pulse",
              !hasEnded && !isEnding && "bg-primary/90 text-primary-foreground"
            )}
          >
            <Clock className="h-3 w-3" />
            {formatTimeLeft(timeLeft)}
          </Badge>
        </div>

        {/* Watchers count */}
        <div className="absolute right-3 top-3">
          <Badge variant="secondary" className="inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white">
            <Eye className="h-3 w-3" />
            {auction.watchers}
          </Badge>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {/* Title and current bid */}
        <div className="cursor-pointer" onClick={handleViewDetails}>
          <h3 className="font-semibold text-foreground line-clamp-2 text-sm leading-5">
            {auction.title}
          </h3>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {currencyFormatter.format(auction.currentBidXAF)}
            </span>
            <span className="text-xs text-muted-foreground">
              {t('auctions.currentBid')}
            </span>
          </div>
        </div>

        {/* Seller info */}
        <button
          onClick={handleViewSeller}
          className="flex items-center gap-2 rounded-lg px-2 py-1 text-left transition-colors hover:bg-muted/50"
        >
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xs font-semibold text-primary">
              {auction.seller.name.charAt(0)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-xs font-medium text-foreground truncate max-w-24">
              {auction.seller.name}
            </span>
            {auction.seller.verified && (
              <Badge variant="secondary" className="h-4 w-4 rounded-full p-0">
                <span className="text-[10px]">✓</span>
              </Badge>
            )}
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handlePlaceBid}
            disabled={hasEnded}
            className="flex-1 h-8 rounded-full text-xs font-semibold"
          >
            {hasEnded ? t('auctions.ended') : t('auctions.placeBid')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleToggleWatch}
            className={cn(
              "h-8 w-8 rounded-full p-0",
              watched && "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", watched && "fill-current")} />
          </Button>
        </div>
      </div>
    </div>
  );
};