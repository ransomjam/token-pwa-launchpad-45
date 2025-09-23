import { differenceInDays, differenceInHours } from 'date-fns';
import type { ListingSummary } from '@/types';
import { DEMO_LISTINGS } from './demoMode';

type LaneSignal = 'green' | 'amber' | 'red';
export type ImporterListingStatus = 'collecting' | 'locked' | 'in_transit' | 'arrived';

export type ImporterListing = {
  id: string;
  title: string;
  priceXAF: number;
  image: string;
  status: ImporterListingStatus;
  moq: ListingSummary['moq'];
  etaDays: ListingSummary['etaDays'];
  lane: {
    code: string;
    mode: 'Air' | 'Sea' | 'Road' | 'Rail';
    label: string;
    onTimePct: number;
    medianDays: number;
    signal: LaneSignal;
  };
  buyersCount: number;
  updatedAt: string;
};

const MODE_LABELS: Record<ImporterListing['lane']['mode'], string> = {
  Air: 'Air',
  Sea: 'Sea',
  Road: 'Road',
  Rail: 'Rail',
};

function detectLaneMode(code: string): ImporterListing['lane']['mode'] {
  const upper = code.toUpperCase();
  if (upper.includes('SEA')) return 'Sea';
  if (upper.includes('AIR')) return 'Air';
  if (upper.includes('RAIL')) return 'Rail';
  return 'Road';
}

function laneSignal(onTimePct: number): LaneSignal {
  if (onTimePct >= 0.9) return 'green';
  if (onTimePct >= 0.75) return 'amber';
  return 'red';
}

function deriveStatus(listing: ListingSummary, now = new Date()): ImporterListingStatus {
  const lockAt = new Date(listing.moq.lockAt);
  const committedRatio = listing.moq.committed / listing.moq.target;
  if (Number.isFinite(committedRatio) && committedRatio < 1 && lockAt.getTime() > now.getTime()) {
    return 'collecting';
  }
  const daysSinceLock = differenceInDays(now, lockAt);
  if (daysSinceLock <= 1) {
    return 'locked';
  }
  if (daysSinceLock <= listing.lane.medianDays + 2) {
    return 'in_transit';
  }
  return 'arrived';
}

export function toImporterListing(listing: ListingSummary, now = new Date()): ImporterListing {
  const mode = detectLaneMode(listing.lane.code);
  const status = deriveStatus(listing, now);
  const buyersCount = Math.max(3, Math.round(listing.moq.committed / Math.max(1, Math.ceil(listing.moq.target / 12))));
  const label = `${listing.lane.code.split('-').slice(0, 2).join('→')} ${MODE_LABELS[mode]} • ${Math.round(listing.lane.onTimePct * 100)}%`;
  return {
    id: listing.id,
    title: listing.title,
    priceXAF: listing.priceXAF,
    image: listing.images[0] ?? '/placeholder.svg',
    status,
    moq: listing.moq,
    etaDays: listing.etaDays,
    lane: {
      code: listing.lane.code,
      mode,
      label,
      onTimePct: listing.lane.onTimePct,
      medianDays: listing.lane.medianDays,
      signal: laneSignal(listing.lane.onTimePct),
    },
    buyersCount,
    updatedAt: listing.createdAt,
  };
}

export const DEMO_IMPORTER_LISTINGS: ImporterListing[] = [
  {
    ...toImporterListing(DEMO_LISTINGS[0], new Date('2025-09-20T09:00:00Z')),
    status: 'collecting',
    buyersCount: 14,
  },
  {
    ...toImporterListing(DEMO_LISTINGS[1], new Date('2025-09-22T09:00:00Z')),
    status: 'locked',
    buyersCount: 18,
  },
  {
    ...toImporterListing(DEMO_LISTINGS[2], new Date('2025-09-26T09:00:00Z')),
    status: 'in_transit',
    buyersCount: 22,
  },
];

export type ImporterKpiId = 'onTime' | 'disputes' | 'reserve' | 'active';

export type ImporterKpi = {
  id: ImporterKpiId;
  value: string;
};

export function computeKpis(listings: ImporterListing[]): ImporterKpi[] {
  const activeListings = listings.filter(item => item.status !== 'arrived');
  const averageOnTime = listings.length
    ? listings.reduce((acc, item) => acc + item.lane.onTimePct, 0) / listings.length
    : 0.92;
  const disputeRate = Math.max(0.8, 2 - averageOnTime * 1.2);
  const reservePct = 10 + Math.max(0, (1 - averageOnTime) * 8);

  return [
    { id: 'onTime', value: `${Math.round(averageOnTime * 100)}%` },
    { id: 'disputes', value: `${disputeRate.toFixed(1)}%` },
    { id: 'reserve', value: `${reservePct.toFixed(0)}%` },
    { id: 'active', value: `${activeListings.length}` },
  ];
}

export function locksInCopy(lockAt: string, locale: string): string {
  const now = new Date();
  const lockDate = new Date(lockAt);
  const diffMs = lockDate.getTime() - now.getTime();
  if (!Number.isFinite(diffMs)) return '';
  if (diffMs <= 0) return locale === 'fr' ? 'Verrouillé' : 'Locked';
  const hours = Math.round(diffMs / 3600000);
  if (hours >= 48) {
    const days = Math.round(hours / 24);
    return locale === 'fr' ? `Verrouillage dans ${days} j` : `Locks in ${days} days`;
  }
  if (hours >= 1) {
    return locale === 'fr' ? `Verrouillage dans ${hours} h` : `Locks in ${hours} hours`;
  }
  const minutes = Math.max(1, Math.round(diffMs / 60000));
  return locale === 'fr' ? `Verrouillage dans ${minutes} min` : `Locks in ${minutes} minutes`;
}

export function statusLabel(status: ImporterListingStatus, locale: string): string {
  const map: Record<ImporterListingStatus, { en: string; fr: string }> = {
    collecting: { en: 'Collecting', fr: 'Collecte' },
    locked: { en: 'Locked', fr: 'Verrouillé' },
    in_transit: { en: 'In transit', fr: 'En transit' },
    arrived: { en: 'Arrived', fr: 'Arrivé' },
  };
  return map[status][locale === 'fr' ? 'fr' : 'en'];
}

export function statusTone(status: ImporterListingStatus): 'green' | 'amber' | 'blue' | 'slate' {
  switch (status) {
    case 'collecting':
      return 'blue';
    case 'locked':
      return 'amber';
    case 'in_transit':
      return 'green';
    case 'arrived':
    default:
      return 'slate';
  }
}

export function committedRatio(listing: ImporterListing): number {
  if (!listing.moq.target) return 0;
  return Math.min(1, listing.moq.committed / listing.moq.target);
}

export function hoursSinceLock(listing: ImporterListing): number {
  return differenceInHours(new Date(), new Date(listing.moq.lockAt));
}
