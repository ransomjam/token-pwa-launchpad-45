import type { OrderDetailResponse } from '@/types';

export type DemoOrderRecord = OrderDetailResponse & {
  listingId: string;
  pickupPointId?: string | null;
  createdAt: string;
};

type DemoOrderState = { orders: Record<string, DemoOrderRecord>; activeOrderId?: string };

const STORAGE_KEY = 'pl.demo.orders';

const emptyState = (): DemoOrderState => ({
  orders: {},
});

const parseState = (value: string | null): DemoOrderState => {
  if (!value) return emptyState();
  try {
    const parsed = JSON.parse(value) as {
      orders?: Record<string, DemoOrderRecord>;
      activeOrderId?: string;
    };
    if (!parsed || typeof parsed !== 'object') return emptyState();
    return {
      orders: parsed.orders && typeof parsed.orders === 'object' ? parsed.orders : {},
      activeOrderId: parsed.activeOrderId,
    };
  } catch (error) {
    console.warn('Failed to parse stored demo orders', error);
    return emptyState();
  }
};

const readState = (): DemoOrderState => {
  if (typeof window === 'undefined') return emptyState();
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return parseState(raw);
};

const writeState = (state: DemoOrderState) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

export const saveDemoOrder = (order: DemoOrderRecord) => {
  if (typeof window === 'undefined') return;
  const state = readState();
  state.orders[order.id] = order;
  state.activeOrderId = order.id;
  writeState(state);
};

export const getDemoOrder = (id: string): DemoOrderRecord | null => {
  if (typeof window === 'undefined') return null;
  const state = readState();
  const stored = state.orders[id];
  if (!stored) return null;
  const deadline = new Date(stored.countdown.deadline).getTime();
  const secondsLeft = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
  return {
    ...stored,
    countdown: {
      ...stored.countdown,
      secondsLeft,
    },
  };
};

export const getLastDemoOrderId = (): string | null => {
  if (typeof window === 'undefined') return null;
  const state = readState();
  return state.activeOrderId ?? null;
};

export const listDemoOrders = (): DemoOrderRecord[] => {
  if (typeof window === 'undefined') return [];
  const state = readState();
  return Object.values(state.orders)
    .map(order => {
      const deadline = new Date(order.countdown.deadline).getTime();
      const secondsLeft = Math.max(0, Math.floor((deadline - Date.now()) / 1000));
      return {
        ...order,
        countdown: {
          ...order.countdown,
          secondsLeft,
        },
      };
    })
    .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime());
};
