import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr as frLocale } from 'date-fns/locale';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  MapPin,
  MoreHorizontal,
  RefreshCw,
  Search,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from '@/components/ui/use-toast';
import { useI18n } from '@/context/I18nContext';
import { listDemoOrders, type DemoOrderRecord } from '@/lib/demoOrderStorage';
import { getDemoListingById } from '@/lib/demoMode';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import type { OrderStatus } from '@/types';

const defaultImage = '/demo/charger-front.svg';
const defaultPickupHub = 'Akwa Pickup Hub';

const statusColors: Record<Exclude<OrderFilter, 'all'>, string> = {
  in_transit: 'bg-sky-50 text-sky-700 border-sky-200',
  arrived: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  late: 'bg-amber-50 text-amber-800 border-amber-200',
  refunded: 'bg-slate-100 text-slate-700 border-slate-200',
};

const statusIcons: Record<Exclude<OrderFilter, 'all'>, LucideIcon> = {
  in_transit: Clock,
  arrived: MapPin,
  late: AlertTriangle,
  refunded: RefreshCw,
};

const miniLineColors: Record<Exclude<OrderFilter, 'all'>, string> = {
  in_transit: 'text-sky-600',
  arrived: 'text-emerald-600',
  late: 'text-amber-700',
  refunded: 'text-slate-600',
};

type OrderFilter = 'all' | 'in_transit' | 'arrived' | 'late' | 'refunded';

type PaymentState = 'escrow_held' | 'escrow_released' | 'refunded';

type DisplayOrder = {
  id: string;
  listingId?: string | null;
  title: string;
  image: string;
  quantity: number;
  unitPrice: number;
  status: Exclude<OrderFilter, 'all'>;
  statusCode: OrderStatus;
  pickupHub: string;
  etaRange?: { min: number; max: number } | null;
  countdownSeconds?: number | null;
  deadline?: string | null;
  createdAt: string;
  paymentState: PaymentState;
  refundedAt?: string | null;
};

type ApiOrderSummary = {
  id: string;
  listingId?: string | null;
  listing?: {
    id?: string | null;
    title?: string | null;
    priceXAF?: number | null;
    image?: string | null;
    images?: string[] | null;
    etaDays?: { min: number; max: number } | null;
  } | null;
  qty?: number | null;
  status: OrderStatus;
  pickupPoint?: { name?: string | null } | null;
  createdAt?: string | null;
  deadline?: string | null;
  countdown?: { secondsLeft?: number | null } | null;
  refundedAt?: string | null;
  paymentState?: PaymentState | null;
};

const FALLBACK_POOL: DisplayOrder[] = [
  {
    id: 'demo-order-in-transit',
    listingId: 'lst_seed_1',
    title: 'Baseus 30W Charger (EU Plug)',
    image: '/demo/charger-front.svg',
    quantity: 2,
    unitPrice: 6500,
    status: 'in_transit',
    statusCode: 'FULFILLING',
    pickupHub: 'Akwa Pickup Hub',
    etaRange: { min: 10, max: 14 },
    countdownSeconds: 86400 * 6,
    deadline: '2025-10-06T09:00:00Z',
    createdAt: '2025-09-22T09:00:00Z',
    paymentState: 'escrow_held',
  },
  {
    id: 'demo-order-arrived',
    listingId: 'lst_seed_2',
    title: 'Wireless Earbuds (TWS, USB-C)',
    image: '/demo/earbuds-case.svg',
    quantity: 1,
    unitPrice: 8900,
    status: 'arrived',
    statusCode: 'ARRIVED',
    pickupHub: 'Biyem-Assi Hub',
    etaRange: null,
    countdownSeconds: null,
    deadline: null,
    createdAt: '2025-09-19T11:30:00Z',
    paymentState: 'escrow_held',
  },
  {
    id: 'demo-order-late',
    listingId: 'lst_seed_3',
    title: 'Velvet Matte Lipstick (3-pack)',
    image: '/demo/lipstick-trio.svg',
    quantity: 3,
    unitPrice: 5200,
    status: 'late',
    statusCode: 'LATE',
    pickupHub: 'Akwa Pickup Hub',
    etaRange: { min: 20, max: 28 },
    countdownSeconds: 0,
    deadline: '2025-09-12T09:00:00Z',
    createdAt: '2025-09-15T08:45:00Z',
    paymentState: 'escrow_held',
  },
  {
    id: 'demo-order-refunded',
    listingId: 'lst_seed_4',
    title: 'Smart Fitness Band (Black)',
    image: '/demo/charger-side.svg',
    quantity: 1,
    unitPrice: 18500,
    status: 'refunded',
    statusCode: 'REFUNDED',
    pickupHub: 'Bonamoussadi Hub',
    etaRange: { min: 12, max: 18 },
    countdownSeconds: 0,
    deadline: '2025-09-05T15:00:00Z',
    createdAt: '2025-09-10T12:10:00Z',
    paymentState: 'refunded',
    refundedAt: '2025-09-24T15:30:00Z',
  },
];

const ORDER_FILTERS: Array<{ key: OrderFilter; labelKey: string }> = [
  { key: 'all', labelKey: 'orders.filters.all' },
  { key: 'in_transit', labelKey: 'orders.filters.inTransit' },
  { key: 'arrived', labelKey: 'orders.filters.arrived' },
  { key: 'late', labelKey: 'orders.filters.late' },
  { key: 'refunded', labelKey: 'orders.filters.refunded' },
];

const mergeOrders = (primary: DisplayOrder[], secondary: DisplayOrder[]): DisplayOrder[] => {
  const map = new Map<string, DisplayOrder>();
  secondary.forEach(order => {
    map.set(order.id, order);
  });
  primary.forEach(order => {
    map.set(order.id, order);
  });
  return Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
};

const ensureMinimumOrders = (orders: DisplayOrder[]): DisplayOrder[] => {
  const result = [...orders];
  const seenStatuses = new Set(result.map(order => order.status));

  if (result.length < 3) {
    for (const fallback of FALLBACK_POOL) {
      if (result.length >= 3) break;
      if (!result.some(order => order.id === fallback.id) && !seenStatuses.has(fallback.status)) {
        result.push(fallback);
        seenStatuses.add(fallback.status);
      }
    }
  }

  if (result.length < 3) {
    for (const fallback of FALLBACK_POOL) {
      if (result.length >= 3) break;
      if (!result.some(order => order.id === fallback.id)) {
        result.push(fallback);
      }
    }
  }

  return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

const normaliseStatus = (status?: OrderStatus | null): Exclude<OrderFilter, 'all'> => {
  switch (status) {
    case 'ARRIVED':
    case 'COLLECTED':
    case 'ESCROW_RELEASED':
    case 'CLOSED':
      return 'arrived';
    case 'LATE':
      return 'late';
    case 'REFUNDED':
      return 'refunded';
    default:
      return 'in_transit';
  }
};

const resolvePaymentState = (status?: OrderStatus | null): PaymentState => {
  if (status === 'REFUNDED') return 'refunded';
  if (status === 'ESCROW_RELEASED' || status === 'CLOSED' || status === 'COLLECTED') {
    return 'escrow_released';
  }
  return 'escrow_held';
};

const formatOrderId = (value: string) => `#${value.slice(-6).toUpperCase()}`;

const computeSecondsLeft = (deadline?: string | null) => {
  if (!deadline) return undefined;
  const ms = new Date(deadline).getTime() - Date.now();
  return Math.max(0, Math.floor(ms / 1000));
};

const copyText = async (value: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      console.warn('Clipboard API failed', error);
    }
  }

  if (typeof document === 'undefined') return false;

  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'absolute';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (error) {
    console.warn('Fallback copy failed', error);
    return false;
  }
};

const BuyerOrders = () => {
  const { t, locale } = useI18n();
  const navigate = useNavigate();

  const [selectedFilter, setSelectedFilter] = useState<OrderFilter>('all');
  const [search, setSearch] = useState('');
  const [receiptOrder, setReceiptOrder] = useState<DisplayOrder | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const mapDemoOrder = useCallback(
    (order: DemoOrderRecord): DisplayOrder => {
      const listingId = order.listing?.id ?? order.listingId ?? undefined;
      const listingMeta = getDemoListingById(listingId ?? undefined);
      const title = order.listing?.title ?? listingMeta?.title ?? t('orders.fallbackTitle');
      const qty = order.qty ?? 1;
      const unitPrice = order.listing?.priceXAF ?? listingMeta?.priceXAF ?? 0;
      const image = listingMeta?.images?.[0] ?? defaultImage;
      const pickupHub =
        order.pickupPoint?.name ??
        listingMeta?.importer?.displayName ??
        order.pickupPoint?.city ??
        defaultPickupHub;
      const status = normaliseStatus(order.status);

      const resolvedCountdown = order.countdown?.secondsLeft ?? computeSecondsLeft(order.countdown?.deadline);

      return {
        id: order.id,
        listingId: listingMeta?.id ?? order.listing?.id ?? order.listingId ?? null,
        title,
        image,
        quantity: qty,
        unitPrice,
        status,
        statusCode: order.status ?? 'FULFILLING',
        pickupHub,
        etaRange: listingMeta?.etaDays ?? null,
        countdownSeconds: resolvedCountdown ?? null,
        deadline: order.countdown?.deadline ?? null,
        createdAt: order.createdAt ?? new Date().toISOString(),
        paymentState: resolvePaymentState(order.status),
        refundedAt: order.status === 'REFUNDED' ? order.milestones?.find(m => m.code === 'COLLECTED')?.at ?? order.createdAt ?? null : null,
      };
    },
    [t],
  );

  const mapApiOrder = useCallback(
    (order: ApiOrderSummary): DisplayOrder => {
      const listingId = order.listing?.id ?? order.listingId ?? undefined;
      const listingMeta = getDemoListingById(listingId ?? undefined);
      const title = order.listing?.title ?? listingMeta?.title ?? t('orders.fallbackTitle');
      const qty = order.qty ?? 1;
      const unitPrice = order.listing?.priceXAF ?? listingMeta?.priceXAF ?? 0;
      const image =
        order.listing?.image ??
        order.listing?.images?.[0] ??
        listingMeta?.images?.[0] ??
        defaultImage;
      const pickupHub =
        order.pickupPoint?.name ??
        listingMeta?.importer?.displayName ??
        defaultPickupHub;
      const status = normaliseStatus(order.status);
      const countdownSeconds =
        order.countdown?.secondsLeft ?? computeSecondsLeft(order.deadline) ?? computeSecondsLeft(listingMeta?.moq?.lockAt ?? undefined);

      return {
        id: order.id,
        listingId: listingMeta?.id ?? order.listing?.id ?? order.listingId ?? null,
        title,
        image,
        quantity: qty ?? 1,
        unitPrice,
        status,
        statusCode: order.status,
        pickupHub,
        etaRange: order.listing?.etaDays ?? listingMeta?.etaDays ?? null,
        countdownSeconds: countdownSeconds ?? null,
        deadline: order.deadline ?? null,
        createdAt: order.createdAt ?? new Date().toISOString(),
        paymentState: order.paymentState ?? resolvePaymentState(order.status),
        refundedAt: order.refundedAt ?? null,
      };
    },
    [t],
  );

  const fetchOrders = useCallback(async (): Promise<DisplayOrder[]> => {
    setLoadError(null);
    const demoRecords = listDemoOrders();
    const demoOrders = demoRecords.map(mapDemoOrder);

    try {
      const response = await api<{ items: ApiOrderSummary[] }>('/api/orders');
      const apiOrders = response.items?.map(mapApiOrder) ?? [];
      const merged = mergeOrders(apiOrders, demoOrders);
      return ensureMinimumOrders(merged);
    } catch (error) {
      console.warn('Failed to load orders', error);
      setLoadError(t('orders.error.message'));
      if (demoOrders.length) {
        return ensureMinimumOrders(demoOrders);
      }
      return ensureMinimumOrders([]);
    }
  }, [mapApiOrder, mapDemoOrder, t]);

  const ordersQuery = useQuery({
    queryKey: ['buyer-orders'],
    queryFn: fetchOrders,
    retry: false,
    refetchOnWindowFocus: false,
  });

  const orders = ordersQuery.data ?? [];

  const filteredOrders = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    return orders.filter(order => {
      if (selectedFilter !== 'all' && order.status !== selectedFilter) {
        return false;
      }
      if (!searchValue) return true;
      const haystack = `${order.title} ${order.id} ${order.pickupHub}`.toLowerCase();
      return haystack.includes(searchValue);
    });
  }, [orders, search, selectedFilter]);

  const isLoading = ordersQuery.isLoading && !ordersQuery.data;
  const isEmpty = !isLoading && filteredOrders.length === 0;

  const formatMiniLine = useCallback(
    (order: DisplayOrder) => {
      if (order.status === 'in_transit') {
        if (order.etaRange) {
          return t('orders.miniLine.etaRange', {
            min: order.etaRange.min,
            max: order.etaRange.max,
          });
        }
        const seconds = order.countdownSeconds ?? computeSecondsLeft(order.deadline);
        if (seconds && seconds >= 3600) {
          if (seconds >= 86400) {
            const days = Math.max(1, Math.ceil(seconds / 86400));
            return t('orders.miniLine.etaDays', { value: days });
          }
          const hours = Math.max(1, Math.ceil(seconds / 3600));
          return t('orders.miniLine.etaHours', { value: hours });
        }
        return t('orders.miniLine.tracking');
      }
      if (order.status === 'arrived') {
        return t('orders.miniLine.pickup', { hub: order.pickupHub });
      }
      if (order.status === 'late') {
        return t('orders.miniLine.late');
      }
      if (order.status === 'refunded') {
        if (order.refundedAt) {
          const formatted = format(new Date(order.refundedAt), 'd MMM', {
            locale: locale === 'fr' ? frLocale : undefined,
          });
          return t('orders.miniLine.refundedOn', { date: formatted });
        }
        return t('orders.miniLine.refunded');
      }
      return t('orders.miniLine.tracking');
    },
    [locale, t],
  );

  const buildReceiptText = useCallback(
    (order: DisplayOrder) => {
      const id = formatOrderId(order.id);
      const price = currencyFormatter.format(order.unitPrice);
      const total = currencyFormatter.format(order.unitPrice * order.quantity);
      const payment = t(`orders.receipt.payment.${order.paymentState}`);
      const date = format(new Date(order.createdAt), 'd MMM yyyy', {
        locale: locale === 'fr' ? frLocale : undefined,
      });
      return t('orders.receipt.plainText', {
        id,
        title: order.title,
        qty: order.quantity,
        price,
        total,
        pickup: order.pickupHub,
        payment,
        date,
      });
    },
    [currencyFormatter, locale, t],
  );

  const shareReceipt = useCallback(
    async (order: DisplayOrder) => {
      const id = formatOrderId(order.id);
      const price = currencyFormatter.format(order.unitPrice);
      const total = currencyFormatter.format(order.unitPrice * order.quantity);
      const shareText = t('orders.receipt.shareMessage', {
        id,
        title: order.title,
        qty: order.quantity,
        price,
        total,
        pickup: order.pickupHub,
      });
      const shareTitle = t('orders.receipt.shareTitle', { id });

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title: shareTitle, text: shareText });
          toast({ description: t('orders.receipt.toastShareReady') });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === 'AbortError') {
            return;
          }
        }
      }

      const copied = await copyText(shareText);
      toast({
        description: copied ? t('orders.receipt.toastShareFallback') : t('orders.receipt.toastShareError'),
      });
    },
    [currencyFormatter, t],
  );

  const copyReceipt = useCallback(
    async (order: DisplayOrder) => {
      const text = buildReceiptText(order);
      const copied = await copyText(text);
      toast({ description: copied ? t('orders.receipt.toastCopied') : t('orders.receipt.toastCopyFailed') });
    },
    [buildReceiptText, t],
  );

  const handleCardClick = useCallback(
    (orderId: string) => {
      navigate(`/order/${orderId}`);
    },
    [navigate],
  );

  const headerClass = 'flex items-center justify-between';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col bg-background px-4 pb-24 pt-6 sm:px-6">
      <header className="space-y-5">
        <div className={headerClass}>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{t('orders.title')}</h1>
            <p className="text-sm text-muted-foreground">{t('orders.subtitle')}</p>
          </div>
          {ordersQuery.isFetching ? <span className="h-3 w-3 animate-pulse rounded-full bg-primary" aria-hidden /> : null}
        </div>
        <div className="space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder={t('orders.searchPlaceholder')}
              aria-label={t('orders.searchAria')}
              className="h-11 rounded-full border border-border/70 bg-card/80 pl-11 pr-4 text-sm shadow-soft"
            />
          </div>
          <div
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            aria-label={t('orders.filters.ariaLabel')}
          >
            {ORDER_FILTERS.map(filter => {
              const isActive = selectedFilter === filter.key;
              return (
                <Button
                  key={filter.key}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedFilter(filter.key)}
                  aria-pressed={isActive}
                  className={cn(
                    'h-11 rounded-full border px-5 text-sm font-semibold transition-all',
                    isActive
                      ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                      : 'border-border/60 bg-muted/40 text-muted-foreground hover:bg-muted/70',
                  )}
                >
                  {t(filter.labelKey)}
                </Button>
              );
            })}
          </div>
        </div>
      </header>

      {loadError ? (
        <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 shadow-soft">
          <span>{t('orders.error.banner')}</span>
          <Button
            type="button"
            variant="ghost"
            className="h-9 rounded-full border border-amber-400 px-3 text-xs font-semibold text-amber-900 hover:bg-amber-100"
            onClick={() => ordersQuery.refetch()}
          >
            {t('orders.error.retry')}
          </Button>
        </div>
      ) : null}

      <main className="mt-6 flex flex-1 flex-col gap-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="flex items-stretch gap-3 rounded-2xl border border-border/60 bg-card/80 p-3 shadow-soft"
              >
                <Skeleton className="h-20 w-20 rounded-2xl" />
                <div className="flex flex-1 flex-col gap-2">
                  <Skeleton className="h-4 w-3/4 rounded-full" />
                  <Skeleton className="h-3 w-1/3 rounded-full" />
                  <Skeleton className="h-3 w-1/2 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {!isLoading && !isEmpty ? (
          <div className="space-y-3">
            {filteredOrders.map(order => {
              const statusLabel = t(`orders.status.${order.status}`);
              const MiniIcon = statusIcons[order.status];
              const miniLine = formatMiniLine(order);

              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => handleCardClick(order.id)}
                  className="group flex items-stretch gap-3 rounded-2xl border border-border/70 bg-card/90 p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 active:translate-y-[1px]"
                  aria-label={t('orders.trackerAria', { title: order.title })}
                >
                  <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
                    <img src={order.image} alt={order.title} className="h-full w-full object-cover" loading="lazy" />
                  </div>
                  <div className="flex flex-1 flex-col justify-between gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 space-y-1">
                        <p className="line-clamp-2 text-sm font-semibold text-foreground">{order.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {order.quantity} × {currencyFormatter.format(order.unitPrice)}
                        </p>
                      </div>
                      <span
                        className={cn(
                          'whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold shadow-soft',
                          statusColors[order.status],
                        )}
                        aria-label={t('orders.statusAria', { status: statusLabel })}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className={cn('flex items-center gap-1.5 text-xs font-medium', miniLineColors[order.status])}>
                      <MiniIcon className="h-3.5 w-3.5" aria-hidden />
                      <span>{miniLine}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('orders.pickupLine', { hub: order.pickupHub })}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={event => event.stopPropagation()}
                        aria-label={t('orders.menu.label', { title: order.title })}
                        className="h-10 w-10 rounded-full border border-border/60 bg-muted/40 text-muted-foreground transition-colors hover:bg-muted/80"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl border-border/70 bg-card/95 p-1 shadow-soft">
                      <DropdownMenuItem onSelect={() => setReceiptOrder(order)} className="rounded-xl px-3 py-2 text-sm">
                        {t('orders.menu.viewReceipt')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => shareReceipt(order)}
                        className="rounded-xl px-3 py-2 text-sm"
                      >
                        {t('orders.menu.shareReceipt')}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onSelect={() => toast({ description: t('orders.menu.supportToast') })}
                        className="rounded-xl px-3 py-2 text-sm"
                      >
                        {t('orders.menu.contactSupport')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <ChevronRight className="mt-3 h-4 w-4 flex-shrink-0 text-muted-foreground" aria-hidden />
                </button>
              );
            })}
          </div>
        ) : null}

        {isEmpty ? (
          <div className="mt-10 flex flex-1 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-border/60 bg-card/60 p-8 text-center shadow-soft">
            <p className="text-lg font-semibold text-foreground">{t('orders.empty.title')}</p>
            <p className="text-sm text-muted-foreground">{t('orders.empty.subtitle')}</p>
            <Button
              type="button"
              className="mt-1 h-11 rounded-full px-6"
              onClick={() => navigate('/')}
            >
              {t('orders.empty.action')}
            </Button>
          </div>
        ) : null}
      </main>

      <Sheet open={Boolean(receiptOrder)} onOpenChange={open => (!open ? setReceiptOrder(null) : undefined)}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl border-t border-border/70 bg-background/95 pb-10 sm:left-1/2 sm:top-auto sm:w-full sm:max-w-lg sm:-translate-x-1/2"
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-muted" aria-hidden />
          <SheetHeader className="text-left">
            <SheetTitle>{t('orders.receipt.title')}</SheetTitle>
            <SheetDescription>{t('orders.receipt.subtitle')}</SheetDescription>
          </SheetHeader>
          {receiptOrder ? (
            <div className="mt-5 space-y-5">
              <div className="flex gap-3 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-soft">
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
                  <img src={receiptOrder.image} alt={receiptOrder.title} className="h-full w-full object-cover" />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground">{receiptOrder.title}</p>
                    <span
                      className={cn(
                        'whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold shadow-soft',
                        statusColors[receiptOrder.status],
                      )}
                    >
                      {t(`orders.status.${receiptOrder.status}`)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t('orders.receipt.qtyPrice', {
                      qty: receiptOrder.quantity,
                      price: currencyFormatter.format(receiptOrder.unitPrice),
                    })}
                  </p>
                  <p className="text-sm font-semibold text-foreground">
                    {t('orders.receipt.totalLabel')} {currencyFormatter.format(receiptOrder.unitPrice * receiptOrder.quantity)}
                  </p>
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-border/60 bg-card/90 p-4 shadow-soft">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('orders.receipt.payment.label')}</span>
                  <span className="font-semibold text-foreground">
                    {t(`orders.receipt.payment.${receiptOrder.paymentState}`)}
                  </span>
                </div>
                <Separator className="bg-border/60" />
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('orders.receipt.pickup')}</span>
                  <span className="font-semibold text-foreground">{receiptOrder.pickupHub}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('orders.receipt.orderId')}</span>
                  <span className="font-semibold text-foreground">{formatOrderId(receiptOrder.id)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('orders.receipt.createdAt')}</span>
                  <span className="font-semibold text-foreground">
                    {format(new Date(receiptOrder.createdAt), 'd MMM yyyy', {
                      locale: locale === 'fr' ? frLocale : undefined,
                    })}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 flex-1 rounded-full"
                  onClick={() => copyReceipt(receiptOrder)}
                >
                  {t('orders.receipt.copy')}
                </Button>
                <Button type="button" className="h-11 flex-1 rounded-full" onClick={() => shareReceipt(receiptOrder)}>
                  {t('orders.receipt.share')}
                </Button>
              </div>
            </div>
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BuyerOrders;
