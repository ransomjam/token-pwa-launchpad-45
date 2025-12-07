export type MerchantResultTimeline = {
  label: string;
  at: string;
  description?: string;
};

export type MerchantResult = {
  id: string;
  title: string;
  type: 'auction' | 'direct';
  image: string;
  winner: { name: string; location: string };
  finalPriceXAF: number;
  ownerPayoutXAF: number;
  merchantCommissionXAF: number;
  merchantSharePercent?: number;
  settledAt: string;
  ownerName: string;
  summary: string;
  stats: { bids?: number; watchers?: number; repostClicks?: number; orders?: number };
  timeline: MerchantResultTimeline[];
};

const DEMO_RESULTS: MerchantResult[] = [
  {
    id: 'res_lst_rgb-led-strip',
    title: 'RGB Gaming LED Strip Kit (10m)',
    type: 'auction',
    image: '/demo/download-4.jfif',
    winner: { name: 'Estelle B.', location: 'Douala' },
    finalPriceXAF: 21500,
    ownerPayoutXAF: 18500,
    merchantCommissionXAF: 3000,
    merchantSharePercent: 16,
    settledAt: '2025-05-28T09:30:00Z',
    ownerName: 'GameZone',
    summary: 'Converted via Instagram story blast and WhatsApp VIP group push within 24h.',
    stats: { bids: 14, watchers: 19, repostClicks: 86 },
    timeline: [
      { label: 'Repost published', at: '2025-05-21 09:05' },
      { label: 'Highest bid placed', at: '2025-05-27 19:45', description: '₣21,500 mobile bid (auto-extend triggered)' },
      { label: 'Auction closed', at: '2025-05-27 20:00' },
      { label: 'Funds released to owner', at: '2025-05-28 09:30' },
    ],
  },
  {
    id: 'res_lst_wireless-clippers',
    title: 'Wireless Hair Clippers Set',
    type: 'direct',
    image: '/demo/download-5.jfif',
    winner: { name: 'Yannick M.', location: 'Yaoundé' },
    finalPriceXAF: 28000,
    ownerPayoutXAF: 24000,
    merchantCommissionXAF: 4000,
    merchantSharePercent: 14,
    settledAt: '2025-05-18T13:10:00Z',
    ownerName: 'Pro Groom Hub',
    summary: 'Bundle discount shared to Telegram grooming channel — order confirmed same afternoon.',
    stats: { orders: 1, repostClicks: 42 },
    timeline: [
      { label: 'Listing claimed', at: '2025-05-17 10:12' },
      { label: 'Direct order confirmed', at: '2025-05-17 16:48' },
      { label: 'Order collected', at: '2025-05-18 11:05' },
      { label: 'Commission released', at: '2025-05-18 13:10' },
    ],
  },
];

export const getMerchantResult = (id: string): MerchantResult => {
  const directMatch = DEMO_RESULTS.find(result => result.id === id);

  if (directMatch) {
    return directMatch;
  }

  const dynamicMatch = DEMO_RESULTS.find(result => id.includes(result.id));
  return dynamicMatch ?? DEMO_RESULTS[0];
};

export const listMerchantResults = () => DEMO_RESULTS;
