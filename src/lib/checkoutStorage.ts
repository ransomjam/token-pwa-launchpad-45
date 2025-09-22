export type CheckoutPaymentMethod = 'mtn' | 'orange';

export type CheckoutDraft = {
  listingId: string;
  qty: number;
  pickupPointId?: string;
  paymentMethod?: CheckoutPaymentMethod;
};

const CHECKOUT_STATE_KEY = 'pl.checkout.state';
const LAST_PAYMENT_KEY = 'pl.checkout.payment';
const LAST_PICKUP_KEY = 'pl.checkout.pickup';

const safeParse = <T>(value: string | null): T | null => {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.warn('Failed to parse stored value', error);
    return null;
  }
};

export const getCheckoutDraft = (): CheckoutDraft | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(CHECKOUT_STATE_KEY);
  return safeParse<CheckoutDraft>(raw);
};

export const setCheckoutDraft = (draft: CheckoutDraft) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(CHECKOUT_STATE_KEY, JSON.stringify(draft));
};

export const clearCheckoutDraft = () => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(CHECKOUT_STATE_KEY);
};

export const getLastPaymentMethod = (): CheckoutPaymentMethod | null => {
  if (typeof window === 'undefined') return null;
  const value = window.localStorage.getItem(LAST_PAYMENT_KEY);
  return value === 'mtn' || value === 'orange' ? value : null;
};

export const setLastPaymentMethod = (method: CheckoutPaymentMethod) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_PAYMENT_KEY, method);
};

export const getLastPickupId = (): string | null => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LAST_PICKUP_KEY);
};

export const setLastPickupId = (pickupId: string) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LAST_PICKUP_KEY, pickupId);
};

export const checkoutStorageKeys = {
  draft: CHECKOUT_STATE_KEY,
  payment: LAST_PAYMENT_KEY,
  pickup: LAST_PICKUP_KEY,
} as const;
