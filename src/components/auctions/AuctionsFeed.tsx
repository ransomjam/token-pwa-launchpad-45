import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuctionCard } from './AuctionCard';
import { PlaceBidSheet } from './PlaceBidSheet';
import { AUCTION_LISTINGS } from '@/lib/auctionData';
import { trackEvent } from '@/lib/analytics';
import type { AuctionListing } from '@/types/auctions';

export const AuctionsFeed = () => {
  const navigate = useNavigate();
  const [selectedAuction, setSelectedAuction] = useState<AuctionListing | null>(null);

  const handleViewDetails = (auction: AuctionListing) => {
    navigate(`/auctions/${auction.id}`);
  };

  const handleViewSeller = (sellerId: string) => {
    navigate(`/vendors/${sellerId}`);
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
    <div className="px-6 py-6">
      <div 
        className="grid grid-cols-2 gap-4"
        onLoad={handleFeedView}
      >
        {AUCTION_LISTINGS.map((auction) => (
          <AuctionCard
            key={auction.id}
            auction={auction}
            onViewDetails={handleViewDetails}
            onViewSeller={handleViewSeller}
            onPlaceBid={handlePlaceBid}
          />
        ))}
      </div>

      {selectedAuction && (
        <PlaceBidSheet
          auction={selectedAuction}
          open={true}
          onClose={handleCloseBidSheet}
        />
      )}
    </div>
  );
};