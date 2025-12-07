import type { AuctionListing, BidRecord, WatchlistItem, AuctionWin, AuctionWinCheckout } from '@/types/auctions';

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

const SHARED_WIN_HUBS: AuctionWinCheckout['hubs'] = [
  {
    id: 'hub_bonapriso',
    label: 'Bonapriso Urban Hub',
    address: 'Avenue de Gaulle',
    city: 'Douala',
    hours: '08:00 – 20:00',
    etaLabel: 'Ready in 2–3 days',
  },
  {
    id: 'hub_akwa',
    label: 'Akwa City Locker',
    address: 'Rue du Prince Bell',
    city: 'Douala',
    hours: '09:00 – 19:00',
    etaLabel: 'Ready in 3–4 days',
  },
  {
    id: 'hub_bastos',
    label: 'Bastos Pickup Lounge',
    address: 'Rue 1792 Bastos',
    city: 'Yaoundé',
    hours: '09:00 – 18:00',
    etaLabel: 'Ready in 4–5 days',
  },
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
    checkout: {
      sellerName: 'Beauty Hub CM',
      buyerName: 'A. Kamga',
      buyerContactMasked: '+237 6••• ••45',
      pickupWindowLabel: 'Ready 24–48h after drop-off',
      totalDueXAF: 476000,
      hubs: SHARED_WIN_HUBS,
      lastHubId: 'hub_bonapriso',
    },
  },
  {
    id: 'win_demo_002',
    auctionId: 'auct_003',
    finalBidXAF: 205000,
    status: 'paid_pickup_pending',
    wonAt: '2025-09-18T18:20:00Z',
    payment: {
      statusLabel: 'ESCROW_FUNDED → pickup pending',
      dueByLabel: 'Paid Sep 18, 2025 18:29',
      hammerPriceXAF: 205000,
      buyerPremiumPct: 8,
      buyerPremiumXAF: 16400,
      serviceFeeXAF: 9500,
      centreHandlingFeeXAF: 4000,
      totalDueXAF: 234900,
      momoInstructions: 'Dial *126*14*653151930*234900# to fund escrow via MoMo.',
      reminderLabel: 'Pickup hub assignment pending selection.',
    },
    checkout: {
      sellerName: 'Home Essentials',
      buyerName: 'A. Kamga',
      buyerContactMasked: '+237 6••• ••45',
      buyerEmailMasked: 'akamga•••@mail.com',
      sellerContactMasked: '+237 6••• ••21',
      pickupWindowLabel: 'Collection ready 1–2 days after drop-off',
      totalDueXAF: 234900,
      hubs: SHARED_WIN_HUBS,
      orderId: 'ORD-20250918-7XKQ',
      invoiceNo: 'INV-20250918-7XKQ',
      qrCodeValue: 'ORD-20250918-7XKQ',
      lastHubId: 'hub_akwa',
      invoiceGeneratedAt: '2025-09-18T18:35:00Z',
      paidAt: '2025-09-18T18:29:00Z',
      pickupSelectedAt: '2025-09-18T18:44:00Z',
      pickupCode: '7421',
    },
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
      id: 'creator-techplus',
      name: 'TechPlus Import',
      verified: true,
      city: 'Yaoundé'
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
      id: 'creator-nelly',
      name: 'Nelly Stores',
      verified: true,
      city: 'Douala'
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
      id: 'creator-home',
      name: 'Home Essentials',
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
      id: 'creator-beauty',
      name: 'Beauty Hub CM',
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

export const WINS_UPDATED_EVENT = 'pl:winsUpdated';

const dispatchWinsUpdated = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(WINS_UPDATED_EVENT));
};

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
    dispatchWinsUpdated();
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

const cloneWin = (win: AuctionWin): AuctionWin => ({
  ...win,
  payment: win.payment ? { ...win.payment } : undefined,
  checkout: win.checkout
    ? { ...win.checkout, hubs: [...win.checkout.hubs] }
    : undefined,
  journey: win.journey
    ? win.journey.map(stage => ({
        ...stage,
        highlights: stage.highlights ? [...stage.highlights] : undefined,
        meta: stage.meta ? stage.meta.map(item => ({ ...item })) : undefined,
      }))
    : undefined,
  logistics: win.logistics
    ? {
        ...win.logistics,
        notes: win.logistics.notes ? [...win.logistics.notes] : undefined,
      }
    : undefined,
  notifications: win.notifications
    ? win.notifications.map(notification => ({ ...notification }))
    : undefined,
  slas: win.slas ? win.slas.map(sla => ({ ...sla })) : undefined,
  policyNotes: win.policyNotes ? [...win.policyNotes] : undefined,
});

export const updateWinRecord = (
  winId: string,
  updater: (win: AuctionWin) => AuctionWin | void,
): AuctionWin | null => {
  const wins = loadWins();
  const index = wins.findIndex(win => win.id === winId);
  if (index < 0) return null;

  const draft = cloneWin(wins[index]);
  const result = updater(draft);
  const nextWin = (result ?? draft) as AuctionWin;
  wins[index] = nextWin;
  saveWins(wins);
  return nextWin;
};

export const getWinById = (winId: string): AuctionWin | undefined => {
  return loadWins().find(win => win.id === winId);
};

export const findWinByOrderId = (orderId: string): AuctionWin | undefined => {
  if (!orderId) return undefined;
  return loadWins().find(win => win.checkout?.orderId === orderId);
};

export const findWinByInvoiceNo = (invoiceNo: string): AuctionWin | undefined => {
  if (!invoiceNo) return undefined;
  return loadWins().find(win => win.checkout?.invoiceNo === invoiceNo);
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