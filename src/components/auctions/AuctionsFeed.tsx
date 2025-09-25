import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuctionCard } from './AuctionCard';
import { PlaceBidSheet } from './PlaceBidSheet';
import { AUCTION_LISTINGS, isDemoAuctionsSeed } from '@/lib/auctionData';
import { trackEvent } from '@/lib/analytics';
import type { AuctionListing } from '@/types/auctions';
import type { Session } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nContext';
import { AppNav } from '@/components/navigation/AppNav';
import { AccountSheet, LanguageToggle } from '@/components/shell/AccountControls';

type AuctionsFeedProps = {
  variant?: 'embedded' | 'page';
  session?: Session;
};

const PREVIEW_BADGE_VISIBLE = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

export const AuctionsFeed = ({ variant = 'embedded', session }: AuctionsFeedProps) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [selectedAuction, setSelectedAuction] = useState<AuctionListing | null>(null);

  const auctions = useMemo(() => (AUCTION_LISTINGS.length > 0 ? AUCTION_LISTINGS : []), []);
  const usingDemoData = useMemo(() => isDemoAuctionsSeed(auctions), [auctions]);

  const handleViewDetails = (auction: AuctionListing) => {
    navigate(`/auction/${auction.id}`);
  };

  const handleViewSeller = (sellerId: string) => {
    navigate(`/seller/${sellerId}`);
  };

  const handlePlaceBid = (auction: AuctionListing) => {
    setSelectedAuction(auction);
  };

  const handleCloseBidSheet = () => {
    setSelectedAuction(null);
  };

  // Track feed view
  const handleFeedView = () => {
    trackEvent('auction_feed_view', { count: AUCTION_LISTINGS.length });
  };

  return (
    <div className={variant === 'page' ? 'min-h-dvh bg-muted/20 pb-10' : ''}>
      {variant === 'page' && (
        <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-semibold tracking-tight text-foreground">{t('auctions.header')}</span>
                {PREVIEW_BADGE_VISIBLE && (
                  <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    {t('common.preview')}
                  </Badge>
                )}
              </div>
              <div className="ml-auto flex items-center gap-2 sm:gap-3">
                <LanguageToggle className="h-11 rounded-full border border-border/70 bg-white px-4 text-xs font-semibold uppercase text-muted-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary" />
                {session && <AccountSheet session={session} />}
              </div>
            </div>
            <AppNav className="justify-start" />
          </div>
        </header>
      )}

      <div className={`mx-auto w-full ${variant === 'page' ? 'max-w-5xl px-6 pt-6' : 'px-6 py-6'}`}>
        {usingDemoData && (
          <Badge variant="outline" className="mb-4 inline-flex items-center gap-1 rounded-full border-dashed border-border/70 bg-card/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {t('home.demoData')}
          </Badge>
        )}
        <div className="grid grid-cols-2 gap-4" onLoad={handleFeedView}>
          {auctions.map(auction => (
            <AuctionCard
              key={auction.id}
              auction={auction}
              onViewDetails={handleViewDetails}
              onViewSeller={handleViewSeller}
              onPlaceBid={handlePlaceBid}
            />
          ))}
        </div>
      </div>

      {selectedAuction && (
        <PlaceBidSheet auction={selectedAuction} open={true} onClose={handleCloseBidSheet} />
      )}
    </div>
  );
};