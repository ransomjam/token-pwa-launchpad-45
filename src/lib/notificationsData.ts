import { loadWithFallback, saveValue } from './storageHelpers';

const NOTIFICATIONS_EVENT = 'notifications:update';

const dispatchNotificationsUpdate = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT));
};

export type NotificationCategory = 
  | 'buying' | 'preorder' | 'selling' | 'merchant' | 'follows' | 'system';

export type NotificationChannel = 'inapp' | 'push' | 'email' | 'sms' | 'whatsapp';

export type NotificationEvent = 
  // Buying
  | 'outbid' | 'winning' | 'won' | 'arrival' | 'late_refund' | 'refund_issued' | 'dispute_update'
  // Preorder
  | 'pool_locked' | 'pool_failed' | 'pickup_reminder'
  // Selling
  | 'new_order' | 'dispute_needed' | 'ending_soon' | 'pool_near_moq'
  // Merchant
  | 'new_from_follows' | 'claim_confirmed' | 'commission_payout'
  // Follows
  | 'new_auction' | 'new_preorder' | 'follow_digest'
  // System
  | 'kyc_verified' | 'policy_update';

export interface Notification {
  id: string;
  category: NotificationCategory;
  event: NotificationEvent;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  ctaLabel?: string;
  ctaLink?: string;
  metadata?: Record<string, any>;
}

export interface NotificationSettings {
  channels: {
    inapp: boolean;
    push: boolean;
    email: boolean;
    sms: boolean;
    whatsapp: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string; // "21:00"
    end: string; // "07:00"
  };
  digest: 'off' | 'daily' | 'weekly';
  digestTime: string; // "09:00"
  categorySettings: Record<NotificationEvent, {
    enabled: boolean;
    channels: NotificationChannel[];
  }>;
  mutedCreators: string[];
  blockedCreators: string[];
}

const STORAGE_KEY_NOTIFICATIONS = 'prolist_notifications';
const STORAGE_KEY_SETTINGS = 'prolist_notification_settings';
const SEED_NOTIFICATION_ID = 'notification-seed';

// Demo seed data
const DEMO_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    category: 'buying',
    event: 'outbid',
    title: "You've been outbid",
    body: 'Silver Crest Stand Mixer — New bid: 45,000 XAF',
    timestamp: new Date(Date.now() - 3 * 60 * 1000).toISOString(),
    read: false,
    ctaLabel: 'View auction',
    ctaLink: '/auction/auction_1'
  },
  {
    id: 'n2',
    category: 'preorder',
    event: 'pool_locked',
    title: 'Pool locked',
    body: 'Wireless Lavalier Kit — Arriving in 12-16 days',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    read: false,
    ctaLabel: 'Track order',
    ctaLink: '/orders/ord_pre_1'
  },
  {
    id: 'n3',
    category: 'follows',
    event: 'new_auction',
    title: 'New auction',
    body: 'TechHub posted: Scanfrost Double Door Fridge',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: true,
    ctaLabel: 'View auction',
    ctaLink: '/auction/auction_2'
  },
  {
    id: 'n4',
    category: 'merchant',
    event: 'claim_confirmed',
    title: 'Claim confirmed',
    body: 'Steam Press Center is now live on your store',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: true,
    ctaLabel: 'View listing',
    ctaLink: '/merchant/reposts'
  },
  {
    id: 'n5',
    category: 'buying',
    event: 'arrival',
    title: 'Ready for pickup',
    body: 'Blue Airforce Shoes at Bonabéri Hub, until Dec 15',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    read: true,
    ctaLabel: 'Show QR',
    ctaLink: '/orders/ord_1/qr'
  },
  {
    id: 'n6',
    category: 'system',
    event: 'kyc_verified',
    title: 'Verified',
    body: 'Higher visibility unlocked for your listings',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    read: true
  }
];

const DEFAULT_SETTINGS: NotificationSettings = {
  channels: {
    inapp: true,
    push: false,
    email: false,
    sms: false,
    whatsapp: false
  },
  quietHours: {
    enabled: true,
    start: '21:00',
    end: '07:00'
  },
  digest: 'daily',
  digestTime: '09:00',
  categorySettings: {
    // Buying
    outbid: { enabled: true, channels: ['inapp', 'push'] },
    winning: { enabled: true, channels: ['inapp'] },
    won: { enabled: true, channels: ['inapp', 'push', 'whatsapp'] },
    arrival: { enabled: true, channels: ['inapp', 'push', 'sms'] },
    late_refund: { enabled: true, channels: ['inapp', 'push'] },
    refund_issued: { enabled: true, channels: ['inapp', 'email'] },
    dispute_update: { enabled: true, channels: ['inapp', 'push', 'email'] },
    // Preorder
    pool_locked: { enabled: true, channels: ['inapp', 'push', 'whatsapp'] },
    pool_failed: { enabled: true, channels: ['inapp', 'push', 'email'] },
    pickup_reminder: { enabled: true, channels: ['inapp', 'push', 'sms'] },
    // Selling
    new_order: { enabled: true, channels: ['inapp', 'push', 'whatsapp'] },
    dispute_needed: { enabled: true, channels: ['inapp', 'push', 'email'] },
    ending_soon: { enabled: true, channels: ['inapp', 'push'] },
    pool_near_moq: { enabled: true, channels: ['inapp', 'push'] },
    // Merchant
    new_from_follows: { enabled: true, channels: ['inapp'] },
    claim_confirmed: { enabled: true, channels: ['inapp', 'push'] },
    commission_payout: { enabled: true, channels: ['inapp', 'email'] },
    // Follows
    new_auction: { enabled: true, channels: ['inapp'] },
    new_preorder: { enabled: true, channels: ['inapp'] },
    follow_digest: { enabled: true, channels: ['inapp', 'email'] },
    // System
    kyc_verified: { enabled: true, channels: ['inapp', 'push', 'email'] },
    policy_update: { enabled: true, channels: ['inapp', 'email'] }
  },
  mutedCreators: [],
  blockedCreators: []
};

// Internal seed handling so the bell is always visible during demos
let seededNotification: Notification | null = null;

const createSeedNotification = (): Notification => ({
  id: SEED_NOTIFICATION_ID,
  category: 'system',
  event: 'policy_update',
  title: 'Stay tuned for updates',
  body: 'Activity from your auctions and orders will appear here soon.',
  timestamp: new Date().toISOString(),
  read: false,
  metadata: { seeded: true },
});

const getStoredNotifications = (): Notification[] => {
  const { data } = loadWithFallback(STORAGE_KEY_NOTIFICATIONS, DEMO_NOTIFICATIONS);
  return data;
};

const applySeed = (notifications: Notification[]): Notification[] => {
  if (notifications.length === 0) {
    if (!seededNotification) {
      seededNotification = createSeedNotification();
    }
    return seededNotification ? [seededNotification] : [];
  }

  if (seededNotification) {
    seededNotification = null;
  }

  return notifications;
};

const setStoredNotifications = (notifications: Notification[]) => {
  saveValue(STORAGE_KEY_NOTIFICATIONS, notifications);
  if (notifications.length > 0 && seededNotification) {
    seededNotification = null;
  }
  dispatchNotificationsUpdate();
};

// Load/save
export const getNotifications = (): Notification[] => {
  const stored = getStoredNotifications();
  return applySeed([...stored]);
};

export const saveNotifications = (notifications: Notification[]) => {
  const sanitized = notifications.filter(notification => !notification.metadata?.seeded);
  setStoredNotifications(sanitized);
};

export const getNotificationSettings = (): NotificationSettings => {
  const { data } = loadWithFallback(STORAGE_KEY_SETTINGS, DEFAULT_SETTINGS);
  return data;
};

export const saveNotificationSettings = (settings: NotificationSettings) => {
  saveValue(STORAGE_KEY_SETTINGS, settings);
};

// Utilities
export const getUnreadCount = (): number => {
  return getNotifications().filter(n => !n.read).length;
};

export type NotificationCounts = {
  unread: number;
  total: number;
  realTotal: number;
  hasSeed: boolean;
};

export const getNotificationCounts = (): NotificationCounts => {
  const notifications = getNotifications();
  const unread = notifications.filter(notification => !notification.read).length;
  const hasSeed = notifications.some(notification => notification.metadata?.seeded);
  const realTotal = hasSeed ? notifications.length - 1 : notifications.length;

  return {
    unread,
    total: notifications.length,
    realTotal,
    hasSeed,
  };
};

export const subscribeToNotificationUpdates = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  window.addEventListener(NOTIFICATIONS_EVENT, listener);

  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT, listener);
  };
};

export const markAsRead = (id: string) => {
  if (seededNotification && seededNotification.id === id) {
    seededNotification = { ...seededNotification, read: true };
    dispatchNotificationsUpdate();
    return;
  }

  const notifications = getStoredNotifications();
  const updated = notifications.map(notification =>
    notification.id === id ? { ...notification, read: true } : notification
  );
  setStoredNotifications(updated);
};

export const markAllAsRead = () => {
  if (seededNotification) {
    seededNotification = { ...seededNotification, read: true };
  }

  const notifications = getStoredNotifications();
  const updated = notifications.map(notification => ({ ...notification, read: true }));
  setStoredNotifications(updated);
};

export const clearAll = () => {
  seededNotification = createSeedNotification();
  setStoredNotifications([]);
};

export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
  const notifications = getStoredNotifications();
  const newNotification: Notification = {
    ...notification,
    id: `n_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    read: false
  };
  setStoredNotifications([newNotification, ...notifications]);
  return newNotification;
};

export const filterByCategory = (category: NotificationCategory | 'all'): Notification[] => {
  const notifications = getNotifications();
  if (category === 'all') return notifications;
  return notifications.filter(n => n.category === category);
};

export const isInQuietHours = (): boolean => {
  const settings = getNotificationSettings();
  if (!settings.quietHours.enabled) return false;

  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  const currentTime = hours * 60 + minutes;

  const [startH, startM] = settings.quietHours.start.split(':').map(Number);
  const [endH, endM] = settings.quietHours.end.split(':').map(Number);
  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;

  if (startTime < endTime) {
    return currentTime >= startTime && currentTime < endTime;
  } else {
    // Crosses midnight
    return currentTime >= startTime || currentTime < endTime;
  }
};

export const shouldShowRealtime = (event: NotificationEvent): boolean => {
  const settings = getNotificationSettings();
  const eventSettings = settings.categorySettings[event];
  
  if (!eventSettings || !eventSettings.enabled) return false;
  if (isInQuietHours()) return false;
  
  return true;
};

// Format relative time
export const formatRelativeTime = (timestamp: string, lang: 'en' | 'fr' = 'en'): string => {
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (lang === 'fr') {
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}j`;
  }

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m`;
  if (diffHours < 24) return `${diffHours}h`;
  return `${diffDays}d`;
};
