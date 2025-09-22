import type { ListingSummary, PickupPoint } from '@/types';
import { trackEvent } from './analytics';

const RAW_DEMO_LISTINGS = [
  {
    id: 'lst_seed_1',
    title: 'Baseus 30W Charger (EU Plug)',
    priceXAF: 6500,
    images: ['/demo/charger1.jpg', '/demo/charger2.jpg'],
    etaDays: { min: 10, max: 14 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.93, medianDays: 12 },
    moq: { target: 25, committed: 18, lockAt: '2025-10-02T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_seed_2',
    title: 'Wireless Earbuds (TWS, USB-C)',
    priceXAF: 8900,
    images: ['/demo/tws1.jpg', '/demo/tws2.jpg'],
    etaDays: { min: 10, max: 14 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.93, medianDays: 12 },
    moq: { target: 30, committed: 12, lockAt: '2025-10-04T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_seed_3',
    title: 'Velvet Matte Lipstick (3-pack)',
    priceXAF: 5200,
    images: ['/demo/lip1.jpg', '/demo/lip2.jpg'],
    etaDays: { min: 25, max: 35 },
    lane: { code: 'GZ-DLA-SEA', onTimePct: 0.78, medianDays: 28 },
    moq: { target: 40, committed: 33, lockAt: '2025-10-06T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
] as const satisfies readonly Omit<ListingSummary, 'category' | 'specs' | 'createdAt'>[];

const ENRICHED_LISTING_META: Record<string, { category: string; specs: string[]; createdAt: string }> = {
  lst_seed_1: {
    category: 'Electronics',
    specs: [
      'GaN fast charging delivers up to 30W output',
      'Dual USB-C ports intelligently share power',
      'Ships with EU plug ready for Cameroon voltage',
    ],
    createdAt: '2025-07-20T09:00:00Z',
  },
  lst_seed_2: {
    category: 'Audio',
    specs: [
      'Bluetooth 5.3 with low-latency gaming mode',
      '7-hour playback plus USB-C quick charge case',
      'Includes silicone tips sized for Francophone markets',
    ],
    createdAt: '2025-07-22T09:00:00Z',
  },
  lst_seed_3: {
    category: 'Beauty',
    specs: [
      'Long-wear velvet matte finish in warm shades',
      'Triple pack ideal for bundle merchandising',
      'Dermatologist tested and export compliant',
    ],
    createdAt: '2025-07-24T09:00:00Z',
  },
};

export const DEMO_LISTINGS: ListingSummary[] = RAW_DEMO_LISTINGS.map(listing => ({
  ...listing,
  ...ENRICHED_LISTING_META[listing.id],
}));

export const DEMO_PICKUPS: PickupPoint[] = [
  {
    id: 'pkp_seed_1',
    name: 'Akwa Pickup Hub',
    address: 'Rue Joffre, Akwa',
    city: 'Douala',
    phone: '+237 670 00 00 00',
  },
  {
    id: 'pkp_seed_2',
    name: 'Biyem-Assi Point',
    address: 'Carrefour Biyem-Assi',
    city: 'Yaoundé',
    phone: '+237 671 11 11 11',
  },
];

export let isDemoActive = false;

export const primaryDemoListing = DEMO_LISTINGS[0];

export const primaryDemoListingId = primaryDemoListing.id;

export function activateDemoMode() {
  if (!isDemoActive) {
    isDemoActive = true;
    trackEvent('demo_mode_active');
  }
}

export function getDemoListingById(id?: string | null) {
  if (!id) return null;
  return DEMO_LISTINGS.find(item => item.id === id) ?? null;
}
