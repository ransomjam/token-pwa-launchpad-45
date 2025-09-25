import type { AuctionListing, BidRecord, WatchlistItem, AuctionWin } from '@/types/auctions';

const FALLBACK_BIDS: BidRecord[] = [
  {
    id: 'bid_demo_001',
    auctionId: 'auct_001',
    yourBidXAF: 850000,
    highestBidXAF: 875000,
    timeLeftSec: 3600 * 8,
    createdAt: '2025-09-24T12:30:00Z'
  }
];

const FALLBACK_WATCHLIST: WatchlistItem[] = [
  {
    auctionId: 'auct_002',
    addedAt: '2025-09-23T14:20:00Z'
  },
  {
    auctionId: 'auct_003',
    addedAt: '2025-09-24T09:15:00Z'
  }
];

const FALLBACK_WINS: AuctionWin[] = [
  {
    id: 'win_demo_001',
    auctionId: 'auct_004',
    finalBidXAF: 415000,
    status: 'pending_payment',
    wonAt: '2025-09-20T10:45:00Z',
    payment: {
      statusLabel: 'AWAITING_PAYMENT → escrow funding',
      dueByLabel: 'Pay within 24h • due Sep 21, 2025 10:45',
      hammerPriceXAF: 415000,
      buyerPremiumPct: 10,
      buyerPremiumXAF: 41500,
      serviceFeeXAF: 12500,
      centreHandlingFeeXAF: 7500,
      totalDueXAF: 476000,
      momoInstructions: 'Dial *126*14*653151930*476000# to fund escrow via MoMo.',
      reminderLabel: 'Escrow auto-cancels if unpaid in 24h (NO_PAY state).',
    },
    journey: [
      {
        id: 'confirm_bid',
        title: 'Confirm bid & close auction',
        status: 'complete',
        stateLabel: 'WON → Awaiting payment',
        occurredAtLabel: 'Sep 20, 2025 • 10:45',
        description:
          'Server validated the minimum increment and anti-snipe logic before locking in the winning bid with reserve met.',
        highlights: [
          'Bid increment respected: +25 000 XAF over previous high bid.',
          'Anti-snipe: timer extended +60s (final close at 10:45).',
          'Bidder identity verified (not seller).',
        ],
        meta: [
          { label: 'Min increment', value: '2 000 XAF' },
          { label: 'Anti-snipe', value: '+60s under last 60s' },
        ],
      },
      {
        id: 'payment',
        title: 'Buyer funds escrow',
        status: 'current',
        stateLabel: 'AWAITING_PAYMENT',
        occurredAtLabel: 'Due Sep 21, 2025 • 10:45',
        description:
          'Checkout totals hammer + buyer premium + service + centre handling fee before releasing the next workflow.',
        highlights: [
          'MoMo USSD: *126*14*653151930*476000#',
          'Payment hold releases logistics assignment.',
        ],
        meta: [
          { label: 'Escrow status', value: 'Awaiting payment', tone: 'warning' },
          { label: 'Penalty', value: 'NO_PAY if unpaid in 24h', tone: 'warning' },
        ],
      },
      {
        id: 'assign_centre',
        title: 'Assign logistics centre',
        status: 'upcoming',
        stateLabel: 'ESCROW_FUNDED → AWAITING_DROPOFF',
        description:
          'System selects the nearest centre and generates QR codes for seller drop-off and buyer pickup once escrow is funded.',
        highlights: [
          'Drop-off code for seller with QR + alphanumeric.',
          'Pickup QR + 6-digit OTP for buyer.',
          'Centre address, hours, and deadlines shared instantly.',
        ],
        meta: [{ label: 'SLA', value: 'Seller drop-off within 48h' }],
      },
      {
        id: 'seller_dropoff',
        title: 'Seller drop-off & intake',
        status: 'upcoming',
        stateLabel: 'AT_CENTRE_INTAKE',
        description:
          'Centre staff scans the drop-off code, captures condition photos/video, and shelves the item with a printed label.',
        highlights: [
          'Condition documented for dispute protection.',
          'Auto reminders fire if seller is late.',
        ],
        meta: [{ label: 'Reminder', value: 'Auto nudges if late', tone: 'warning' }],
      },
      {
        id: 'buyer_pickup',
        title: 'Buyer pickup & inspection',
        status: 'upcoming',
        stateLabel: 'READY_FOR_PICKUP',
        description:
          'Buyer presents pickup QR/OTP plus ID, inspects on-site for 10–15 minutes before accepting or opening a dispute.',
        highlights: [
          'Accept → immediate payout to seller.',
          'Reject → dispute opened at centre with photos.',
        ],
        meta: [{ label: 'Free pickup window', value: '5 days' }],
      },
      {
        id: 'release',
        title: 'Release or dispute resolution',
        status: 'upcoming',
        stateLabel: 'RELEASED / DISPUTE_AT_CENTRE',
        description:
          'Centre staff logs the handover. Escrow pays out on handover confirmation or routes to admin for dispute handling.',
        highlights: [
          'Admin dashboard handles disputes & overdue items.',
          'Auto-return on day 12 if unclaimed (refund minus fees).',
        ],
        meta: [{ label: 'Payout trigger', value: 'centre_pickup_verified', tone: 'success' }],
      },
    ],
    logistics: {
      centreName: 'Bonapriso Urban Centre',
      centreAddress: 'Avenue de Gaulle, Douala',
      centreHours: 'Mon – Sat • 08:00 – 20:00',
      centreContact: '+237 680 000 111',
      dropoffDeadlineLabel: 'Drop-off within 48h • due Sep 23, 2025 10:45',
      pickupDeadlineLabel: 'Pickup within 5 days • due Sep 28, 2025 10:45',
      dropoffCode: 'DROP-7KD4-Q982',
      pickupCode: 'PICK-91XA-204',
      pickupOtp: '736419',
      notes: [
        'Staff scans QR, captures intake photos/video, notes bin location.',
        'Storage fee applies after day 5; auto-return to seller on day 12.',
      ],
    },
    notifications: [
      {
        id: 'notif_win_buyer',
        audience: 'buyer',
        channel: 'push',
        message: 'You won—pay within 24h to keep it.',
        sentAtLabel: 'Sent Sep 20, 2025 • 10:46',
      },
      {
        id: 'notif_win_seller',
        audience: 'seller',
        channel: 'sms',
        message: 'You have a winner. Deliver to centre after payment.',
        sentAtLabel: 'Scheduled for ESCROW_FUNDED',
      },
      {
        id: 'notif_win_centre',
        audience: 'centre',
        channel: 'email',
        message: 'Heads-up: Samsung 65" QLED arriving once escrow funded.',
        sentAtLabel: 'Auto-send on ESCROW_FUNDED',
      },
    ],
    slas: [
      {
        id: 'sla_payment',
        label: 'Escrow payment window',
        dueLabel: '24h from win • due Sep 21, 2025 10:45',
        status: 'on_track',
        state: 'AWAITING_PAYMENT',
      },
      {
        id: 'sla_dropoff',
        label: 'Seller drop-off',
        dueLabel: '48h after escrow funded',
        status: 'warning',
        state: 'AWAITING_DROPOFF',
      },
      {
        id: 'sla_pickup',
        label: 'Buyer pickup window',
        dueLabel: '5 days after ready notification',
        status: 'on_track',
        state: 'READY_FOR_PICKUP',
      },
      {
        id: 'sla_return',
        label: 'Auto-return threshold',
        dueLabel: 'Day 12 → return to seller, refund minus fees',
        status: 'on_track',
        state: 'UNCLAIMED_RETURN',
      },
    ],
    policyNotes: [
      'Anti-snipe rule added +60s because the confirm bid landed with 45s remaining.',
      'Escrow payout fires only when centre staff marks Pickup Verified.',
      'Disputes at centre require photos and staff notes before admin decision.',
    ],
  },
];

// Demo auction listings
export const AUCTION_LISTINGS: AuctionListing[] = [
  {
    id: 'auct_001',
    title: 'iPhone 15 Pro Max 256GB (Natural Titanium)',
    images: ['/demo/download-2.jfif', '/demo/download-3.jfif'],
    currentBidXAF: 875000,
    minIncrementXAF: 25000,
    timeLeftSec: 3600 * 8, // 8 hours
    watchers: 24,
    seller: {
      id: 'usr_imp_1',
      name: 'TechHub Pro Imports',
      verified: true,
      city: 'Douala'
    },
    lane: {
      code: 'GZ-DLA-AIR',
      onTimePct: 0.93
    },
    category: 'Electronics',
    createdAt: '2025-09-23T10:00:00Z'
  },
  {
    id: 'auct_002',
    title: 'MacBook Air M3 13" (Midnight, 16GB RAM)',
    images: ['/demo/download-4.jfif', '/demo/download-5.jfif'],
    currentBidXAF: 1250000,
    minIncrementXAF: 50000,
    timeLeftSec: 3600 * 16, // 16 hours
    watchers: 18,
    seller: {
      id: 'usr_imp_2',
      name: 'Digital Imports CM',
      verified: true,
      city: 'Yaoundé'
    },
    lane: {
      code: 'HKG-DLA-AIR',
      onTimePct: 0.88
    },
    category: 'Electronics',
    createdAt: '2025-09-22T14:30:00Z'
  },
  {
    id: 'auct_003',
    title: 'Sony WH-1000XM5 Wireless Headphones',
    images: ['/demo/wireless-lavalier-kit.jfif'],
    currentBidXAF: 195000,
    minIncrementXAF: 10000,
    timeLeftSec: 3600 * 4, // 4 hours
    watchers: 12,
    seller: {
      id: 'usr_imp_3',
      name: 'AudioMax Traders',
      verified: false,
      city: 'Douala'
    },
    lane: {
      code: 'GZ-DLA-SEA',
      onTimePct: 0.78
    },
    category: 'Audio',
    createdAt: '2025-09-24T08:15:00Z'
  },
  {
    id: 'auct_004',
    title: 'Samsung 65" QLED 4K Smart TV',
    images: ['/demo/td-systems-32in-smart-tv.jfif'],
    currentBidXAF: 425000,
    minIncrementXAF: 15000,
    timeLeftSec: 3600 * 24, // 24 hours
    watchers: 31,
    seller: {
      id: 'usr_imp_1',
      name: 'TechHub Pro Imports',
      verified: true,
      city: 'Douala'
    },
    lane: {
      code: 'GZ-DLA-AIR',
      onTimePct: 0.93
    },
    category: 'Home & Living',
    createdAt: '2025-09-21T16:45:00Z'
  }
];

// Local storage keys
const BIDS_KEY = 'pl.auctionBids';
const WATCHLIST_KEY = 'pl.auctionWatchlist';
const WINS_KEY = 'pl.auctionWins';

// Demo data getters with localStorage fallback
const parseStored = <T,>(key: string): { data: T | null; hasValue: boolean } => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return { data: null, hasValue: false };
    }
    return { data: JSON.parse(raw) as T, hasValue: true };
  } catch (error) {
    console.warn(`Failed to read ${key} from localStorage:`, error);
    return { data: null, hasValue: false };
  }
};

export const loadBids = (): BidRecord[] => {
  const { data } = parseStored<BidRecord[]>(BIDS_KEY);
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }
  return FALLBACK_BIDS;
};

export const loadWatchlist = (): WatchlistItem[] => {
  const { data } = parseStored<WatchlistItem[]>(WATCHLIST_KEY);
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }
  return FALLBACK_WATCHLIST;
};

export const loadWins = (): AuctionWin[] => {
  const { data } = parseStored<AuctionWin[]>(WINS_KEY);
  if (Array.isArray(data) && data.length > 0) {
    return data;
  }
  return FALLBACK_WINS;
};

// Setters
export const saveBids = (bids: BidRecord[]): void => {
  try {
    localStorage.setItem(BIDS_KEY, JSON.stringify(bids));
  } catch (error) {
    console.warn('Failed to save bids to localStorage:', error);
  }
};

export const saveWatchlist = (watchlist: WatchlistItem[]): void => {
  try {
    localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
  } catch (error) {
    console.warn('Failed to save watchlist to localStorage:', error);
  }
};

export const saveWins = (wins: AuctionWin[]): void => {
  try {
    localStorage.setItem(WINS_KEY, JSON.stringify(wins));
  } catch (error) {
    console.warn('Failed to save wins to localStorage:', error);
  }
};

const isDemoSeed = (key: string): boolean => {
  const { data, hasValue } = parseStored<unknown[]>(key);
  if (!hasValue) return true;
  return !Array.isArray(data) || data.length === 0;
};

export const isDemoBidsSeed = (): boolean => isDemoSeed(BIDS_KEY);

export const isDemoWatchlistSeed = (): boolean => isDemoSeed(WATCHLIST_KEY);

export const isDemoWinsSeed = (): boolean => isDemoSeed(WINS_KEY);

export const isDemoAuctionsSeed = (auctions: AuctionListing[]): boolean => auctions === AUCTION_LISTINGS || auctions.length === 0;

// Helper functions
export const getAuctionById = (id: string): AuctionListing | undefined => {
  return AUCTION_LISTINGS.find(auction => auction.id === id);
};

export const addBid = (auctionId: string, bidAmount: number): void => {
  const bids = loadBids();
  const auction = getAuctionById(auctionId);
  if (!auction) return;

  const existingBidIndex = bids.findIndex(bid => bid.auctionId === auctionId);
  const newBid: BidRecord = {
    id: `bid_${Date.now()}`,
    auctionId,
    yourBidXAF: bidAmount,
    highestBidXAF: Math.max(bidAmount, auction.currentBidXAF),
    timeLeftSec: auction.timeLeftSec,
    createdAt: new Date().toISOString()
  };

  if (existingBidIndex >= 0) {
    bids[existingBidIndex] = newBid;
  } else {
    bids.push(newBid);
  }

  // Update auction current bid in demo
  auction.currentBidXAF = newBid.highestBidXAF;
  
  saveBids(bids);
};

export const toggleWatchlist = (auctionId: string): boolean => {
  const watchlist = loadWatchlist();
  const existingIndex = watchlist.findIndex(item => item.auctionId === auctionId);
  
  if (existingIndex >= 0) {
    // Remove from watchlist
    watchlist.splice(existingIndex, 1);
    saveWatchlist(watchlist);
    return false;
  } else {
    // Add to watchlist
    watchlist.push({
      auctionId,
      addedAt: new Date().toISOString()
    });
    saveWatchlist(watchlist);
    return true;
  }
};

export const isWatched = (auctionId: string): boolean => {
  const watchlist = loadWatchlist();
  return watchlist.some(item => item.auctionId === auctionId);
};

export const addWin = (auctionId: string, finalBid: number): void => {
  const wins = loadWins();
  const newWin: AuctionWin = {
    id: `win_${Date.now()}`,
    auctionId,
    finalBidXAF: finalBid,
    status: 'pending_payment',
    wonAt: new Date().toISOString()
  };
  
  wins.push(newWin);
  saveWins(wins);
};

export const updateWinStatus = (winId: string, status: AuctionWin['status']): void => {
  const wins = loadWins();
  const winIndex = wins.findIndex(win => win.id === winId);
  
  if (winIndex >= 0) {
    wins[winIndex].status = status;
    saveWins(wins);
  }
};

export const formatTimeLeft = (seconds: number, locale: 'en' | 'fr' = 'en'): string => {
  if (seconds <= 0) {
    return locale === 'fr' ? 'Terminé' : 'Ended';
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  const formatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US');

  const suffixes = {
    hour: locale === 'fr' ? '\u202Fh' : 'h',
    minute: locale === 'fr' ? '\u202Fmin' : 'm',
    second: locale === 'fr' ? '\u202Fs' : 's',
  } as const;

  const formatPart = (value: number, unit: keyof typeof suffixes) =>
    `${formatter.format(value)}${suffixes[unit]}`;

  if (hours > 0) {
    const parts = [
      formatPart(hours, 'hour'),
      formatPart(minutes, 'minute'),
      formatPart(remainingSeconds, 'second'),
    ];

    return parts.join(' ');
  }

  if (minutes > 0) {
    return [formatPart(minutes, 'minute'), formatPart(remainingSeconds, 'second')].join(' ');
  }

  return formatPart(remainingSeconds, 'second');
};