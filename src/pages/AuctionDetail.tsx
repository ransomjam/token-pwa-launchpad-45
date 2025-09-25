import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Share2, Eye, Clock, ShieldCheck, Heart, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/components/ui/use-toast';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { 
  getAuctionById, 
  formatTimeLeft, 
  toggleWatchlist, 
  isWatched 
} from '@/lib/auctionData';
import { PlaceBidSheet } from '@/components/auctions/PlaceBidSheet';
import ShareSheet from '@/components/share/ShareSheet';
import { ensureAbsoluteUrl, type ListingShareContent } from '@/lib/share';
import type { AuctionListing } from '@/types/auctions';

const AuctionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { toast } = useToast();
  
  const [auction, setAuction] = useState<AuctionListing | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [watched, setWatched] = useState(false);
  const [showBidSheet, setShowBidSheet] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const shareContent = useMemo<ListingShareContent | null>(() => {
    if (!auction) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const absoluteOrigin = ensureAbsoluteUrl(origin);
    const trimmedOrigin = absoluteOrigin.endsWith('/') ? absoluteOrigin.slice(0, -1) : absoluteOrigin;

    return {
      id: auction.id,
      title: auction.title,
      priceXAF: auction.currentBidXAF,
      etaMin: 7,
      etaMax: 14,
      laneCode: auction.lane?.code || 'GZ-DLA-AIR',
      onTimePct: (auction.lane?.onTimePct ?? 0.9) * 100,
      committed: auction.currentBidXAF,
      target: auction.currentBidXAF + auction.minIncrementXAF,
      image: auction.images[0] ?? '/placeholder.svg',
      shareUrls: {
        short: `${trimmedOrigin}/a/${auction.id}`,
        long: `${trimmedOrigin}/auction/${auction.id}`,
      },
      isDemo: true,
    };
  }, [auction]);

  const currencyFormatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  });

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const auctionData = getAuctionById(id);
    if (!auctionData) {
      navigate('/');
      return;
    }

    setAuction(auctionData);
    setTimeLeft(auctionData.timeLeftSec);
    setWatched(isWatched(id));
    
    trackEvent('auction_view', { auctionId: id });
  }, [id, navigate]);

  // Update countdown every second
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const interval = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLeft]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleToggleWatch = () => {
    if (!auction) return;
    const newWatchedState = toggleWatchlist(auction.id);
    setWatched(newWatchedState);
    trackEvent('auction_watch_toggle', { 
      auctionId: auction.id, 
      watched: newWatchedState 
    });

    toast({
      title: newWatchedState ? t('auctions.addedToWatchlist') : t('auctions.removedFromWatchlist'),
      description: newWatchedState ? t('auctions.watchlistAdded') : t('auctions.watchlistRemoved'),
    });
  };

  const handlePlaceBid = () => {
    setShowBidSheet(true);
  };

  const handleShare = () => {
    trackEvent('auction_share', { auctionId: auction?.id });
    setShowShareSheet(true);
  };

  const handleViewSeller = () => {
    if (!auction) return;
    trackEvent('vendor_profile_view', { vendorId: auction.seller.id });
    navigate(`/seller/${auction.seller.id}`);
  };

  if (!auction) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-lg">
          <Skeleton className="h-80 w-full" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-12 w-full" />
          </div>
        </div>
      </div>
    );
  }

  const isEnding = timeLeft <= 3600; // Less than 1 hour
  const hasEnded = timeLeft <= 0;
  const timeDisplay = hasEnded ? t('auctions.ended') : formatTimeLeft(timeLeft, locale);
  const minBid = auction.currentBidXAF + auction.minIncrementXAF;
  const watchersLabel = t('auctions.watchersLabel', { count: auction.watchers });

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-background/95 backdrop-blur-sm px-6 py-4 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-10 w-10 rounded-full p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleShare}
              className="h-10 w-10 rounded-full p-0"
            >
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Image Gallery */}
        <div className="relative aspect-square bg-muted">
          <img
            src={auction.images[currentImageIndex] ?? '/placeholder.svg'}
            alt={auction.title}
            className="h-full w-full object-cover"
          />

          {/* Image indicators */}
          {auction.images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
              {auction.images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={cn(
                    "h-2 w-2 rounded-full transition-colors",
                    index === currentImageIndex ? "bg-white" : "bg-white/50"
                  )}
                />
              ))}
            </div>
          )}
        </div>

        {/* Time left */}
        <div className="px-6 pt-4 flex justify-center">
          <Badge
            variant={hasEnded ? "secondary" : isEnding ? "destructive" : "default"}
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-semibold",
              hasEnded && "bg-muted/80 text-muted-foreground",
              isEnding && "bg-destructive/90 text-destructive-foreground animate-pulse",
              !hasEnded && !isEnding && "bg-primary/90 text-primary-foreground"
            )}
          >
            <Clock className="h-4 w-4" />
            {timeDisplay}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Title and bid info */}
          <div className="space-y-3">
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {auction.title}
            </h1>
            
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">
                  {t('auctions.minimumBid')}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {currencyFormatter.format(minBid)}
                </p>
              </div>
              <div className="space-y-1 text-right">
                <p className="text-sm text-muted-foreground">
                  {t('auctions.currentBid')}
                </p>
                <p className="text-2xl font-bold text-primary">
                  {currencyFormatter.format(auction.currentBidXAF)}
                </p>
              </div>
            </div>
          </div>

          {/* Seller info */}
          <button
            onClick={handleViewSeller}
            className="flex items-center justify-between w-full rounded-2xl border border-border/70 bg-card p-4 text-left transition-colors hover:border-primary/40"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                <span className="text-sm font-semibold text-blue-600">
                  {auction.seller.name.charAt(0)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">
                    {auction.seller.name}
                  </span>
                  {auction.seller.verified && (
                    <Badge variant="secondary" className="h-5 w-5 rounded-full p-0">
                      <span className="text-xs">✓</span>
                    </Badge>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
                  {auction.seller.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {auction.seller.city}
                    </span>
                  )}
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Eye className="h-4 w-4" />
                    {watchersLabel}
                  </span>
                </div>
              </div>
            </div>
            <ArrowLeft className="h-4 w-4 rotate-180 text-muted-foreground" />
          </button>

          {/* Trust line */}
          <div className="flex items-center gap-3 rounded-2xl bg-primary/5 p-4">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="font-medium text-primary">
              {t('auctions.escrowProtection')}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handlePlaceBid}
              disabled={hasEnded}
              className="flex-1 rounded-2xl py-3 text-base font-semibold"
            >
              {hasEnded ? t('auctions.ended') : t('auctions.placeBid')}
            </Button>
            
            <Button
              variant="outline"
              onClick={handleToggleWatch}
              className={cn(
                "h-12 w-12 rounded-2xl p-0",
                watched && "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/20"
              )}
            >
              <Heart className={cn("h-5 w-5", watched && "fill-current")} />
            </Button>
          </div>
        </div>

        {/* Sheets */}
        {showBidSheet && (
          <PlaceBidSheet
            auction={auction}
            open={showBidSheet}
            onClose={() => setShowBidSheet(false)}
          />
        )}

        <ShareSheet
          open={showShareSheet}
          onOpenChange={setShowShareSheet}
          context="listing"
          data={shareContent}
        />
      </div>
    </div>
  );
};

export default AuctionDetail;