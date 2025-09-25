import type { ListingSummary, PickupPoint } from '@/types';
import { trackEvent } from './analytics';

const RAW_DEMO_LISTINGS = [
  {
    id: 'lst_demo_sneaker',
    title: 'Nike Air Force 1 Low – Royal Blue',
    priceXAF: 42000,
    images: ['/demo/blue-airforce-shoes.jfif'],
    etaDays: { min: 12, max: 16 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.94, medianDays: 13 },
    moq: { target: 36, committed: 21, lockAt: '2025-10-02T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_press',
    title: 'Krea Steam Press Station (Multi-brand)',
    priceXAF: 98500,
    images: ['/demo/steam-press-center.jfif'],
    etaDays: { min: 18, max: 26 },
    lane: { code: 'GZ-DLA-SEA', onTimePct: 0.81, medianDays: 24 },
    moq: { target: 20, committed: 9, lockAt: '2025-10-04T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_iron',
    title: 'Cordless Ceramic Steam Iron',
    priceXAF: 26500,
    images: ['/demo/cordless-steam-iron.jfif'],
    etaDays: { min: 15, max: 21 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.9, medianDays: 17 },
    moq: { target: 28, committed: 14, lockAt: '2025-10-06T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_conceal',
    title: 'L.A. Girl Pro Conceal Set (6 shades)',
    priceXAF: 7200,
    images: ['/demo/la-girl-pro-conceal.jfif'],
    etaDays: { min: 20, max: 28 },
    lane: { code: 'GZ-DLA-SEA', onTimePct: 0.79, medianDays: 25 },
    moq: { target: 48, committed: 32, lockAt: '2025-10-08T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_podcast_mic',
    title: 'Maono PD200X Podcast Microphone',
    priceXAF: 75800,
    images: ['/demo/maono-podcast-mic.jfif'],
    etaDays: { min: 14, max: 18 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.92, medianDays: 15 },
    moq: { target: 18, committed: 11, lockAt: '2025-10-10T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_lavalier',
    title: 'Dual Wireless Lavalier Mic Kit',
    priceXAF: 53600,
    images: ['/demo/wireless-lavalier-kit.jfif'],
    etaDays: { min: 13, max: 19 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.9, medianDays: 16 },
    moq: { target: 24, committed: 10, lockAt: '2025-10-12T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_mixer',
    title: 'Silver Crest 8L Stand Mixer',
    priceXAF: 118000,
    images: ['/demo/silver-crest-stand-mixer.jfif'],
    etaDays: { min: 22, max: 32 },
    lane: { code: 'GZ-DLA-SEA', onTimePct: 0.83, medianDays: 27 },
    moq: { target: 16, committed: 7, lockAt: '2025-10-14T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_tv',
    title: 'TD Systems 32" Google TV (HD)',
    priceXAF: 138500,
    images: ['/demo/td-systems-32in-smart-tv.jfif'],
    etaDays: { min: 24, max: 34 },
    lane: { code: 'GZ-DLA-SEA', onTimePct: 0.8, medianDays: 29 },
    moq: { target: 22, committed: 15, lockAt: '2025-10-16T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_fridge',
    title: 'Scanfrost Double-Door Refrigerator 253L',
    priceXAF: 296000,
    images: ['/demo/scanfrost-double-door-fridge.jfif'],
    etaDays: { min: 30, max: 42 },
    lane: { code: 'GZ-DLA-SEA', onTimePct: 0.77, medianDays: 36 },
    moq: { target: 12, committed: 5, lockAt: '2025-10-18T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_clipper',
    title: 'Rechargeable Grooming Clipper Kit',
    priceXAF: 18500,
    images: ['/demo/download-2.jfif'],
    etaDays: { min: 11, max: 16 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.91, medianDays: 13 },
    moq: { target: 40, committed: 19, lockAt: '2025-10-20T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_airfryer',
    title: '6.5L Digital Air Fryer Oven',
    priceXAF: 68500,
    images: ['/demo/download-3.jfif'],
    etaDays: { min: 23, max: 31 },
    lane: { code: 'GZ-DLA-SEA', onTimePct: 0.82, medianDays: 26 },
    moq: { target: 18, committed: 8, lockAt: '2025-10-22T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_mist_fan',
    title: 'Rechargeable Cooling Mist Fan',
    priceXAF: 34500,
    images: ['/demo/download-4.jfif'],
    etaDays: { min: 17, max: 24 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.89, medianDays: 18 },
    moq: { target: 26, committed: 12, lockAt: '2025-10-24T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_tablet',
    title: '10.1" Android Tablet (64GB)',
    priceXAF: 94500,
    images: ['/demo/download-5.jfif'],
    etaDays: { min: 21, max: 29 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.9, medianDays: 22 },
    moq: { target: 30, committed: 16, lockAt: '2025-10-26T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
  {
    id: 'lst_demo_headset',
    title: 'RGB Gaming Headset with Boom Mic',
    priceXAF: 27500,
    images: ['/demo/download-6.jfif'],
    etaDays: { min: 16, max: 22 },
    lane: { code: 'GZ-DLA-AIR', onTimePct: 0.93, medianDays: 18 },
    moq: { target: 34, committed: 20, lockAt: '2025-10-28T18:00:00Z' },
    importer: { id: 'usr_imp_seed', displayName: 'Nelly Stores', verified: true },
    buyerProtection: { escrow: true, autoRefundOnLate: true },
  },
] as const satisfies readonly Omit<ListingSummary, 'category' | 'specs' | 'createdAt'>[];

const ENRICHED_LISTING_META: Record<string, { category: string; specs: string[]; createdAt: string }> = {
  lst_demo_sneaker: {
    category: 'Footwear',
    specs: [
      'Classic low-top silhouette with premium blue leather',
      'Comes in EU 40-45 sizes popular in Douala retail',
      'Air cushioning suited for all-day street wear',
    ],
    createdAt: '2025-07-20T09:00:00Z',
  },
  lst_demo_press: {
    category: 'Home Appliances',
    specs: [
      'Large press plate handles heavy fabrics quickly',
      'Integrated boiler delivers continuous high-pressure steam',
      'Suitable for boutique laundries and hotel service providers',
    ],
    createdAt: '2025-07-21T09:00:00Z',
  },
  lst_demo_iron: {
    category: 'Home Appliances',
    specs: [
      'Cordless dock gives 35 seconds of continuous steam',
      'Ceramic soleplate glides over Ankara and denim',
      'Auto-shutoff and anti-drip reservoir for safety',
    ],
    createdAt: '2025-07-22T09:00:00Z',
  },
  lst_demo_conceal: {
    category: 'Beauty',
    specs: [
      'Six high-demand warm and neutral shades per pack',
      'Creamy texture ideal for contouring and highlight sets',
      'Shelf-ready blister cards with tamper seals',
    ],
    createdAt: '2025-07-23T09:00:00Z',
  },
  lst_demo_podcast_mic: {
    category: 'Electronics',
    specs: [
      'Dynamic capsule tuned for studio voice capture',
      'Dual USB-C and XLR outputs for flexible setups',
      'Includes metal boom arm and shock mount kit',
    ],
    createdAt: '2025-07-24T09:00:00Z',
  },
  lst_demo_lavalier: {
    category: 'Audio',
    specs: [
      '2.4GHz wireless kit pairs instantly with smartphones',
      'Dual transmitters with real-time ear monitor output',
      'Comes with Type-C and Lightning receivers in the box',
    ],
    createdAt: '2025-07-25T09:00:00Z',
  },
  lst_demo_mixer: {
    category: 'Kitchen',
    specs: [
      '8 litre stainless bowl for bakery-scale batches',
      '1800W motor with planetary mixing action',
      'Ships with dough hook, whisk and beater attachments',
    ],
    createdAt: '2025-07-26T09:00:00Z',
  },
  lst_demo_tv: {
    category: 'Electronics',
    specs: [
      'Android TV 11 with Google Assistant voice remote',
      'HD ready IPS panel optimised for power-saving',
      'Built-in Chromecast for cafes and apartment rentals',
    ],
    createdAt: '2025-07-27T09:00:00Z',
  },
  lst_demo_fridge: {
    category: 'Appliances',
    specs: [
      '253L capacity with frost-free cooling',
      'Stainless handles and tempered glass shelves',
      'Energy class A design for Cameroon voltage',
    ],
    createdAt: '2025-07-28T09:00:00Z',
  },
  lst_demo_clipper: {
    category: 'Personal Care',
    specs: [
      'Includes four guide combs for barbershop cuts',
      'LED battery indicator with USB-C quick charge',
      'Titanium blades stay sharp for high-volume salons',
    ],
    createdAt: '2025-07-29T09:00:00Z',
  },
  lst_demo_airfryer: {
    category: 'Home Appliances',
    specs: [
      'Digital touchscreen with 8 preset cooking modes',
      '6.5 litre basket feeds a family of five',
      'Detachable parts are dishwasher safe',
    ],
    createdAt: '2025-07-30T09:00:00Z',
  },
  lst_demo_mist_fan: {
    category: 'Home Appliances',
    specs: [
      'Integrated humidifier adds fine cooling mist',
      'Lithium battery provides up to 6 hours runtime',
      '3 speed settings with night light for kiosks',
    ],
    createdAt: '2025-07-31T09:00:00Z',
  },
  lst_demo_tablet: {
    category: 'Electronics',
    specs: [
      '10.1" IPS display with 4GB RAM / 64GB ROM',
      'Dual SIM standby for data resilience',
      'Bundled Bluetooth keyboard case ready for resale',
    ],
    createdAt: '2025-08-01T09:00:00Z',
  },
  lst_demo_headset: {
    category: 'Audio',
    specs: [
      '50mm drivers tuned for immersive console gaming',
      'RGB halo lighting attracts in-store attention',
      'Memory foam earcups for long streaming sessions',
    ],
    createdAt: '2025-08-02T09:00:00Z',
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
