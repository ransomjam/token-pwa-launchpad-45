import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
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

export type DealActor = 'DEALER' | 'BUYER' | 'AGENT';

export type DealEvent = {
  ts: number;
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
  buyerEmail: string;
  handover: 'CENTRE' | 'DELIVERY';
  pickupCenterId?: string;
  pickupCenterName?: string;
  pickupCenterAddress?: string;
  notes?: string;
  imageUrls: string[];
  status: DealStatus;
  otpCode: string;
  qrValue: string;
  quotationNo?: string;
  invoiceNo?: string;
  orderId?: string;
  createdAt: number;
  updatedAt: number;
  events: DealEvent[];
};

export type DemoUsers = {
  seller: { email: string };
  buyer: { email: string };
  agent: { email: string };
  buyersList: DemoBuyer[];
};

export type DemoBuyer = {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatarUrl: string;
};

export type DealInvoiceRecord = {
  invoiceNo: string;
  dealId: string;
  orderId: string;
  createdAt: number;
  status: DealStatus;
  title: string;
  totalXAF: number;
  buyerName: string;
  otpCode: string;
  qrValue: string;
};

type DealsStoreState = {
  deals: Deal[];
  demoUsers: DemoUsers;
  invoices: DealInvoiceRecord[];
};

type DraftPayload = {
  title: string;
  qty: number;
  priceXAF: number;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  handover: 'CENTRE' | 'DELIVERY';
  pickupCenterId?: string;
  pickupCenterName?: string;
  pickupCenterAddress?: string;
  notes?: string;
  imageUrls?: string[];
};

type DealsStoreActions = {
  createDraft: (payload: DraftPayload) => Deal;
  generateQuotation: (dealId: string) => Deal | null;
  sendToDemoBuyer: (dealId: string) => Deal | null;
  confirmByBuyer: (dealId: string) => Deal | null;
  payDemoSuccess: (dealId: string) => Deal | null;
  payDemoFail: (dealId: string) => Deal | null;
  markReady: (dealId: string) => Deal | null;
  confirmHandover: (dealId: string) => Deal | null;
  markReleased: (dealId: string) => Deal | null;
  resetDemo: () => void;
};

type DealsStoreValue = DealsStoreState & DealsStoreActions;

const DealsStoreContext = createContext<DealsStoreValue | null>(null);

const randomOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

const now = () => Date.now();

const createDealFromPayload = (payload: DraftPayload): Deal => {
  const id = `deal-${nanoid(8)}`;
  const otpCode = randomOtp();
  const createdAt = now();
  return {
    id,
    title: payload.title,
    qty: payload.qty,
    priceXAF: payload.priceXAF,
    buyerName: payload.buyerName,
    buyerPhone: payload.buyerPhone,
    buyerEmail: payload.buyerEmail,
    handover: payload.handover,
    pickupCenterId: payload.pickupCenterId,
    pickupCenterName: payload.pickupCenterName,
    pickupCenterAddress: payload.pickupCenterAddress,
    notes: payload.notes,
    imageUrls: payload.imageUrls?.length ? payload.imageUrls : [],
    status: 'DRAFT',
    otpCode,
    qrValue: `${id}:${otpCode}`,
    createdAt,
    updatedAt: createdAt,
    quotationNo: undefined,
    invoiceNo: undefined,
    orderId: undefined,
    events: [
      {
        ts: createdAt,
        actor: 'DEALER',
        action: 'Created draft',
      },
    ],
  };
};

const DEMO_BUYERS: DemoBuyer[] = [
  {
    id: 'demo-buyer-sophie',
    name: 'Sophie Kamdem',
    email: 'sophie.kamdem@prolist.dev',
    phone: '+237 650 123 234',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'demo-buyer-jean',
    name: 'Jean Mbarga',
    email: 'jean.mbarga@prolist.dev',
    phone: '+237 651 456 567',
    avatarUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'demo-buyer-marie',
    name: 'Marie Ngo',
    email: 'marie.ngo@prolist.dev',
    phone: '+237 652 789 890',
    avatarUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=160&q=80',
  },
  {
    id: 'demo-buyer-ida',
    name: 'Ida Ekali',
    email: 'ida.ekali@prolist.dev',
    phone: '+237 653 987 765',
    avatarUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=160&q=80&sat=-20',
  },
];

const DEMO_USERS: DemoUsers = {
  seller: { email: 'demo-seller@prolist.dev' },
  buyer: { email: 'demo-buyer@prolist.dev' },
  agent: { email: 'demo-agent@prolist.dev' },
  buyersList: DEMO_BUYERS,
};

const seedDeal = (
  overrides: Partial<Deal>,
  events: DealEvent[],
): Deal => {
  const base = createDealFromPayload({
    title: overrides.title ?? 'Demo item',
    qty: overrides.qty ?? 1,
    priceXAF: overrides.priceXAF ?? 10000,
    buyerName: overrides.buyerName ?? 'Demo Buyer',
    buyerPhone: overrides.buyerPhone ?? '+237 6XX XXX XXX',
    buyerEmail: overrides.buyerEmail ?? 'demo-buyer@prolist.dev',
    handover: overrides.handover ?? 'CENTRE',
    pickupCenterId: overrides.pickupCenterId,
    pickupCenterName: overrides.pickupCenterName,
    pickupCenterAddress: overrides.pickupCenterAddress,
    notes: overrides.notes,
    imageUrls: overrides.imageUrls ?? [],
  });

  const mergedEvents = events.map(event => ({ ...event }));
  const firstEventTs = mergedEvents[0]?.ts ?? base.createdAt;
  return {
    ...base,
    ...overrides,
    events: mergedEvents,
    createdAt: firstEventTs,
    updatedAt: mergedEvents[mergedEvents.length - 1]?.ts ?? firstEventTs,
  };
};

const SEED_DEALS: Deal[] = [
  seedDeal(
    {
      id: 'deal-demo-1',
      title: 'Wireless Gaming Mouse (RGB)',
      qty: 2,
      priceXAF: 12500,
      buyerName: 'Sophie Kamdem',
      buyerPhone: '+237 6XX XXX 234',
      buyerEmail: 'sophie.kamdem@prolist.dev',
      pickupCenterId: 'hub-akwa',
      pickupCenterName: 'Akwa Pickup Hub',
      pickupCenterAddress: 'Commercial Avenue, Douala',
      status: 'RELEASED',
      quotationNo: 'QUO-DEAL-001',
      invoiceNo: 'INV-DEAL-001',
      orderId: 'ORD-DEAL-001',
      otpCode: '123456',
      qrValue: 'deal-demo-1:123456',
      imageUrls: [
        'https://images.unsplash.com/photo-1585386959984-a4155228ef44?auto=format&fit=crop&w=640&q=80',
        'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=640&q=80',
      ],
    },
    [
      { ts: Date.parse('2025-07-10T09:00:00Z'), actor: 'DEALER', action: 'Created draft' },
      { ts: Date.parse('2025-07-10T09:05:00Z'), actor: 'DEALER', action: 'Generated quotation' },
      { ts: Date.parse('2025-07-10T09:15:00Z'), actor: 'DEALER', action: 'Sent to buyer' },
      { ts: Date.parse('2025-07-10T14:30:00Z'), actor: 'BUYER', action: 'Buyer confirmed & paid' },
      { ts: Date.parse('2025-07-11T08:45:00Z'), actor: 'DEALER', action: 'Marked ready for pickup' },
      { ts: Date.parse('2025-07-12T10:00:00Z'), actor: 'AGENT', action: 'Released to buyer' },
    ],
  ),
  seedDeal(
    {
      id: 'deal-demo-2',
      title: 'Portable Bluetooth Speaker',
      qty: 1,
      priceXAF: 18900,
      buyerName: 'Jean Mbarga',
      buyerPhone: '+237 6XX XXX 567',
      buyerEmail: 'jean.mbarga@prolist.dev',
      pickupCenterId: 'hub-biyem',
      pickupCenterName: 'Biyem-Assi Hub',
      pickupCenterAddress: 'Rue des Palmiers, Yaoundé',
      status: 'READY',
      quotationNo: 'QUO-DEAL-002',
      invoiceNo: 'INV-DEAL-002',
      orderId: 'ORD-DEAL-002',
      otpCode: '789012',
      qrValue: 'deal-demo-2:789012',
      imageUrls: [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=640&q=80',
      ],
    },
    [
      { ts: Date.parse('2025-07-15T10:00:00Z'), actor: 'DEALER', action: 'Created draft' },
      { ts: Date.parse('2025-07-15T10:05:00Z'), actor: 'DEALER', action: 'Generated quotation' },
      { ts: Date.parse('2025-07-15T10:30:00Z'), actor: 'DEALER', action: 'Sent to buyer' },
      { ts: Date.parse('2025-07-15T16:00:00Z'), actor: 'BUYER', action: 'Buyer confirmed & paid' },
      { ts: Date.parse('2025-07-16T09:00:00Z'), actor: 'AGENT', action: 'Marked ready for pickup' },
    ],
  ),
  seedDeal(
    {
      id: 'deal-demo-3',
      title: 'USB-C Fast Charger (65W)',
      qty: 3,
      priceXAF: 8500,
      buyerName: 'Marie Ngo',
      buyerPhone: '+237 6XX XXX 890',
      buyerEmail: 'marie.ngo@prolist.dev',
      pickupCenterId: 'hub-akwa',
      pickupCenterName: 'Akwa Pickup Hub',
      pickupCenterAddress: 'Commercial Avenue, Douala',
      status: 'SENT',
      quotationNo: 'QUO-DEAL-003',
      otpCode: '345678',
      qrValue: 'deal-demo-3:345678',
      imageUrls: [
        'https://images.unsplash.com/photo-1580894908361-967195033215?auto=format&fit=crop&w=640&q=80',
      ],
    },
    [
      { ts: Date.parse('2025-07-18T11:00:00Z'), actor: 'DEALER', action: 'Created draft' },
      { ts: Date.parse('2025-07-18T11:10:00Z'), actor: 'DEALER', action: 'Generated quotation' },
      { ts: Date.parse('2025-07-18T11:20:00Z'), actor: 'DEALER', action: 'Sent to buyer' },
    ],
  ),
];

const buildInvoiceRecord = (deal: Deal): DealInvoiceRecord | null => {
  if (!deal.invoiceNo || !deal.orderId) return null;
  return {
    invoiceNo: deal.invoiceNo,
    dealId: deal.id,
    orderId: deal.orderId,
    createdAt: deal.updatedAt,
    status: deal.status,
    title: deal.title,
    totalXAF: deal.qty * deal.priceXAF,
    buyerName: deal.buyerName,
    otpCode: deal.otpCode,
    qrValue: deal.qrValue,
  };
};

const computeInvoices = (deals: Deal[]): DealInvoiceRecord[] => {
  return deals
    .map(buildInvoiceRecord)
    .filter((invoice): invoice is DealInvoiceRecord => Boolean(invoice));
};

export const DealsStoreProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<DealsStoreState>({
    deals: SEED_DEALS,
    demoUsers: DEMO_USERS,
    invoices: computeInvoices(SEED_DEALS),
  });

  const updateDeal = useCallback((dealId: string, updater: (deal: Deal) => Deal): Deal | null => {
    let updatedDeal: Deal | null = null;
    setState(prev => {
      const index = prev.deals.findIndex(item => item.id === dealId);
      if (index === -1) {
        return prev;
      }
      const deals = [...prev.deals];
      const nextDeal = updater({ ...deals[index] });
      deals[index] = nextDeal;
      updatedDeal = nextDeal;
      return {
        ...prev,
        deals,
        invoices: computeInvoices(deals),
      };
    });
    return updatedDeal;
  }, []);

  const pushDeal = useCallback((deal: Deal) => {
    setState(prev => {
      const deals = [deal, ...prev.deals];
      return {
        ...prev,
        deals,
        invoices: computeInvoices(deals),
      };
    });
  }, []);

  const createDraft = useCallback<DealsStoreActions['createDraft']>(payload => {
    const deal = createDealFromPayload(payload);
    pushDeal(deal);
    return deal;
  }, [pushDeal]);

  const appendEvent = (deal: Deal, actor: DealActor, action: string): Deal => {
    const ts = now();
    return {
      ...deal,
      updatedAt: ts,
      events: [...deal.events, { ts, actor, action }],
    };
  };

  const generateQuotation: DealsStoreActions['generateQuotation'] = useCallback(dealId => {
    return updateDeal(dealId, deal => {
      if (!deal.quotationNo) {
        deal.quotationNo = `QUO-${deal.id.replace('deal-', '').toUpperCase()}`;
      }
      return appendEvent(deal, 'DEALER', 'Generated quotation');
    });
  }, [updateDeal]);

  const sendToDemoBuyer: DealsStoreActions['sendToDemoBuyer'] = useCallback(dealId => {
    return updateDeal(dealId, deal => {
      const next = appendEvent(deal, 'DEALER', 'Sent to buyer');
      next.status = 'SENT';
      return next;
    });
  }, [updateDeal]);

  const confirmByBuyer: DealsStoreActions['confirmByBuyer'] = useCallback(dealId => {
    return updateDeal(dealId, deal => {
      const next = appendEvent(deal, 'BUYER', 'Buyer confirmed');
      next.status = 'PAID';
      return next;
    });
  }, [updateDeal]);

  const payDemoSuccess: DealsStoreActions['payDemoSuccess'] = useCallback(dealId => {
    return updateDeal(dealId, deal => {
      const next = appendEvent(deal, 'BUYER', 'Payment successful (escrow held)');
      next.status = 'ESCROW_HELD';
      next.invoiceNo = next.invoiceNo ?? `INV-${deal.id.replace('deal-', '').toUpperCase()}`;
      next.orderId = next.orderId ?? `ORD-${deal.id.replace('deal-', '').toUpperCase()}`;
      return next;
    });
  }, [updateDeal]);

  const payDemoFail: DealsStoreActions['payDemoFail'] = useCallback(dealId => {
    return updateDeal(dealId, deal => {
      const next = appendEvent(deal, 'BUYER', 'Payment failed');
      next.status = 'SENT';
      return next;
    });
  }, [updateDeal]);

  const markReady: DealsStoreActions['markReady'] = useCallback(dealId => {
    return updateDeal(dealId, deal => {
      const next = appendEvent(deal, 'DEALER', 'Marked ready for pickup');
      next.status = 'READY';
      return next;
    });
  }, [updateDeal]);

  const confirmHandover: DealsStoreActions['confirmHandover'] = useCallback(dealId => {
    return updateDeal(dealId, deal => {
      const next = appendEvent(deal, 'AGENT', 'Handover confirmed');
      next.status = 'READY';
      return next;
    });
  }, [updateDeal]);

  const markReleased: DealsStoreActions['markReleased'] = useCallback(dealId => {
    return updateDeal(dealId, deal => {
      const next = appendEvent(deal, 'AGENT', 'Released to buyer');
      next.status = 'RELEASED';
      return next;
    });
  }, [updateDeal]);

  const resetDemo = useCallback(() => {
    setState({
      deals: SEED_DEALS,
      demoUsers: DEMO_USERS,
      invoices: computeInvoices(SEED_DEALS),
    });
  }, []);

  const value = useMemo<DealsStoreValue>(() => ({
    ...state,
    createDraft,
    generateQuotation,
    sendToDemoBuyer,
    confirmByBuyer,
    payDemoSuccess,
    payDemoFail,
    markReady,
    confirmHandover,
    markReleased,
    resetDemo,
  }), [
    state,
    confirmByBuyer,
    confirmHandover,
    createDraft,
    generateQuotation,
    markReady,
    markReleased,
    payDemoFail,
    payDemoSuccess,
    resetDemo,
    sendToDemoBuyer,
  ]);

  return <DealsStoreContext.Provider value={value}>{children}</DealsStoreContext.Provider>;
};

export const useDealsStore = () => {
  const ctx = useContext(DealsStoreContext);
  if (!ctx) {
    throw new Error('useDealsStore must be used within DealsStoreProvider');
  }
  return ctx;
};

