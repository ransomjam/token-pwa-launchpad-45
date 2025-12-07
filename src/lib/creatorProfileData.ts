import { AUCTION_LISTINGS } from '@/lib/auctionData';
import { DEMO_LISTINGS } from '@/lib/demoMode';
import { PREORDER_CATALOG } from '@/lib/merchantData';
import { getCreatorById, getFollowerPreviews, type Creator } from '@/lib/followersData';

export type CreatorCardKind = 'auction' | 'listing' | 'preorder';

export type CreatorCardBase = {
  id: string;
  title: string;
  image: string;
  demo?: boolean;
};

export type CreatorAuctionCard = CreatorCardBase & {
  kind: 'auction';
  currentBidXAF: number;
  watchers?: number;
  timeLeftSec: number;
};

export type CreatorListingCard = CreatorCardBase & {
  kind: 'listing';
  priceXAF: number;
  etaDays: { min: number; max: number };
};

export type CreatorPreorderCard = CreatorCardBase & {
  kind: 'preorder';
  priceXAF: number;
  moq: { committed: number; target: number };
  lockAt: string;
  etaDays: { min: number; max: number };
};

export type CreatorOverviewCard =
  | CreatorAuctionCard
  | CreatorListingCard
  | CreatorPreorderCard;

export type CreatorProfileCopy = {
  taglineKey: string;
  storyKey: string;
  highlightKeys: string[];
  languageKeys: string[];
  categoryKeys: string[];
};

export type CreatorProfileData = {
  creator: Creator;
  copy: CreatorProfileCopy;
  overview: CreatorOverviewCard[];
  auctions: CreatorAuctionCard[];
  listings: CreatorListingCard[];
  preorders: CreatorPreorderCard[];
  followerPreviews: ReturnType<typeof getFollowerPreviews>;
};

const DEFAULT_CREATOR_ID = 'creator-nelly';

const FALLBACK_AUCTIONS: CreatorAuctionCard[] = [
  {
    kind: 'auction',
    id: 'demo-auction-spotlight',
    title: 'PlayStation 5 Slim + Extra Controller',
    image: '/demo/download-6.jfif',
    currentBidXAF: 345000,
    watchers: 19,
    timeLeftSec: 3600 * 10,
    demo: true,
  },
  {
    kind: 'auction',
    id: 'demo-auction-airpods',
    title: 'Apple AirPods Pro (2nd Gen)',
    image: '/demo/download-5.jfif',
    currentBidXAF: 215000,
    watchers: 11,
    timeLeftSec: 3600 * 6,
    demo: true,
  },
];

const FALLBACK_LISTINGS: CreatorListingCard[] = [
  {
    kind: 'listing',
    id: 'demo-listing-kettle',
    title: 'Stainless Steel Electric Kettle 1.7L',
    image: '/demo/download-4.jfif',
    priceXAF: 18500,
    etaDays: { min: 5, max: 7 },
    demo: true,
  },
  {
    kind: 'listing',
    id: 'demo-listing-juicer',
    title: 'Nutribest Slow Juicer 400W',
    image: '/demo/download-3.jfif',
    priceXAF: 64500,
    etaDays: { min: 7, max: 10 },
    demo: true,
  },
];

const FALLBACK_PREORDERS: CreatorPreorderCard[] = [
  {
    kind: 'preorder',
    id: 'demo-preorder-speaker',
    title: 'Portable Bluetooth Party Speaker',
    image: '/demo/download-2.jfif',
    priceXAF: 98500,
    moq: { committed: 18, target: 36 },
    lockAt: '2025-10-12T18:00:00Z',
    etaDays: { min: 18, max: 24 },
    demo: true,
  },
  {
    kind: 'preorder',
    id: 'demo-preorder-airfryer',
    title: 'Digital Air Fryer Oven 6.5L',
    image: '/demo/download-3.jfif',
    priceXAF: 68500,
    moq: { committed: 22, target: 40 },
    lockAt: '2025-10-20T18:00:00Z',
    etaDays: { min: 20, max: 28 },
    demo: true,
  },
];

const CREATOR_COPY_KEYS: Record<string, CreatorProfileCopy> = {
  'creator-nelly': {
    taglineKey: 'creator.taglines.nelly',
    storyKey: 'creator.story.nelly',
    highlightKeys: [
      'creator.highlights.nelly.quality',
      'creator.highlights.nelly.bulk',
      'creator.highlights.nelly.aftercare',
    ],
    languageKeys: ['creator.languages.english', 'creator.languages.french'],
    categoryKeys: ['creator.categories.electronics', 'creator.categories.accessories'],
  },
  'creator-techplus': {
    taglineKey: 'creator.taglines.techplus',
    storyKey: 'creator.story.techplus',
    highlightKeys: [
      'creator.highlights.techplus.partnerships',
      'creator.highlights.techplus.speed',
      'creator.highlights.techplus.support',
    ],
    languageKeys: ['creator.languages.english', 'creator.languages.french'],
    categoryKeys: ['creator.categories.electronics', 'creator.categories.smartHome'],
  },
  'creator-beauty': {
    taglineKey: 'creator.taglines.beauty',
    storyKey: 'creator.story.beauty',
    highlightKeys: [
      'creator.highlights.beauty.shades',
      'creator.highlights.beauty.certified',
      'creator.highlights.beauty.retailers',
    ],
    languageKeys: ['creator.languages.english', 'creator.languages.french'],
    categoryKeys: ['creator.categories.beauty', 'creator.categories.wellness'],
  },
  'creator-home': {
    taglineKey: 'creator.taglines.home',
    storyKey: 'creator.story.home',
    highlightKeys: [
      'creator.highlights.home.kitchen',
      'creator.highlights.home.service',
      'creator.highlights.home.brands',
    ],
    languageKeys: ['creator.languages.english', 'creator.languages.french'],
    categoryKeys: ['creator.categories.home', 'creator.categories.kitchen'],
  },
  'creator-fashion': {
    taglineKey: 'creator.taglines.fashion',
    storyKey: 'creator.story.fashion',
    highlightKeys: [
      'creator.highlights.fashion.curated',
      'creator.highlights.fashion.limited',
      'creator.highlights.fashion.tailored',
    ],
    languageKeys: ['creator.languages.english', 'creator.languages.french'],
    categoryKeys: ['creator.categories.fashion', 'creator.categories.accessories'],
  },
  'creator-kids': {
    taglineKey: 'creator.taglines.kids',
    storyKey: 'creator.story.kids',
    highlightKeys: [
      'creator.highlights.kids.educational',
      'creator.highlights.kids.safety',
      'creator.highlights.kids.parents',
    ],
    languageKeys: ['creator.languages.english', 'creator.languages.french'],
    categoryKeys: ['creator.categories.kids', 'creator.categories.toys'],
  },
  'creator-sports': {
    taglineKey: 'creator.taglines.sports',
    storyKey: 'creator.story.sports',
    highlightKeys: [
      'creator.highlights.sports.performance',
      'creator.highlights.sports.teamwear',
      'creator.highlights.sports.community',
    ],
    languageKeys: ['creator.languages.english', 'creator.languages.french'],
    categoryKeys: ['creator.categories.sports', 'creator.categories.fitness'],
  },
  'creator-wellness': {
    taglineKey: 'creator.taglines.wellness',
    storyKey: 'creator.story.wellness',
    highlightKeys: [
      'creator.highlights.wellness.organic',
      'creator.highlights.wellness.routines',
      'creator.highlights.wellness.partners',
    ],
    languageKeys: ['creator.languages.english', 'creator.languages.french'],
    categoryKeys: ['creator.categories.wellness', 'creator.categories.health'],
  },
};

const mapAuctions = (creatorId: string): CreatorAuctionCard[] =>
  AUCTION_LISTINGS.filter(auction => auction.seller.id === creatorId).map(auction => ({
    kind: 'auction',
    id: auction.id,
    title: auction.title,
    image: auction.images[0] ?? '/placeholder.svg',
    currentBidXAF: auction.currentBidXAF,
    watchers: auction.watchers,
    timeLeftSec: auction.timeLeftSec,
  }));

const mapListings = (creatorId: string): CreatorListingCard[] =>
  DEMO_LISTINGS.filter(listing => listing.importer.id === creatorId).map(listing => ({
    kind: 'listing',
    id: listing.id,
    title: listing.title,
    image: listing.images[0] ?? '/placeholder.svg',
    priceXAF: listing.priceXAF,
    etaDays: listing.etaDays,
  }));

const mapPreorders = (creatorId: string): CreatorPreorderCard[] =>
  PREORDER_CATALOG.filter(preorder => preorder.importer.id === creatorId).map(preorder => ({
    kind: 'preorder',
    id: preorder.id,
    title: preorder.title,
    image: preorder.images[0] ?? '/placeholder.svg',
    priceXAF: preorder.priceXAF,
    moq: preorder.moq,
    lockAt: preorder.lockAt,
    etaDays: { min: preorder.lane?.medianDays ?? 14, max: (preorder.lane?.medianDays ?? 14) + 6 },
  }));

const withFallback = <T extends CreatorOverviewCard>(
  items: T[],
  fallback: T[],
): { items: T[]; usedFallback: boolean } => {
  if (items.length > 0) {
    return { items, usedFallback: false };
  }
  return { items: fallback.slice(0, 2), usedFallback: true };
};

export const getCreatorProfileData = (id: string): CreatorProfileData => {
  const creator = getCreatorById(id) ?? getCreatorById(DEFAULT_CREATOR_ID);
  const resolvedId = creator?.id ?? DEFAULT_CREATOR_ID;
  const copy = CREATOR_COPY_KEYS[resolvedId] ?? CREATOR_COPY_KEYS[DEFAULT_CREATOR_ID];

  const auctionsResult = withFallback(mapAuctions(resolvedId), FALLBACK_AUCTIONS);
  const listingsResult = withFallback(mapListings(resolvedId), FALLBACK_LISTINGS);
  const preordersResult = withFallback(mapPreorders(resolvedId), FALLBACK_PREORDERS);

  const overviewCandidates: CreatorOverviewCard[] = [
    ...auctionsResult.items.slice(0, 2),
    ...listingsResult.items.slice(0, 2),
    ...preordersResult.items.slice(0, 2),
  ];

  const overview = overviewCandidates.length > 0 ? overviewCandidates : FALLBACK_LISTINGS.slice(0, 2);

  return {
    creator: creator ?? (getCreatorById(DEFAULT_CREATOR_ID) as Creator),
    copy,
    overview,
    auctions: auctionsResult.items,
    listings: listingsResult.items,
    preorders: preordersResult.items,
    followerPreviews: getFollowerPreviews(resolvedId),
  };
};

