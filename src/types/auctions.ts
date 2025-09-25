export type AuctionListing = {
  id: string;
  title: string;
  images: string[];
  currentBidXAF: number;
  minIncrementXAF: number;
  timeLeftSec: number;
  watchers: number;
  seller: {
    id: string;
    name: string;
    verified: boolean;
    city?: string;
  };
  lane?: {
    code: string;
    onTimePct: number;
  };
  category: string;
  createdAt: string;
};

export type BidRecord = {
  id: string;
  auctionId: string;
  yourBidXAF: number;
  highestBidXAF: number;
  timeLeftSec: number;
  createdAt: string;
};

export type WatchlistItem = {
  auctionId: string;
  addedAt: string;
};

export type AuctionWin = {
  id: string;
  auctionId: string;
  finalBidXAF: number;
  status: 'pending_payment' | 'paid' | 'completed';
  wonAt: string;
};