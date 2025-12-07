import { getDemoProfileImage } from '@/lib/demoProfileImages';

const STORAGE_KEY = 'pl.followers';
const PRIVACY_KEY = 'pl.followers.privacy';

export type NotifyState = 'on' | 'pending' | 'off';

export type Creator = {
  id: string;
  name: string;
  avatar: string;
  verified: boolean;
  followersCount: number;
  closedDeals60d: number;
  lanes: string[];
  categories: string[];
  responseTime: string;
  onTimePct: number;
  disputeRatePct: number;
  city: string;
  newAuctions?: boolean;
  newPreorders?: boolean;
};

type FollowerPreview = {
  id: string;
  display: string;
  since: string;
  avatar: string;
};

export type FollowState = {
  creatorId: string;
  auctionsNotify: NotifyState;
  preordersNotify: NotifyState;
  blocked?: boolean;
  followedAt: string;
};

export type PrivacySettings = {
  showNameInFollowers: boolean;
};

export type BuyerFollower = {
  id: string;
  buyerId: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  location: string;
  focusAreas: string[];
  spendLast90d: string;
  lastOrder: string;
  followingSince: string;
  notes?: string;
};

const DEMO_CREATORS: Creator[] = [
  {
    id: 'creator-nelly',
    name: 'Nelly Stores',
    avatar: getDemoProfileImage(5),
    verified: true,
    followersCount: 342,
    closedDeals60d: 87,
    lanes: ['GZ→DLA Air', 'IST→DLA Sea'],
    categories: ['Small electronics', 'Accessories'],
    responseTime: '<6h',
    onTimePct: 93,
    disputeRatePct: 2,
    city: 'Douala',
    newAuctions: true,
  },
  {
    id: 'creator-techplus',
    name: 'TechPlus Import',
    avatar: getDemoProfileImage(6),
    verified: true,
    followersCount: 521,
    closedDeals60d: 124,
    lanes: ['SZX→DLA Air', 'HK→DLA Air'],
    categories: ['Electronics', 'Smart home'],
    responseTime: '<4h',
    onTimePct: 96,
    disputeRatePct: 1,
    city: 'Yaoundé',
    newPreorders: true,
  },
  {
    id: 'creator-beauty',
    name: 'Beauty Hub CM',
    avatar: getDemoProfileImage(7),
    verified: true,
    followersCount: 289,
    closedDeals60d: 65,
    lanes: ['GZ→DLA Air'],
    categories: ['Beauty', 'Personal care'],
    responseTime: '<8h',
    onTimePct: 91,
    disputeRatePct: 3,
    city: 'Douala',
  },
  {
    id: 'creator-home',
    name: 'Home Essentials',
    avatar: getDemoProfileImage(8),
    verified: false,
    followersCount: 156,
    closedDeals60d: 42,
    lanes: ['IST→DLA Sea', 'DXB→DLA Sea'],
    categories: ['Home essentials', 'Kitchen'],
    responseTime: '<12h',
    onTimePct: 88,
    disputeRatePct: 4,
    city: 'Douala',
  },
  {
    id: 'creator-fashion',
    name: 'Fashion Forward',
    avatar: getDemoProfileImage(9),
    verified: true,
    followersCount: 412,
    closedDeals60d: 98,
    lanes: ['GZ→DLA Air'],
    categories: ['Fashion', 'Accessories'],
    responseTime: '<5h',
    onTimePct: 94,
    disputeRatePct: 2,
    city: 'Yaoundé',
  },
  {
    id: 'creator-kids',
    name: 'Kids Corner',
    avatar: getDemoProfileImage(10),
    verified: false,
    followersCount: 201,
    closedDeals60d: 54,
    lanes: ['SZX→DLA Air'],
    categories: ['Kids', 'Toys'],
    responseTime: '<10h',
    onTimePct: 89,
    disputeRatePct: 3,
    city: 'Douala',
  },
  {
    id: 'creator-sports',
    name: 'Sports Zone',
    avatar: getDemoProfileImage(11),
    verified: true,
    followersCount: 367,
    closedDeals60d: 76,
    lanes: ['GZ→DLA Air', 'SZX→DLA Air'],
    categories: ['Sports', 'Fitness'],
    responseTime: '<7h',
    onTimePct: 92,
    disputeRatePct: 2,
    city: 'Douala',
  },
  {
    id: 'creator-wellness',
    name: 'Wellness Shop',
    avatar: getDemoProfileImage(12),
    verified: false,
    followersCount: 178,
    closedDeals60d: 38,
    lanes: ['IST→DLA Sea'],
    categories: ['Wellness', 'Health'],
    responseTime: '<9h',
    onTimePct: 87,
    disputeRatePct: 3,
    city: 'Yaoundé',
  },
];

const DEFAULT_FOLLOWER_PREVIEWS: FollowerPreview[] = [
  { id: 'follower-1', display: 'Estelle B. • Douala', since: 'Joined Feb', avatar: getDemoProfileImage(13) },
  { id: 'follower-2', display: 'Michel K. • Yaoundé', since: 'Joined Jan', avatar: getDemoProfileImage(14) },
  { id: 'follower-3', display: 'Sonia L. • Douala', since: 'Joined Nov', avatar: getDemoProfileImage(15) },
  { id: 'follower-4', display: 'Awa P. • Bafoussam', since: 'Joined Oct', avatar: getDemoProfileImage(16) },
];

const CREATOR_FOLLOWERS: Record<string, FollowerPreview[]> = {
  'creator-nelly': [
    { id: 'follower-5', display: 'Giselle M. • Douala', since: 'Joined Apr', avatar: getDemoProfileImage(17) },
    { id: 'follower-6', display: 'Tomas E. • Douala', since: 'Joined Mar', avatar: getDemoProfileImage(18) },
    { id: 'follower-7', display: 'Mireille C. • Yaoundé', since: 'Joined Jan', avatar: getDemoProfileImage(13) },
  ],
  'creator-techplus': [
    { id: 'follower-8', display: 'Ruben A. • Douala', since: 'Joined Dec', avatar: getDemoProfileImage(14) },
    { id: 'follower-9', display: 'Clarisse T. • Yaoundé', since: 'Joined Nov', avatar: getDemoProfileImage(15) },
    { id: 'follower-10', display: 'Valéry S. • Douala', since: 'Joined Sep', avatar: getDemoProfileImage(16) },
  ],
};

const BUYER_FOLLOWERS: BuyerFollower[] = [
  {
    id: 'buyer-follower-sophie',
    buyerId: 'demo-buyer-sophie',
    name: 'Sophie Kamdem',
    email: 'sophie.kamdem@prolist.dev',
    phone: '+237 650 123 234',
    avatar: getDemoProfileImage(19),
    location: 'Bonamoussadi • Douala',
    focusAreas: ['Electronics', 'Accessories'],
    spendLast90d: '₣1.2M',
    lastOrder: '₣420k • 12 Nov',
    followingSince: 'Mar 2023',
    notes: 'Looks for fast air freight lanes for flash sales launches.',
  },
  {
    id: 'buyer-follower-cedric',
    buyerId: 'demo-buyer-jean',
    name: 'Cédric Ngu',
    email: 'cedric.ngu@prolist.dev',
    phone: '+237 651 778 902',
    avatar: getDemoProfileImage(20),
    location: 'Akwa • Douala',
    focusAreas: ['Home appliances', 'Smart home'],
    spendLast90d: '₣980k',
    lastOrder: '₣310k • 04 Nov',
    followingSince: 'Jul 2022',
    notes: 'Interested in bundle deals that include delivery to the Akwa pickup hub.',
  },
  {
    id: 'buyer-follower-nadine',
    buyerId: 'demo-buyer-marie',
    name: 'Nadine Fotsing',
    email: 'nadine.fotsing@prolist.dev',
    phone: '+237 652 654 321',
    avatar: getDemoProfileImage(21),
    location: 'Biyem-Assi • Yaoundé',
    focusAreas: ['Beauty', 'Personal care'],
    spendLast90d: '₣760k',
    lastOrder: '₣210k • 27 Oct',
    followingSince: 'Jan 2024',
    notes: 'Prefers curated drops with influencer-ready packaging.',
  },
];

const loadFromStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to load ${key}`, error);
    return fallback;
  }
};

const saveToStorage = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save ${key}`, error);
  }
};

const ensureSeedFollows = (): FollowState[] => {
  const stored = loadFromStorage<FollowState[]>(STORAGE_KEY, []);
  if (stored.length > 0) {
    return stored;
  }

  const seeds: FollowState[] = DEMO_CREATORS.slice(0, 3).map((creator, index) => ({
    creatorId: creator.id,
    auctionsNotify: index === 0 ? 'on' : 'pending',
    preordersNotify: index === 1 ? 'on' : 'off',
    followedAt: new Date(Date.now() - index * 86400000).toISOString(),
  }));

  saveToStorage(STORAGE_KEY, seeds);
  return seeds;
};

export const getAllCreators = (): Creator[] => {
  return DEMO_CREATORS;
};

export const getCreatorById = (id: string): Creator | undefined => {
  return DEMO_CREATORS.find(c => c.id === id);
};

export const getFollowedCreators = (): Creator[] => {
  const follows = ensureSeedFollows();
  const followedIds = new Set(follows.filter(f => !f.blocked).map(f => f.creatorId));
  return DEMO_CREATORS.filter(c => followedIds.has(c.id));
};

export const getFollowState = (creatorId: string): FollowState | null => {
  const follows = ensureSeedFollows();
  return follows.find(f => f.creatorId === creatorId) || null;
};

export const isFollowing = (creatorId: string): boolean => {
  const state = getFollowState(creatorId);
  return state !== null && !state.blocked;
};

export const followCreator = (creatorId: string): FollowState => {
  const follows = ensureSeedFollows();
  const existing = follows.find(f => f.creatorId === creatorId);

  if (existing) {
    existing.blocked = false;
    saveToStorage(STORAGE_KEY, follows);
    return existing;
  }
  
  const newFollow: FollowState = {
    creatorId,
    auctionsNotify: 'off',
    preordersNotify: 'off',
    followedAt: new Date().toISOString(),
  };
  
  follows.push(newFollow);
  saveToStorage(STORAGE_KEY, follows);
  return newFollow;
};

export const unfollowCreator = (creatorId: string): void => {
  const follows = ensureSeedFollows();
  const filtered = follows.filter(f => f.creatorId !== creatorId);
  saveToStorage(STORAGE_KEY, filtered);
};

export const updateNotifyState = (
  creatorId: string,
  type: 'auctions' | 'preorders',
  state: NotifyState
): void => {
  const follows = ensureSeedFollows();
  const follow = follows.find(f => f.creatorId === creatorId);

  if (!follow) return;

  if (type === 'auctions') {
    follow.auctionsNotify = state;
  } else {
    follow.preordersNotify = state;
  }
  
  saveToStorage(STORAGE_KEY, follows);
};

export const blockCreator = (creatorId: string): void => {
  const follows = ensureSeedFollows();
  const follow = follows.find(f => f.creatorId === creatorId);

  if (follow) {
    follow.blocked = true;
  } else {
    follows.push({
      creatorId,
      auctionsNotify: 'off',
      preordersNotify: 'off',
      blocked: true,
      followedAt: new Date().toISOString(),
    });
  }
  
  saveToStorage(STORAGE_KEY, follows);
};

export const getPrivacySettings = (): PrivacySettings => {
  return loadFromStorage<PrivacySettings>(PRIVACY_KEY, { showNameInFollowers: false });
};

export const updatePrivacySettings = (settings: Partial<PrivacySettings>): void => {
  const current = getPrivacySettings();
  saveToStorage(PRIVACY_KEY, { ...current, ...settings });
};

export const getCreatorsWithNewContent = (): Creator[] => {
  const followed = getFollowedCreators();
  return followed.filter(c => c.newAuctions || c.newPreorders);
};

export const rankCreators = (creators: Creator[]): Creator[] => {
  return [...creators].sort((a, b) => {
    if (a.verified !== b.verified) return a.verified ? -1 : 1;
    if (a.onTimePct !== b.onTimePct) return b.onTimePct - a.onTimePct;
    return b.closedDeals60d - a.closedDeals60d;
  });
};

export const getFollowerPreviews = (creatorId: string) => {
  return CREATOR_FOLLOWERS[creatorId] ?? DEFAULT_FOLLOWER_PREVIEWS;
};

export const getBuyerFollowers = (): BuyerFollower[] => {
  return BUYER_FOLLOWERS;
};
