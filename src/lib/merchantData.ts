// Type definitions
export type ListingCatalogItem = {
  id: string;
  title: string;
  image: string;
  type: 'auction' | 'direct';
  owner: { id: string; name: string; verified: boolean };
  priceXAF?: number;
  ownerMinXAF?: number;
  commissionRule: { type: 'percent' | 'fixed'; value: number };
  timeLeftSec?: number;
  claimedState?: 'available' | 'claimedByYou' | 'claimedByOther';
  newFromFollows?: boolean;
};

export type MyRepostListing = {
  id: string;
  title: string;
  image: string;
  type: 'auction' | 'direct';
  status: 'Live' | 'Draft' | 'Ending' | 'Ended' | 'Sold out';
  resultId: string;
  currentBidXAF?: number;
  timeLeftSec?: number;
  watchers?: number;
  priceXAF?: number;
};

export type PreorderCatalogItem = {
  id: string;
  title: string;
  images: string[];
  priceXAF: number;
  moq: { target: number; committed: number };
  lockAt: string;
  lane: { code: string; onTimePct: number; medianDays: number };
  importer: { id: string; name: string; verified: boolean };
  commissionRule: { type: 'percent' | 'fixed'; value: number };
  newFromFollows?: boolean;
};

export type MyRepostPreorder = {
  id: string;
  poolId: string;
  title: string;
  images: string[];
  priceXAF: number;
  sharedMoq: { target: number; committed: number };
  lockAt: string;
  ordersViaMe: number;
  commissionToDateXAF: number;
  importerId: string;
};

export type CommissionEntry = {
  orderId: string;
  amount: number;
  collectedAt: string;
  itemTitle: string;
};

// Demo data
export const LISTINGS_CATALOG: ListingCatalogItem[] = [
  {
    id: 'cat_lst_001',
    title: 'iPhone 15 Pro Charging Cable (USB-C)',
    image: '/demo/download-3.jfif',
    type: 'direct',
    owner: { id: 'creator-techplus', name: 'TechHub Pro', verified: true },
    priceXAF: 8500,
    commissionRule: { type: 'percent', value: 15 }, // 15%
    claimedState: 'available',
    newFromFollows: true,
  },
  {
    id: 'cat_lst_002',
    title: 'Premium Raw Shea Butter (1kg)',
    image: '/demo/download-2.jfif',
    type: 'auction',
    owner: { id: 'creator-beauty', name: 'Natural Beauty Co', verified: true },
    ownerMinXAF: 12000,
    commissionRule: { type: 'fixed', value: 2500 }, // +2500 XAF
    timeLeftSec: 86400, // 24 hours
    claimedState: 'available',
    newFromFollows: true,
  },
  {
    id: 'cat_lst_003',
    title: 'RGB Gaming LED Strip Kit (10m)',
    image: '/demo/download-4.jfif',
    type: 'auction',
    owner: { id: 'creator-sports', name: 'GameZone', verified: false },
    ownerMinXAF: 18000,
    commissionRule: { type: 'percent', value: 20 }, // 20%
    timeLeftSec: 172800, // 48 hours
    claimedState: 'claimedByYou',
  },
  {
    id: 'cat_lst_004',
    title: 'AirPods Pro 3rd Gen Wireless Earbuds',
    image: '/demo/download-6.jfif',
    type: 'direct',
    owner: { id: 'creator-techplus', name: 'AudioTech', verified: true },
    priceXAF: 45500,
    commissionRule: { type: 'fixed', value: 5000 }, // +5000 XAF
    claimedState: 'claimedByOther',
  },
];

export const MY_REPOSTS_LISTINGS: MyRepostListing[] = [
  {
    id: 'rep_lst_001',
    title: 'RGB Gaming LED Strip Kit (10m)',
    image: '/demo/download-4.jfif',
    type: 'auction',
    currentBidXAF: 19500,
    timeLeftSec: 172800, // 48 hours
    watchers: 12,
    status: 'Live',
    resultId: 'res_lst_rgb-led-strip',
  },
  {
    id: 'rep_lst_002',
    title: 'Wireless Hair Clippers Set',
    image: '/demo/download-5.jfif',
    type: 'direct',
    priceXAF: 28000,
    status: 'Draft',
    resultId: 'res_lst_wireless-clippers',
  },
];

export const PREORDER_CATALOG: PreorderCatalogItem[] = [
  {
    id: 'cat_pre_001',
    title: 'Professional Stand Mixer 1200W',
    images: ['/demo/silver-crest-stand-mixer.jfif'],
    priceXAF: 185000,
    moq: { target: 50, committed: 38 },
    lockAt: '2025-10-05T16:00:00Z',
    lane: { code: 'GZ-DLA-SEA', onTimePct: 0.89, medianDays: 28 },
    importer: { id: 'creator-home', name: 'Kitchen Pro Imports', verified: true },
    commissionRule: { type: 'percent', value: 12 }, // 12% per order
    newFromFollows: true,
  },
  {
    id: 'cat_pre_002',
    title: 'Cordless Steam Iron 2400W',
    images: ['/demo/cordless-steam-iron.jfif'],
    priceXAF: 95000,
    moq: { target: 80, committed: 64 },
    lockAt: '2025-10-03T12:00:00Z',
    lane: { code: 'HKG-DLA-AIR', onTimePct: 0.94, medianDays: 15 },
    importer: { id: 'creator-techplus', name: 'Home Essentials Ltd', verified: true },
    commissionRule: { type: 'fixed', value: 8000 }, // 8000 XAF per order
  },
  {
    id: 'cat_pre_003',
    title: 'Podcast Microphone Kit USB',
    images: ['/demo/maono-podcast-mic.jfif'],
    priceXAF: 68000,
    moq: { target: 35, committed: 29 },
    lockAt: '2025-10-08T18:00:00Z',
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.92, medianDays: 12 },
    importer: { id: 'creator-techplus', name: 'Audio Tech Imports', verified: false },
    commissionRule: { type: 'percent', value: 15 }, // 15% per order
  },
];

export const MY_REPOSTS_PREORDERS: MyRepostPreorder[] = [
  {
    id: 'rep_pre_001',
    poolId: 'cat_pre_001', // References shared pool
    title: 'Professional Stand Mixer 1200W',
    images: ['/demo/silver-crest-stand-mixer.jfif'],
    priceXAF: 185000,
    sharedMoq: { target: 50, committed: 38 },
    lockAt: '2025-10-05T16:00:00Z',
    ordersViaMe: 5,
    commissionToDateXAF: 111000, // 5 orders × 185000 × 12%
    importerId: 'creator-home',
  },
  {
    id: 'rep_pre_002',
    poolId: 'cat_pre_002', // References shared pool
    title: 'Cordless Steam Iron 2400W',
    images: ['/demo/cordless-steam-iron.jfif'],
    priceXAF: 95000,
    sharedMoq: { target: 80, committed: 64 },
    lockAt: '2025-10-03T12:00:00Z',
    ordersViaMe: 8,
    commissionToDateXAF: 64000, // 8 orders × 8000 XAF
    importerId: 'creator-techplus',
  },
];

export const COMMISSION_LEDGER: CommissionEntry[] = [
  // Will be populated when demo "Collect" actions are triggered
  // Structure: { orderId, amount, collectedAt, itemTitle }
];