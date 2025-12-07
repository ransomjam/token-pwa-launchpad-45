import { nanoid } from 'nanoid';

export type DealStatus = 
  | 'DRAFT' 
  | 'SENT' 
  | 'PAID' 
  | 'ESCROW_HELD' 
  | 'READY' 
  | 'RELEASED' 
  | 'REFUNDED' 
  | 'CANCELLED' 
  | 'EXPIRED';

export type DealHandover = 'CENTRE' | 'DELIVERY';

export type DealActor = 'DEALER' | 'BUYER' | 'AGENT';

export type DealEvent = {
  ts: string;
  actor: DealActor;
  action: string;
};

export type Deal = {
  id: string;
  title: string;
  qty: number;
  priceXAF: number;
  buyerName: string;
  buyerPhone: string;
  handover: DealHandover;
  pickupCenterId?: string;
  pickupCentreName?: string;
  pickupCentreAddress?: string;
  notes?: string;
  status: DealStatus;
  otpCode: string;
  qrValue: string;
  events: DealEvent[];
  createdAt: string;
  updatedAt: string;
  invoiceNo?: string;
  quotationNo?: string;
};

export type DealInvoice = {
  id: string;
  dealId: string;
  invoiceNo: string;
  title: string;
  createdAt: string;
};

export type DealQuotation = {
  id: string;
  dealId: string;
  quotationNo: string;
  title: string;
  createdAt: string;
};

export type DemoUser = {
  id: string;
  email: string;
  role: DealActor;
};

const STORAGE_KEY_DEALS = 'prolist:deals';
const STORAGE_KEY_DEMO_USERS = 'prolist:deals:demo-users';

export const DEALS_UPDATED_EVENT = 'deals:updated';

const DEMO_USERS: DemoUser[] = [
  { id: 'demo-seller', email: 'demo-seller@prolist.dev', role: 'DEALER' },
  { id: 'demo-buyer', email: 'demo-buyer@prolist.dev', role: 'BUYER' },
  { id: 'demo-agent', email: 'demo-agent@prolist.dev', role: 'AGENT' },
];

const SEED_DEALS: Deal[] = [
  {
    id: 'deal-demo-1',
    title: 'Wireless Gaming Mouse (RGB)',
    qty: 2,
    priceXAF: 12500,
    buyerName: 'Sophie Kamdem',
    buyerPhone: '+237 6XX XXX 234',
    handover: 'CENTRE',
    pickupCenterId: 'hub-akwa',
    pickupCentreName: 'Akwa Pickup Hub',
    pickupCentreAddress: 'Commercial Avenue, Douala',
    notes: 'Please confirm availability before pickup',
    status: 'RELEASED',
    otpCode: '123456',
    qrValue: 'deal-demo-1:123456',
    invoiceNo: 'INV-DEAL-001',
    quotationNo: 'QUO-DEAL-001',
    events: [
      { ts: '2025-07-10T09:00:00Z', actor: 'DEALER', action: 'Created deal' },
      { ts: '2025-07-10T09:15:00Z', actor: 'DEALER', action: 'Sent quotation' },
      { ts: '2025-07-10T14:30:00Z', actor: 'BUYER', action: 'Confirmed & paid' },
      { ts: '2025-07-12T10:00:00Z', actor: 'AGENT', action: 'Released to buyer' },
    ],
    createdAt: '2025-07-10T09:00:00Z',
    updatedAt: '2025-07-12T10:00:00Z',
  },
  {
    id: 'deal-demo-2',
    title: 'Portable Bluetooth Speaker',
    qty: 1,
    priceXAF: 18900,
    buyerName: 'Jean Mbarga',
    buyerPhone: '+237 6XX XXX 567',
    handover: 'CENTRE',
    pickupCenterId: 'hub-biyem',
    pickupCentreName: 'Biyem-Assi Hub',
    pickupCentreAddress: 'Rue des Palmiers, Yaoundé',
    status: 'READY',
    otpCode: '789012',
    qrValue: 'deal-demo-2:789012',
    invoiceNo: 'INV-DEAL-002',
    quotationNo: 'QUO-DEAL-002',
    events: [
      { ts: '2025-07-15T10:00:00Z', actor: 'DEALER', action: 'Created deal' },
      { ts: '2025-07-15T10:30:00Z', actor: 'DEALER', action: 'Sent quotation' },
      { ts: '2025-07-15T16:00:00Z', actor: 'BUYER', action: 'Confirmed & paid' },
      { ts: '2025-07-16T09:00:00Z', actor: 'AGENT', action: 'Marked ready for pickup' },
    ],
    createdAt: '2025-07-15T10:00:00Z',
    updatedAt: '2025-07-16T09:00:00Z',
  },
  {
    id: 'deal-demo-3',
    title: 'USB-C Fast Charger (65W)',
    qty: 3,
    priceXAF: 8500,
    buyerName: 'Marie Ngo',
    buyerPhone: '+237 6XX XXX 890',
    handover: 'CENTRE',
    pickupCenterId: 'hub-akwa',
    pickupCentreName: 'Akwa Pickup Hub',
    pickupCentreAddress: 'Commercial Avenue, Douala',
    status: 'SENT',
    otpCode: '345678',
    qrValue: 'deal-demo-3:345678',
    quotationNo: 'QUO-DEAL-003',
    events: [
      { ts: '2025-07-18T11:00:00Z', actor: 'DEALER', action: 'Created deal' },
      { ts: '2025-07-18T11:20:00Z', actor: 'DEALER', action: 'Sent quotation' },
    ],
    createdAt: '2025-07-18T11:00:00Z',
    updatedAt: '2025-07-18T11:20:00Z',
  },
];

export const loadDeals = (): Deal[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DEALS);
    if (stored) {
      return JSON.parse(stored);
    }
    return SEED_DEALS;
  } catch {
    return SEED_DEALS;
  }
};

export const saveDeals = (deals: Deal[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY_DEALS, JSON.stringify(deals));
    window.dispatchEvent(new Event(DEALS_UPDATED_EVENT));
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error('Failed to save deals', error);
  }
};

export const getDealById = (id: string): Deal | null => {
  const deals = loadDeals();
  return deals.find(d => d.id === id) || null;
};

export const createDeal = (data: {
  title: string;
  qty: number;
  priceXAF: number;
  buyerName: string;
  buyerPhone: string;
  handover: DealHandover;
  pickupCenterId?: string;
  pickupCentreName?: string;
  pickupCentreAddress?: string;
  notes?: string;
}): Deal => {
  const id = `deal-${nanoid(8)}`;
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const deal: Deal = {
    id,
    ...data,
    status: 'DRAFT',
    otpCode,
    qrValue: `${id}:${otpCode}`,
    events: [
      { ts: new Date().toISOString(), actor: 'DEALER', action: 'Created deal' },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const deals = loadDeals();
  deals.unshift(deal);
  saveDeals(deals);
  return deal;
};

export const updateDealStatus = (id: string, status: DealStatus, actor: DealActor, action: string): Deal | null => {
  const deals = loadDeals();
  const index = deals.findIndex(d => d.id === id);
  if (index === -1) return null;

  const deal = deals[index];
  deal.status = status;
  deal.updatedAt = new Date().toISOString();
  deal.events.push({
    ts: new Date().toISOString(),
    actor,
    action,
  });

  if (status === 'SENT' && !deal.quotationNo) {
    deal.quotationNo = `QUO-DEAL-${nanoid(6).toUpperCase()}`;
  }

  if (status === 'PAID' && !deal.invoiceNo) {
    deal.invoiceNo = `INV-DEAL-${nanoid(6).toUpperCase()}`;
  }

  deals[index] = deal;
  saveDeals(deals);
  return deal;
};

export const resetDealsDemo = (): void => {
  saveDeals(SEED_DEALS);
};

export const loadDemoUsers = (): DemoUser[] => {
  return DEMO_USERS;
};

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
