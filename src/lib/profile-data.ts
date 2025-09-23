import type { PickupPoint } from '@/types';

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

export type PublicImporterProfile = {
  id: string;
  storeName: string;
  city: string;
  verified: boolean;
  avatarInitials: string;
  onTime: number;
  disputeRate: number;
  lanes: string[];
  about: string;
  recentListings: Array<{
    id: string;
    title: string;
    priceXAF: number;
    image: string;
    etaLabel: string;
  }>;
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
  onTime: 93,
  disputeRate: 2.1,
  lanes: ['GZ→DLA Air', 'IST→DLA Sea', 'SZX→DLA Air'],
  about:
    'Trusted preorder partner delivering electronics with consistent quality and transparent updates for growing retailers.',
  recentListings: [
    {
      id: 'listing-1',
      title: 'Anker Nano 30W USB-C Charger',
      priceXAF: 11500,
      image:
        'https://images.unsplash.com/photo-1582719478173-d83e7e913b95?auto=format&fit=crop&w=600&q=80',
      etaLabel: 'ETA 10–14 days',
    },
    {
      id: 'listing-2',
      title: 'Oraimo 20000mAh Power Bank',
      priceXAF: 18500,
      image:
        'https://images.unsplash.com/photo-1526402468835-cf54a0c1d79b?auto=format&fit=crop&w=600&q=80',
      etaLabel: 'ETA 12–16 days',
    },
    {
      id: 'listing-3',
      title: 'Xiaomi Buds 4 Lite',
      priceXAF: 23500,
      image:
        'https://images.unsplash.com/photo-1585386959984-a4155229a1ab?auto=format&fit=crop&w=600&q=80',
      etaLabel: 'ETA 15–20 days',
    },
  ],
  shareUrl: 'https://prolist.africa/importers/nelly-stores',
};

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
  if (!importerId || importerId === demoImporterPublicProfile.id) {
    return demoImporterPublicProfile;
  }
  return {
    ...demoImporterPublicProfile,
    id: importerId,
  };
};

