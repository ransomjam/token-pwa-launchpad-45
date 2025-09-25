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

export type AuctionWinJourneyStage = {
  id:
    | 'confirm_bid'
    | 'payment'
    | 'assign_centre'
    | 'seller_dropoff'
    | 'buyer_pickup'
    | 'release';
  title: string;
  status: 'complete' | 'current' | 'upcoming';
  stateLabel: string;
  occurredAtLabel?: string;
  description: string;
  highlights?: string[];
  meta?: Array<{
    label: string;
    value: string;
    tone?: 'default' | 'success' | 'warning';
  }>;
};

export type AuctionWinNotification = {
  id: string;
  audience: 'buyer' | 'seller' | 'centre' | 'admin';
  channel: 'push' | 'sms' | 'email';
  message: string;
  sentAtLabel: string;
};

export type AuctionWinSla = {
  id: string;
  label: string;
  dueLabel: string;
  status: 'on_track' | 'warning' | 'overdue';
  state: string;
};

export type AuctionWinPayment = {
  statusLabel: string;
  dueByLabel: string;
  hammerPriceXAF: number;
  buyerPremiumPct: number;
  buyerPremiumXAF: number;
  serviceFeeXAF: number;
  centreHandlingFeeXAF?: number;
  totalDueXAF: number;
  momoInstructions: string;
  reminderLabel: string;
};

export type AuctionWinLogistics = {
  centreName: string;
  centreAddress: string;
  centreHours: string;
  centreContact: string;
  dropoffDeadlineLabel: string;
  pickupDeadlineLabel: string;
  dropoffCode: string;
  pickupCode: string;
  pickupOtp: string;
  notes?: string[];
};

export type AuctionWin = {
  id: string;
  auctionId: string;
  finalBidXAF: number;
  status: 'pending_payment' | 'paid' | 'completed';
  wonAt: string;
  payment?: AuctionWinPayment;
  journey?: AuctionWinJourneyStage[];
  logistics?: AuctionWinLogistics;
  notifications?: AuctionWinNotification[];
  slas?: AuctionWinSla[];
  policyNotes?: string[];
};
