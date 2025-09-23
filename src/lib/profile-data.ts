import type { PickupPoint } from '@/types';
import { DEMO_LISTINGS } from './demoMode';

const normaliseSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const titleCaseFromSlug = (value: string) =>
  value
    .split('-')
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatLaneLabel = (code: string) => {
  if (code.includes('→')) {
    return code.replace(/\s{2,}/g, ' ').trim();
  }
  const parts = code.split('-').filter(Boolean);
  const [originRaw = '', destinationRaw = '', rawMode = ''] = parts;
  const origin = originRaw.trim().toUpperCase();
  const destination = destinationRaw.trim().toUpperCase();
  const mode = rawMode.toLowerCase() === 'sea' ? 'Sea' : 'Air';
  if (!origin || !destination) {
    return code.replace(/-/g, ' ').trim();
  }
  return `${origin}→${destination} ${mode}`;
};

const normalisePercent = (value: number) => (value > 1 ? Math.round(value) : Math.round(value * 100));

export type DeviceInfo = {
  id: string;
  label: string;
  location: string;
  lastActive: string;
  current?: boolean;
};

export type BuyerProfile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  maskedPhone: string;
  maskedEmail: string;
  defaultPickupId: string;
  pickups: Array<PickupPoint & { note?: string }>;
  deliveryNote?: string;
  notifications: {
    orderUpdates: boolean;
    arrivals: boolean;
    refunds: boolean;
  };
  privacy: {
    shareNameWithSellers: boolean;
  };
  kyc: {
    status: 'verified' | 'pending' | 'not_started';
    helper: string;
    lastChecked: string;
  };
  devices: DeviceInfo[];
};

export type VerificationStepStatus = 'complete' | 'current' | 'upcoming';

export type VerificationStep = {
  id: 'id' | 'business' | 'payout';
  label: string;
  description: string;
  status: VerificationStepStatus;
};

export type ImporterProfile = {
  id: string;
  storeName: string;
  contactName: string;
  phone: string;
  email: string;
  maskedPhone: string;
  maskedEmail: string;
  city: string;
  bio: string;
  verified: boolean;
  score: number;
  onTime: number;
  defaultPickupId: string;
  pickups: Array<PickupPoint & { note?: string }>;
  notifications: {
    buyerUpdates: boolean;
    payouts: boolean;
    disputes: boolean;
  };
  privacy: {
    showEmailToBuyers: boolean;
  };
  verification: {
    steps: VerificationStep[];
    completedAt?: string;
  };
  lanes: string[];
  devices: DeviceInfo[];
  support: {
    phone: string;
    email: string;
  };
};

export type PublicImporterMetricSource = 'profile' | 'platform_average';

export type PublicImporterMetrics = {
  onTimePct: number;
  disputeRatePct: number;
  responseTimeLabel: string;
  ordersFulfilledLabel: string;
  source: PublicImporterMetricSource;
};

export type PublicImporterLane = {
  id: string;
  label: string;
  onTimePct: number;
};

export type PublicImporterCategory = {
  id: string;
  label: string;
};

export type PublicImporterListing = {
  id: string;
  title: string;
  priceXAF: number;
  image: string;
  etaLabel: string;
  laneId: string;
  laneLabel?: string;
  laneOnTimePct?: number;
  categories: string[];
  moqCommitted: number;
  moqTarget: number;
  isSample?: boolean;
};

export type PublicImporterSocialProof = {
  id: string;
  quote: string;
};

export type PublicImporterProfile = {
  id: string;
  storeName: string;
  city: string;
  verified: boolean;
  avatarInitials: string;
  lanes: PublicImporterLane[];
  metrics: PublicImporterMetrics;
  categories: PublicImporterCategory[];
  about: string;
  policyUrl: string;
  pickupHubs: string[];
  socialProof: PublicImporterSocialProof[];
  recentListings: PublicImporterListing[];
  shareUrl: string;
};

const BUYER_KEY = 'pl.profile.buyer';
const IMPORTER_KEY = 'pl.profile.importer';

export const demoBuyerProfile: BuyerProfile = {
  id: 'demo-buyer',
  name: 'Nadege',
  phone: '+237 670 12 34 56',
  email: 'nadege@prolist.africa',
  maskedPhone: '+237 •••• •• ••',
  maskedEmail: 'nadege••@mail.com',
  defaultPickupId: 'pickup-akwa',
  pickups: [
    {
      id: 'pickup-akwa',
      name: 'Akwa Pickup Hub',
      address: 'Boulevard de la Liberté, Douala',
      city: 'Douala',
      phone: '+237 680 00 00 10',
      note: 'Open 9h00 – 19h30',
    },
    {
      id: 'pickup-biyem',
      name: 'Biyem-Assi Hub',
      address: 'Carrefour Belibi, Yaoundé',
      city: 'Yaoundé',
      phone: '+237 690 00 00 22',
      note: 'Pickups Monday, Wednesday, Friday',
    },
  ],
  deliveryNote: 'Call before pickup after 18h.',
  notifications: {
    orderUpdates: true,
    arrivals: true,
    refunds: true,
  },
  privacy: {
    shareNameWithSellers: true,
  },
  kyc: {
    status: 'pending',
    helper: 'Add your ID to unlock faster refunds.',
    lastChecked: 'Checked 2 weeks ago',
  },
  devices: [
    {
      id: 'device-iphone',
      label: 'iPhone 13',
      location: 'Douala',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: 'device-web',
      label: 'Chrome on MacBook',
      location: 'Yaoundé',
      lastActive: 'Signed in 5 days ago',
    },
  ],
};

export const demoImporterProfile: ImporterProfile = {
  id: 'demo-importer',
  storeName: 'Nelly Stores',
  contactName: 'Nelly Atem',
  phone: '+237 699 11 22 33',
  email: 'logistics@nellystores.africa',
  maskedPhone: '+237 •••• •• ••',
  maskedEmail: 'logistics••@nellystores.africa',
  city: 'Douala',
  bio: 'Premium importer specialising in fast-moving electronics and smart accessories.',
  verified: true,
  score: 92,
  onTime: 93,
  defaultPickupId: 'pickup-akwa',
  pickups: [
    {
      id: 'pickup-akwa',
      name: 'Akwa Pickup Hub',
      address: 'Boulevard de la Liberté, Douala',
      city: 'Douala',
      phone: '+237 680 00 00 10',
      note: 'Buyer-favourite, staffed daily',
    },
    {
      id: 'pickup-biyem',
      name: 'Biyem-Assi Hub',
      address: 'Carrefour Belibi, Yaoundé',
      city: 'Yaoundé',
      phone: '+237 690 00 00 22',
      note: 'Good for centre buyers',
    },
  ],
  notifications: {
    buyerUpdates: true,
    payouts: true,
    disputes: false,
  },
  privacy: {
    showEmailToBuyers: true,
  },
  verification: {
    steps: [
      {
        id: 'id',
        label: 'ID verification',
        description: 'Upload national ID or passport.',
        status: 'complete',
      },
      {
        id: 'business',
        label: 'Business info',
        description: 'Add RC number and tax ID.',
        status: 'current',
      },
      {
        id: 'payout',
        label: 'Payout setup',
        description: 'Confirm bank or mobile money details.',
        status: 'upcoming',
      },
    ],
  },
  lanes: ['GZ→DLA Air', 'IST→DLA Sea'],
  devices: [
    {
      id: 'device-s22',
      label: 'Galaxy S22',
      location: 'Douala',
      lastActive: 'Active now',
      current: true,
    },
    {
      id: 'device-office',
      label: 'Edge on Office PC',
      location: 'Douala',
      lastActive: 'Signed in yesterday',
    },
  ],
  support: {
    phone: '+237 651 222 333',
    email: 'support@nellystores.africa',
  },
};

export const demoImporterPublicProfile: PublicImporterProfile = {
  id: demoImporterProfile.id,
  storeName: demoImporterProfile.storeName,
  city: demoImporterProfile.city,
  verified: demoImporterProfile.verified,
  avatarInitials: 'NS',
  lanes: [
    { id: normaliseSlug('GZ→DLA Air'), label: 'GZ→DLA Air', onTimePct: 93 },
    { id: normaliseSlug('IST→DLA Sea'), label: 'IST→DLA Sea', onTimePct: 88 },
    { id: normaliseSlug('SZX→DLA Air'), label: 'SZX→DLA Air', onTimePct: 96 },
  ],
  metrics: {
    onTimePct: 93,
    disputeRatePct: 2.1,
    responseTimeLabel: '<6h',
    ordersFulfilledLabel: '120+',
    source: 'profile',
  },
  categories: [
    { id: normaliseSlug('Small electronics'), label: 'Small electronics' },
    { id: normaliseSlug('Accessories'), label: 'Accessories' },
    { id: normaliseSlug('Beauty'), label: 'Beauty' },
    { id: normaliseSlug('Home essentials'), label: 'Home essentials' },
  ],
  about:
    'Trusted preorder partner delivering electronics with consistent quality and transparent updates for growing retailers.',
  policyUrl: 'https://prolist.africa/buyer-protection',
  pickupHubs: ['Akwa', 'Biyem-Assi', 'Bonamoussadi'],
  socialProof: [
    { id: 'fbk-1', quote: '“Great updates—every drop arrived on time.”' },
    { id: 'fbk-2', quote: '“Packaging always secure, buyers felt confident.”' },
    { id: 'fbk-3', quote: '“Escrow released funds quickly after pickup.”' },
  ],
  recentListings: [
    {
      id: 'listing-1',
      title: 'Anker Nano 30W USB-C Charger',
      priceXAF: 11500,
      image:
        'https://images.unsplash.com/photo-1582719478173-d83e7e913b95?auto=format&fit=crop&w=600&q=80',
      etaLabel: '10–14 days',
      laneId: normaliseSlug('GZ→DLA Air'),
      laneLabel: 'GZ→DLA Air',
      laneOnTimePct: 93,
      categories: [normaliseSlug('Small electronics'), normaliseSlug('Accessories')],
      moqCommitted: 18,
      moqTarget: 30,
    },
    {
      id: 'listing-2',
      title: 'Oraimo 20000mAh Power Bank',
      priceXAF: 18500,
      image:
        'https://images.unsplash.com/photo-1526402468835-cf54a0c1d79b?auto=format&fit=crop&w=600&q=80',
      etaLabel: '12–16 days',
      laneId: normaliseSlug('GZ→DLA Air'),
      laneLabel: 'GZ→DLA Air',
      laneOnTimePct: 93,
      categories: [normaliseSlug('Small electronics'), normaliseSlug('Accessories')],
      moqCommitted: 22,
      moqTarget: 35,
    },
    {
      id: 'listing-3',
      title: 'Xiaomi Buds 4 Lite',
      priceXAF: 23500,
      image:
        'https://images.unsplash.com/photo-1585386959984-a4155229a1ab?auto=format&fit=crop&w=600&q=80',
      etaLabel: '15–20 days',
      laneId: normaliseSlug('SZX→DLA Air'),
      laneLabel: 'SZX→DLA Air',
      laneOnTimePct: 96,
      categories: [normaliseSlug('Beauty'), normaliseSlug('Accessories')],
      moqCommitted: 24,
      moqTarget: 40,
    },
    {
      id: 'listing-4',
      title: 'Samsung Galaxy A35 (128GB)',
      priceXAF: 198000,
      image:
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
      etaLabel: '14–18 days',
      laneId: normaliseSlug('IST→DLA Sea'),
      laneLabel: 'IST→DLA Sea',
      laneOnTimePct: 88,
      categories: [normaliseSlug('Small electronics')],
      moqCommitted: 12,
      moqTarget: 25,
    },
  ],
  shareUrl: 'https://prolist.africa/importers/nelly-stores',
};

const fallbackMetrics: PublicImporterMetrics = {
  onTimePct: 90,
  disputeRatePct: 2,
  responseTimeLabel: '<12h',
  ordersFulfilledLabel: '100+',
  source: 'platform_average',
};

const fallbackPickupHubs = ['Akwa', 'Biyem-Assi'];
const fallbackPolicyUrl = 'https://prolist.africa/buyer-protection';

const samplePublicListings: PublicImporterListing[] = DEMO_LISTINGS.slice(0, 3).map(listing => ({
  id: listing.id,
  title: listing.title,
  priceXAF: listing.priceXAF,
  image: listing.images[0] ?? '/placeholder.svg',
  etaLabel: `${listing.etaDays.min}–${listing.etaDays.max} days`,
  laneId: normaliseSlug(listing.lane.code),
  laneLabel: formatLaneLabel(listing.lane.code),
  laneOnTimePct: normalisePercent(listing.lane.onTimePct),
  categories: [normaliseSlug(listing.category)],
  moqCommitted: listing.moq.committed,
  moqTarget: listing.moq.target,
  isSample: true,
}));

const sampleCategoryMap = new Map(
  samplePublicListings.map(listing => [listing.categories[0], titleCaseFromSlug(listing.categories[0])]),
);

const sampleLanes = Array.from(
  new Map(
    samplePublicListings.map(listing => [
      listing.laneId,
      {
        id: listing.laneId,
        label: listing.laneLabel ?? formatLaneLabel(listing.laneId),
        onTimePct: listing.laneOnTimePct ?? fallbackMetrics.onTimePct,
      },
    ]),
  ).values(),
);

const safelyParse = <T,>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse profile data', error);
    return null;
  }
};

const persist = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to persist profile data', error);
  }
};

export const loadBuyerProfile = (): BuyerProfile => {
  if (typeof window === 'undefined') return demoBuyerProfile;
  const stored = safelyParse<BuyerProfile>(window.localStorage.getItem(BUYER_KEY));
  if (!stored) return demoBuyerProfile;
  return {
    ...demoBuyerProfile,
    ...stored,
    pickups: stored.pickups?.length ? stored.pickups : demoBuyerProfile.pickups,
    notifications: {
      ...demoBuyerProfile.notifications,
      ...stored.notifications,
    },
    privacy: {
      ...demoBuyerProfile.privacy,
      ...stored.privacy,
    },
    devices: stored.devices?.length ? stored.devices : demoBuyerProfile.devices,
  };
};

export const saveBuyerProfile = (profile: BuyerProfile) => {
  persist(BUYER_KEY, profile);
};

export const loadImporterProfile = (): ImporterProfile => {
  if (typeof window === 'undefined') return demoImporterProfile;
  const stored = safelyParse<ImporterProfile>(window.localStorage.getItem(IMPORTER_KEY));
  if (!stored) return demoImporterProfile;
  return {
    ...demoImporterProfile,
    ...stored,
    pickups: stored.pickups?.length ? stored.pickups : demoImporterProfile.pickups,
    notifications: {
      ...demoImporterProfile.notifications,
      ...stored.notifications,
    },
    privacy: {
      ...demoImporterProfile.privacy,
      ...stored.privacy,
    },
    verification: {
      ...demoImporterProfile.verification,
      ...stored.verification,
      steps: stored.verification?.steps?.length
        ? stored.verification.steps
        : demoImporterProfile.verification.steps,
    },
    lanes: stored.lanes?.length ? stored.lanes : demoImporterProfile.lanes,
    devices: stored.devices?.length ? stored.devices : demoImporterProfile.devices,
  };
};

export const saveImporterProfile = (profile: ImporterProfile) => {
  persist(IMPORTER_KEY, profile);
};

export const loadImporterPublicProfile = (importerId?: string): PublicImporterProfile => {
  const baseProfile =
    !importerId || importerId === demoImporterPublicProfile.id
      ? demoImporterPublicProfile
      : { ...demoImporterPublicProfile, id: importerId };

  const metrics: PublicImporterMetrics = {
    ...fallbackMetrics,
    ...baseProfile.metrics,
    source: baseProfile.metrics?.source ?? (baseProfile.metrics ? 'profile' : fallbackMetrics.source),
  };

  const laneMap = new Map<string, PublicImporterLane>();
  (baseProfile.lanes ?? []).forEach(lane => {
    const id = lane.id ?? normaliseSlug(lane.label);
    const label = lane.label ?? formatLaneLabel(lane.id ?? id);
    laneMap.set(id, {
      id,
      label,
      onTimePct: lane.onTimePct ?? metrics.onTimePct,
    });
  });

  const listingSource = baseProfile.recentListings?.length ? baseProfile.recentListings : samplePublicListings;

  const listings = listingSource.map(listing => {
    const laneId = listing.laneId ?? normaliseSlug(listing.laneLabel ?? listing.laneId ?? '');
    const laneEntry = laneMap.get(laneId);
    const laneLabel = listing.laneLabel ?? laneEntry?.label ?? formatLaneLabel(laneId);
    const laneOnTimePct = listing.laneOnTimePct ?? laneEntry?.onTimePct ?? metrics.onTimePct;
    if (!laneEntry) {
      laneMap.set(laneId, { id: laneId, label: laneLabel, onTimePct: laneOnTimePct });
    }
    return {
      ...listing,
      laneId,
      laneLabel,
      laneOnTimePct,
    };
  });

  if (laneMap.size === 0) {
    sampleLanes.forEach(lane => laneMap.set(lane.id, lane));
  }

  const categoriesMap = new Map<string, string>();
  (baseProfile.categories ?? []).forEach(category => {
    const id = category.id ?? normaliseSlug(category.label);
    const label = category.label ?? titleCaseFromSlug(id);
    categoriesMap.set(id, label);
  });

  listings.forEach(listing => {
    listing.categories.forEach(categoryId => {
      if (!categoriesMap.has(categoryId)) {
        const fallbackLabel = sampleCategoryMap.get(categoryId) ?? titleCaseFromSlug(categoryId);
        categoriesMap.set(categoryId, fallbackLabel);
      }
    });
  });

  let categories = Array.from(categoriesMap.entries()).map(([id, label]) => ({ id, label }));
  if (!categories.length) {
    categories = Array.from(sampleCategoryMap.entries()).map(([id, label]) => ({ id, label }));
  }

  const pickupHubs = baseProfile.pickupHubs?.length ? baseProfile.pickupHubs : fallbackPickupHubs;
  const socialProof = baseProfile.socialProof?.length ? baseProfile.socialProof : [];

  return {
    ...baseProfile,
    metrics,
    lanes: Array.from(laneMap.values()),
    categories,
    pickupHubs,
    socialProof,
    recentListings: listings,
    policyUrl: baseProfile.policyUrl ?? fallbackPolicyUrl,
    shareUrl: baseProfile.shareUrl ?? demoImporterPublicProfile.shareUrl,
  };
};

