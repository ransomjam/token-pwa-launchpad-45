import type { Locale } from '@/context/I18nContext';

export type ShareContext = 'listing' | 'store';
export type ShareChannel = 'whatsapp' | 'copy' | 'system';
export type ListingShareTemplate = 'standard' | 'booster';

export type ShareUrls = {
  short: string;
  long: string;
};

export type ListingShareContent = {
  id: string;
  title: string;
  priceXAF: number;
  etaMin: number;
  etaMax: number;
  laneCode: string;
  onTimePct: number;
  committed: number;
  target: number;
  image: string;
  shareUrls: ShareUrls;
  isDemo?: boolean;
};

export type StoreShareContent = {
  id: string;
  storeName: string;
  avatarUrl?: string | null;
  avatarInitials?: string;
  onTimePct: number;
  disputePct: number;
  shareUrls: ShareUrls;
  isDemo?: boolean;
};

const CHANNEL_PARAM: Record<ShareChannel, string> = {
  whatsapp: 'wa',
  copy: 'cp',
  system: 'sys',
};

const CONTEXT_PARAM: Record<ShareContext, string> = {
  listing: 'lst',
  store: 'str',
};

const DEFAULT_ORIGIN = 'https://prolist.africa';

const stripSearch = (url: string) => {
  try {
    const value = new URL(url);
    value.search = '';
    value.hash = '';
    return value.toString();
  } catch {
    return url;
  }
};

const formatNumber = (value: number, locale: Locale) => {
  const formatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    maximumFractionDigits: 0,
  });
  return formatter.format(value).replace(/\u00A0/g, '\u202F');
};

const formatPrice = (value: number, locale: Locale) => `${formatNumber(value, locale)} XAF`;

const formatPercent = (value: number, locale: Locale) => {
  const pct = Math.round(value);
  return locale === 'fr' ? `${pct}\u00A0%` : `${pct}%`;
};

export const ensureAbsoluteUrl = (url: string | undefined | null) => {
  if (!url) {
    if (typeof window !== 'undefined') {
      return window.location.origin;
    }
    return DEFAULT_ORIGIN;
  }
  try {
    return new URL(url).toString();
  } catch {
    const origin = typeof window !== 'undefined' ? window.location.origin : DEFAULT_ORIGIN;
    return new URL(url, origin).toString();
  }
};

export const buildShareLink = (base: string, context: ShareContext, channel: ShareChannel) => {
  const absolute = ensureAbsoluteUrl(base);
  const url = new URL(absolute);
  url.searchParams.set('src', CHANNEL_PARAM[channel]);
  url.searchParams.set('ctx', CONTEXT_PARAM[context]);
  url.searchParams.set('t', Date.now().toString(36));
  return url.toString();
};

export const previewShareLink = (base: string) => stripSearch(ensureAbsoluteUrl(base));

export const isBoosterEligible = (listing: ListingShareContent) => {
  if (!listing.target) return false;
  return listing.committed / listing.target >= 0.8;
};

const listingTemplateEn = (
  listing: ListingShareContent,
  template: ListingShareTemplate,
  link: string,
  locale: Locale,
) => {
  if (template === 'booster' && isBoosterEligible(listing)) {
    const committed = formatNumber(listing.committed, locale);
    const target = formatNumber(listing.target, locale);
    return [
      `Almost there: ${committed}/${target} locked 🔒`,
      `ETA ${listing.etaMin}–${listing.etaMax} days • Escrow protected`,
      `Last spots: ${link}`,
    ].join('\n');
  }

  const price = formatPrice(listing.priceXAF, locale);
  const onTime = formatPercent(listing.onTimePct, locale);
  return [
    `ProList Mini • ${listing.title}`,
    `${price} • ETA ${listing.etaMin}–${listing.etaMax} days • ${listing.laneCode} ${onTime} on-time`,
    'Protected by Escrow • Auto-refund if late',
    `Join the pool: ${link}`,
  ].join('\n');
};

const listingTemplateFr = (
  listing: ListingShareContent,
  template: ListingShareTemplate,
  link: string,
  locale: Locale,
) => {
  if (template === 'booster' && isBoosterEligible(listing)) {
    const committed = formatNumber(listing.committed, locale);
    const target = formatNumber(listing.target, locale);
    return [
      `On y est presque : ${committed}/${target} validés 🔒`,
      `Délai ${listing.etaMin}–${listing.etaMax} jours • Paiement séquestré`,
      `Dernières places : ${link}`,
    ].join('\n');
  }

  const price = formatPrice(listing.priceXAF, locale);
  const onTime = formatPercent(listing.onTimePct, locale);
  return [
    `ProList Mini • ${listing.title}`,
    `${price} • Délai ${listing.etaMin}–${listing.etaMax} jours • ${listing.laneCode} ${onTime} ponctualité`,
    'Paiement séquestré • Remboursement automatique en cas de retard',
    `Rejoindre le panier : ${link}`,
  ].join('\n');
};

export const buildListingSharePreview = (
  listing: ListingShareContent,
  locale: Locale,
  template: ListingShareTemplate,
  useShortLink: boolean,
) => {
  const base = useShortLink ? listing.shareUrls.short : listing.shareUrls.long;
  const link = previewShareLink(base);
  const text = locale === 'fr'
    ? listingTemplateFr(listing, template, link, locale)
    : listingTemplateEn(listing, template, link, locale);
  return { text, link };
};

export const buildListingShareMessage = (
  listing: ListingShareContent,
  locale: Locale,
  template: ListingShareTemplate,
  channel: ShareChannel,
  useShortLink: boolean,
) => {
  const base = useShortLink ? listing.shareUrls.short : listing.shareUrls.long;
  const link = buildShareLink(base, 'listing', channel);
  const text = locale === 'fr'
    ? listingTemplateFr(listing, template, link, locale)
    : listingTemplateEn(listing, template, link, locale);
  return { text, link };
};

const storeTemplateEn = (store: StoreShareContent, link: string) => {
  const onTime = Math.round(store.onTimePct);
  const disputes = Math.round(store.disputePct);
  return [
    'Trusted seller on ProList Mini',
    `On-time last 60 days: ${onTime}% • Disputes: ${disputes}%`,
    'Escrow protection on every order',
    `See recent listings: ${link}`,
  ].join('\n');
};

const storeTemplateFr = (store: StoreShareContent, link: string) => {
  const onTime = Math.round(store.onTimePct);
  const disputes = Math.round(store.disputePct);
  return [
    'Vendeur fiable sur ProList Mini',
    `Ponctualité 60 jours : ${onTime}% • Litiges : ${disputes}%`,
    'Séquestre sur chaque commande',
    `Voir les annonces : ${link}`,
  ].join('\n');
};

export const buildStoreSharePreview = (
  store: StoreShareContent,
  locale: Locale,
  useShortLink: boolean,
) => {
  const base = useShortLink ? store.shareUrls.short : store.shareUrls.long;
  const link = previewShareLink(base);
  const text = locale === 'fr' ? storeTemplateFr(store, link) : storeTemplateEn(store, link);
  return { text, link };
};

export const buildStoreShareMessage = (
  store: StoreShareContent,
  locale: Locale,
  channel: ShareChannel,
  useShortLink: boolean,
) => {
  const base = useShortLink ? store.shareUrls.short : store.shareUrls.long;
  const link = buildShareLink(base, 'store', channel);
  const text = locale === 'fr' ? storeTemplateFr(store, link) : storeTemplateEn(store, link);
  return { text, link };
};
