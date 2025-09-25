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
    wonAt: '2025-09-20T10:45:00Z'
  }
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