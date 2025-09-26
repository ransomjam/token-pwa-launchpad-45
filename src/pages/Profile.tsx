import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type FormEvent,
  type ReactNode,
  type SVGProps,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  demoBuyerProfile,
  demoImporterProfile,
  loadBuyerProfile,
  loadImporterProfile,
  saveBuyerProfile,
  saveImporterProfile,
  type PreferredWallet,
  type BuyerProfile,
  type ImporterProfile,
  type VerificationStep,
} from '@/lib/profile-data';
import { useSession } from '@/context/SessionContext';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/components/ui/use-toast';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNetworkStatus } from '@/hooks/use-network-status';
import { listDemoOrders, type DemoOrderRecord } from '@/lib/demoOrderStorage';
import { getDemoListingById } from '@/lib/demoMode';
import type { OrderStatus } from '@/types';
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BellRing,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Globe2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Package,
  PhoneCall,
  PlusCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Truck,
} from 'lucide-react';
import { LanguageToggle } from '@/components/shell/AccountControls';
import { loadBids, loadWatchlist, loadWins } from '@/lib/auctionData';

type EditState =
  | {
      mode: 'buyer' | 'importer' | 'vendor';
      field:
        | 'name'
        | 'phone'
        | 'email'
        | 'deliveryNote'
        | 'storeName'
        | 'contactName'
        | 'storePhone'
        | 'storeEmail'
        | 'bio';
      label: string;
      description?: string;
      value: string;
      type: 'text' | 'textarea';
    }
  | {
      mode: 'buyer' | 'importer' | 'vendor';
      field: 'defaultPickup';
      label: string;
      type: 'pickup';
    };

const SectionCard = ({
  value,
  title,
  subtitle,
  children,
}: {
  value: string;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) => (
  <AccordionItem
    value={value}
    className="overflow-hidden rounded-3xl border border-border/70 bg-card shadow-soft"
  >
    <AccordionTrigger className="px-5 py-4 text-left text-base font-semibold text-foreground">
      <div className="flex flex-col gap-1 text-left">
        <span>{title}</span>
        {subtitle ? (
          <span className="text-sm font-normal text-muted-foreground">{subtitle}</span>
        ) : null}
      </div>
    </AccordionTrigger>
    <AccordionContent className="px-5 pb-5">
      <div className="mt-2 space-y-4">{children}</div>
    </AccordionContent>
  </AccordionItem>
);

const InfoRow = ({
  label,
  value,
  hint,
  onClick,
  actionLabel,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  onClick?: () => void;
  actionLabel?: string;
}) => {
  const interactive = Boolean(onClick);
  const Wrapper = interactive ? 'button' : 'div';

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl border border-border/70 bg-card/80 px-4 py-3 text-left shadow-soft transition-all',
        interactive
          ? 'hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-[1px]'
          : 'cursor-default',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <div className="text-sm text-muted-foreground">{value}</div>
          {hint ? <p className="text-xs text-muted-foreground/80">{hint}</p> : null}
        </div>
        {interactive ? (
          <span className="flex items-center gap-1 text-sm font-semibold text-primary">
            {actionLabel ?? 'Edit'}
            <ChevronRight className="h-4 w-4" />
          </span>
        ) : null}
      </div>
    </Wrapper>
  );
};

type SummaryAccent = 'primary' | 'teal' | 'ocean';

const summaryAccentClasses: Record<SummaryAccent, string> = {
  primary: 'from-primary/25 via-teal/15 to-blue/25',
  teal: 'from-teal/25 via-blue/15 to-ocean/25',
  ocean: 'from-blue/25 via-ocean/15 to-primary/25',
};

type SummaryTileProps = {
  label: string;
  hint: string;
  count: string;
  onClick?: () => void;
  accent: SummaryAccent;
  badge?: string | null;
};

type SummaryTileConfig = SummaryTileProps & { key: string };

const SummaryTile = ({ label, hint, count, onClick, accent, badge }: SummaryTileProps) => {
  const interactive = Boolean(onClick);
  const Wrapper = interactive ? 'button' : 'div';

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group relative isolate flex h-full flex-col overflow-hidden rounded-2xl border border-white/50 bg-card/95 p-[1px] text-left shadow-soft transition-all',
        interactive
          ? 'hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/45 active:translate-y-[1px]'
          : 'cursor-default',
      )}
    >
      <span
        className={cn(
          'pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br opacity-80 transition-opacity duration-300 group-hover:opacity-100',
          summaryAccentClasses[accent],
        )}
      />
      <div className="relative flex h-full flex-col gap-2 rounded-[18px] bg-card/95 px-4 py-3 backdrop-blur-sm">
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground/90">
          <span className="truncate">{label}</span>
          {badge ? (
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary shadow-sm">
              {badge}
            </span>
          ) : null}
        </div>
        <span className="text-xl font-semibold text-foreground">{count}</span>
        <p className="text-[11px] leading-snug text-muted-foreground/90">{hint}</p>
      </div>
    </Wrapper>
  );
};

const QuickActionButton = ({
  label,
  description,
  icon: Icon,
  onClick,
  muted,
  badge,
}: {
  label: string;
  description: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  onClick?: () => void;
  muted?: boolean;
  badge?: string | null;
}) => {
  const interactive = Boolean(onClick);

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!interactive}
      className={cn(
        'group relative isolate flex h-full flex-col overflow-hidden rounded-[28px] border border-white/40 bg-gradient-to-br from-primary/12 via-teal/10 to-blue/12 p-[1px] text-left shadow-soft transition-all',
        interactive
          ? 'hover:-translate-y-1 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-[1px]'
          : 'cursor-default opacity-80',
      )}
    >
      <span className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <span className="absolute -top-20 right-0 h-40 w-40 rounded-full bg-primary/25 blur-3xl" />
        <span className="absolute -bottom-24 left-4 h-44 w-44 rounded-full bg-blue/20 blur-3xl" />
      </span>
      <div className="relative flex h-full flex-col justify-between gap-6 rounded-[26px] bg-card/95 px-5 py-5 backdrop-blur-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/15 via-teal/15 to-blue/20 text-primary shadow-soft transition-colors duration-300',
                muted
                  ? 'from-muted via-muted to-muted text-muted-foreground'
                  : 'group-hover:from-primary group-hover:via-teal group-hover:to-blue group-hover:text-primary-foreground',
              )}
            >
              <Icon className="h-5 w-5" />
            </span>
            {badge ? (
              <Badge
                variant="outline"
                className="rounded-full border-primary/40 bg-primary/10 px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary"
              >
                {badge}
              </Badge>
            ) : null}
          </div>
          {interactive ? (
            <ArrowUpRight className="h-4 w-4 text-muted-foreground transition-colors duration-200 group-hover:text-primary" />
          ) : null}
        </div>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">{label}</p>
          <p className="text-sm text-muted-foreground/90">{description}</p>
        </div>
      </div>
    </button>
  );
};

type OrderQuickStatus = 'in_transit' | 'arrived' | 'late' | 'refunded';

type QuickFlow = 'orders' | 'pickups' | 'payments' | 'support';

type OrderEtaCustomKey = 'tracking';

type OrderSummary = {
  id: string;
  title: string;
  image: string;
  quantity: number;
  unitPrice: number;
  status: OrderQuickStatus;
  etaType?: 'days' | 'hours' | 'ready' | 'late' | 'refunded' | 'custom';
  etaValue?: number | OrderEtaCustomKey;
  pickupHub: string;
  createdAt: string;
};

const FALLBACK_ORDERS: OrderSummary[] = [
  {
    id: 'demo-order-1',
    title: 'Baseus 30W Charger (EU Plug)',
    image: 'https://images.unsplash.com/photo-1582719478173-d83e7e913b95?auto=format&fit=crop&w=600&q=80',
    quantity: 2,
    unitPrice: 6500,
    status: 'in_transit',
    etaType: 'days',
    etaValue: 3,
    pickupHub: 'Akwa Pickup Hub',
    createdAt: '2025-07-18T09:00:00Z',
  },
  {
    id: 'demo-order-2',
    title: 'Wireless Earbuds (TWS, USB-C)',
    image: 'https://images.unsplash.com/photo-1585386959984-a4155229a1ab?auto=format&fit=crop&w=600&q=80',
    quantity: 1,
    unitPrice: 8900,
    status: 'arrived',
    etaType: 'ready',
    pickupHub: 'Biyem-Assi Hub',
    createdAt: '2025-07-12T09:00:00Z',
  },
  {
    id: 'demo-order-3',
    title: 'Velvet Matte Lipstick (3-pack)',
    image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=600&q=80',
    quantity: 3,
    unitPrice: 5200,
    status: 'late',
    etaType: 'late',
    pickupHub: 'Akwa Pickup Hub',
    createdAt: '2025-07-05T09:00:00Z',
  },
];

type SupportTopic = 'order' | 'payment' | 'app';

const WALLET_OPTIONS: Array<{
  id: PreferredWallet;
  labelKey: `profile.paymentsFlow.options.${string}`;
  helperKey: `profile.paymentsFlow.helpers.${string}`;
}> = [
  {
    id: 'mtn-momo',
    labelKey: 'profile.paymentsFlow.options.mtn',
    helperKey: 'profile.paymentsFlow.helpers.mtn',
  },
  {
    id: 'orange-money',
    labelKey: 'profile.paymentsFlow.options.orange',
    helperKey: 'profile.paymentsFlow.helpers.orange',
  },
];

const SUPPORT_TOPIC_OPTIONS: Array<{ id: SupportTopic; labelKey: `profile.supportFlow.topics.${string}` }> = [
  { id: 'order', labelKey: 'profile.supportFlow.topics.order' },
  { id: 'payment', labelKey: 'profile.supportFlow.topics.payment' },
  { id: 'app', labelKey: 'profile.supportFlow.topics.app' },
];

const normaliseOrderStatus = (status?: OrderStatus | null): OrderQuickStatus => {
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

const computeStepProgress = (steps: VerificationStep[]) => {
  const completed = steps.filter(step => step.status === 'complete').length;
  return Math.round((completed / steps.length) * 100);
};

const Profile = () => {
  const navigate = useNavigate();
  const { session } = useSession();
  const { t, locale } = useI18n();

  const mode: 'buyer' | 'importer' | 'vendor' = session?.role ?? 'buyer';
  const isOnline = useNetworkStatus();

  const [buyerProfile, setBuyerProfile] = useState<BuyerProfile | null>(null);
  const [importerProfile, setImporterProfile] = useState<ImporterProfile | null>(null);
  const [editState, setEditState] = useState<EditState | null>(null);
  const [verificationStep, setVerificationStep] = useState<VerificationStep | null>(null);
  const [activeFlow, setActiveFlow] = useState<QuickFlow | null>(null);
  const [storedOrders, setStoredOrders] = useState<OrderSummary[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderQuickStatus | 'all'>('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [walletSelection, setWalletSelection] = useState<PreferredWallet | null>(null);
  const [pickupSearch, setPickupSearch] = useState('');
  const [pendingPickupId, setPendingPickupId] = useState<string | null>(null);
  const [addingHub, setAddingHub] = useState(false);
  const [newHub, setNewHub] = useState({ name: '', address: '', city: '', phone: '' });
  const [supportTopic, setSupportTopic] = useState<SupportTopic>('order');
  const [supportMessage, setSupportMessage] = useState('');

  const activeBuyer = buyerProfile ?? demoBuyerProfile;
  const activeImporter = importerProfile ?? demoImporterProfile;

  const bidsCount = useMemo(() => loadBids().length, []);
  const watchlistCount = useMemo(() => loadWatchlist().length, []);
  const winsCount = useMemo(() => loadWins().length, []);

  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const openBids = useCallback(() => {
    trackEvent('profile_nav_bids');
    navigate('/profile/bids');
  }, [navigate]);

  const openWatchlist = useCallback(() => {
    trackEvent('profile_nav_watchlist');
    navigate('/profile/watchlist');
  }, [navigate]);

  const openWins = useCallback(() => {
    trackEvent('profile_nav_wins');
    navigate('/profile/wins');
  }, [navigate]);

  const auctionTiles = useMemo<SummaryTileConfig[]>(
    () => [
      {
        key: 'bids',
        label: t('profile.bids.title'),
        hint: t('profile.bids.subtitle'),
        count: numberFormatter.format(bidsCount),
        onClick: openBids,
        accent: 'teal',
      },
      {
        key: 'watchlist',
        label: t('profile.watchlist.title'),
        hint: t('profile.watchlist.subtitle'),
        count: numberFormatter.format(watchlistCount),
        onClick: openWatchlist,
        accent: 'ocean',
      },
      {
        key: 'wins',
        label: t('profile.wins.title'),
        hint: t('profile.wins.subtitle'),
        count: numberFormatter.format(winsCount),
        onClick: openWins,
        accent: 'primary',
      },
      {
        key: 'points',
        label: t('profile.points.title'),
        hint: t('profile.points.subtitle'),
        count: t('profile.points.placeholder'),
        accent: 'primary',
        badge: t('profile.points.badge'),
      },
    ],
    [bidsCount, numberFormatter, openBids, openWatchlist, openWins, t, watchlistCount, winsCount],
  );

  const mapDemoOrderToSummary = useCallback(
    (order: DemoOrderRecord): OrderSummary => {
      const listingId = order.listingId ?? order.listing?.id;
      const listingMeta = getDemoListingById(listingId ?? undefined);
      const title = order.listing?.title ?? listingMeta?.title ?? t('profile.ordersFlow.fallbackTitle');
      const quantity = order.qty ?? 1;
      const unitPrice = order.listing?.priceXAF ?? listingMeta?.priceXAF ?? 0;
    const image = listingMeta?.images?.[0] ?? '/demo/blue-airforce-shoes.jfif';
    const pickupHub = order.pickupPoint?.name ?? listingMeta?.importer?.displayName ?? activeBuyer.pickups[0]?.name ?? '';
    const status = normaliseOrderStatus(order.status);

    let etaType: OrderSummary['etaType'];
    let etaValue: OrderSummary['etaValue'];
    if (status === 'arrived') {
      etaType = 'ready';
    } else if (status === 'late') {
      etaType = 'late';
    } else if (status === 'refunded') {
      etaType = 'refunded';
    } else {
      const secondsLeft = order.countdown?.secondsLeft ?? 0;
      if (secondsLeft > 0) {
        if (secondsLeft >= 86_400) {
          etaType = 'days';
          etaValue = Math.ceil(secondsLeft / 86_400);
        } else {
          etaType = 'hours';
          etaValue = Math.max(1, Math.ceil(secondsLeft / 3_600));
        }
      } else {
        etaType = 'custom';
        etaValue = 'tracking';
      }
    }

      return {
        id: order.id,
        title,
        image,
        quantity,
        unitPrice,
        status,
        etaType,
        etaValue,
        pickupHub,
        createdAt: order.createdAt ?? new Date().toISOString(),
      };
    },
    [activeBuyer.pickups, t],
  );

  useEffect(() => {
    if (mode === 'buyer') {
      setBuyerProfile(loadBuyerProfile());
    } else {
      setImporterProfile(loadImporterProfile());
    }
    trackEvent('profile_view', { mode });
  }, [mode]);

  useEffect(() => {
    if (!editState) return;
    trackEvent('profile_edit_open', { field: editState.field, mode: editState.mode });
  }, [editState]);

  useEffect(() => {
    if (!verificationStep) return;
    trackEvent('kyc_step_view', { step: verificationStep.id });
  }, [verificationStep]);

  useEffect(() => {
    if (mode !== 'buyer') return;
    const demoOrders = listDemoOrders();
    if (!demoOrders.length) {
      setStoredOrders([]);
      return;
    }
    setStoredOrders(demoOrders.map(mapDemoOrderToSummary));
  }, [mode, mapDemoOrderToSummary]);

  const maskedContact = useMemo(() => {
    if (mode === 'buyer') {
      return `${activeBuyer.maskedPhone} • ${activeBuyer.maskedEmail}`;
    }
    return `${activeImporter.maskedPhone} • ${activeImporter.maskedEmail}`;
  }, [mode, activeBuyer, activeImporter]);

  const headerName = useMemo(() => {
    if (mode === 'buyer') {
      return activeBuyer.name || session?.displayName || demoBuyerProfile.name;
    }
    return activeImporter.storeName || session?.displayName || demoImporterProfile.storeName;
  }, [mode, activeBuyer, activeImporter, session]);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      }),
    [locale],
  );

  const initials = headerName
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const buyerDefaultPickup = activeBuyer.pickups.find(pickup => pickup.id === activeBuyer.defaultPickupId) ??
    demoBuyerProfile.pickups[0];

  const orders = useMemo(() => {
    const base = (() => {
      if (!storedOrders.length) return FALLBACK_ORDERS;
      const needed = Math.max(0, 3 - storedOrders.length);
      return needed > 0 ? [...storedOrders, ...FALLBACK_ORDERS.slice(0, needed)] : storedOrders;
    })();
    return [...base].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [storedOrders]);

  const hasStoredOrders = storedOrders.length > 0;

  const orderStatusMeta = useMemo<Record<OrderQuickStatus, { label: string; className: string }>>(
    () => ({
      in_transit: {
        label: t('profile.ordersFlow.status.inTransit'),
        className: 'border-sky-200 bg-sky-50 text-sky-600',
      },
      arrived: {
        label: t('profile.ordersFlow.status.arrived'),
        className: 'border-emerald-200 bg-emerald-50 text-emerald-600',
      },
      late: {
        label: t('profile.ordersFlow.status.late'),
        className: 'border-amber-200 bg-amber-50 text-amber-600',
      },
      refunded: {
        label: t('profile.ordersFlow.status.refunded'),
        className: 'border-slate-200 bg-slate-50 text-slate-600',
      },
    }),
    [t],
  );

  const orderFilterOptions = useMemo(
    () => [
      { id: 'all' as const, label: t('profile.ordersFlow.filters.all') },
      { id: 'in_transit' as const, label: t('profile.ordersFlow.filters.inTransit') },
      { id: 'arrived' as const, label: t('profile.ordersFlow.filters.arrived') },
      { id: 'late' as const, label: t('profile.ordersFlow.filters.late') },
      { id: 'refunded' as const, label: t('profile.ordersFlow.filters.refunded') },
    ],
    [t],
  );

  const filteredOrders = useMemo(() => {
    const search = orderSearch.trim().toLowerCase();
    return orders.filter(order => {
      const matchesFilter = orderFilter === 'all' || order.status === orderFilter;
      if (!matchesFilter) return false;
      if (!search) return true;
      return (
        order.title.toLowerCase().includes(search) ||
        order.pickupHub.toLowerCase().includes(search) ||
        order.id.toLowerCase().includes(search)
      );
    });
  }, [orders, orderFilter, orderSearch]);

  const isOrdersEmpty = filteredOrders.length === 0;

  const openOrdersCount = useMemo(
    () => orders.filter(order => order.status === 'in_transit' || order.status === 'late').length,
    [orders],
  );

  const recentOrder = orders[0] ?? null;

  const getOrderEtaLabel = useCallback(
    (order: OrderSummary) => {
      if (order.etaType === 'days' && typeof order.etaValue === 'number') {
        return t('profile.ordersFlow.eta.days', { value: order.etaValue });
      }
      if (order.etaType === 'hours' && typeof order.etaValue === 'number') {
        return t('profile.ordersFlow.eta.hours', { value: order.etaValue });
      }
      if (order.etaType === 'ready') {
        return t('profile.ordersFlow.eta.ready');
      }
      if (order.etaType === 'late') {
        return t('profile.ordersFlow.eta.late');
      }
      if (order.etaType === 'refunded') {
        return t('profile.ordersFlow.eta.refunded');
      }
      if (order.etaType === 'custom' && order.etaValue) {
        return order.etaValue === 'tracking'
          ? t('profile.ordersFlow.eta.custom.tracking')
          : t('profile.ordersFlow.eta.fallback');
      }
      return t('profile.ordersFlow.eta.fallback');
    },
    [t],
  );

  const preferredWalletLabel = useMemo(() => {
    if (!activeBuyer.payments.preferredWallet) return null;
    const option = WALLET_OPTIONS.find(item => item.id === activeBuyer.payments.preferredWallet);
    return option ? t(option.labelKey) : null;
  }, [activeBuyer.payments.preferredWallet, t]);

  const notifyActive = activeBuyer.payments.notifyOnLaunch;

  const filteredPickupOptions = useMemo(() => {
    const pool = activeBuyer.pickups.length ? activeBuyer.pickups : demoBuyerProfile.pickups;
    const search = pickupSearch.trim().toLowerCase();
    if (!search) return pool;
    return pool.filter(
      pickup =>
        pickup.name.toLowerCase().includes(search) ||
        pickup.city.toLowerCase().includes(search) ||
        pickup.address.toLowerCase().includes(search),
    );
  }, [activeBuyer.pickups, pickupSearch]);

  const sortedPickupOptions = useMemo(
    () =>
      [...filteredPickupOptions].sort((a, b) => {
        if (a.id === activeBuyer.defaultPickupId) return -1;
        if (b.id === activeBuyer.defaultPickupId) return 1;
        return a.name.localeCompare(b.name);
      }),
    [filteredPickupOptions, activeBuyer.defaultPickupId],
  );

  const supportContacts = useMemo(
    () => [
      {
        id: 'whatsapp' as const,
        label: t('profile.supportFlow.contacts.whatsapp'),
        href: 'https://wa.me/237651000020',
        icon: MessageCircle,
      },
      {
        id: 'call' as const,
        label: t('profile.supportFlow.contacts.call'),
        href: 'tel:+237651000020',
        icon: PhoneCall,
      },
      {
        id: 'email' as const,
        label: t('profile.supportFlow.contacts.email'),
        href: 'mailto:support@prolist.africa',
        icon: Mail,
      },
    ],
    [t],
  );

  const openQuickFlow = useCallback(
    (flow: QuickFlow) => {
      setActiveFlow(flow);
      trackEvent('profile_quick_action_open', { flow, mode });
    },
    [mode],
  );

  const closeQuickFlow = useCallback(() => setActiveFlow(null), []);

  useEffect(() => {
    if (activeFlow === 'orders') {
      setOrderFilter('all');
      setOrderSearch('');
    } else if (activeFlow === 'pickups') {
      setPickupSearch('');
      setPendingPickupId(activeBuyer.defaultPickupId);
      setAddingHub(false);
      setNewHub({ name: '', address: '', city: '', phone: '' });
    } else if (activeFlow === 'payments') {
      setWalletSelection(activeBuyer.payments.preferredWallet);
    } else if (activeFlow === 'support') {
      setSupportTopic('order');
      setSupportMessage('');
    }
  }, [activeFlow, activeBuyer.defaultPickupId, activeBuyer.payments.preferredWallet]);

  const handleOpenOrder = (orderId: string) => {
    closeQuickFlow();
    trackEvent('profile_order_open', { orderId });
    navigate(`/order/${orderId}`);
  };

  const handleConfirmPickup = () => {
    if (!pendingPickupId) {
      closeQuickFlow();
      return;
    }
    if (pendingPickupId === activeBuyer.defaultPickupId) {
      closeQuickFlow();
      return;
    }
    setBuyerProfile(prev => {
      const base = prev ?? loadBuyerProfile();
      const updated = { ...base, defaultPickupId: pendingPickupId };
      saveBuyerProfile(updated);
      return updated;
    });
    trackEvent('pickup_default_change', { mode: 'buyer', pickupId: pendingPickupId });
    toast({ title: t('profile.toast.pickupSaved') });
    closeQuickFlow();
  };

  const handleAddPickupHub = () => {
    const name = newHub.name.trim();
    const address = newHub.address.trim();
    const city = newHub.city.trim();
    const phone = newHub.phone.trim();
    if (!name || !address || !city) {
      toast({ title: t('profile.pickupsFlow.toastMissingFields') });
      return;
    }
    const id = `pickup-${Date.now()}`;
    const entry = { id, name, address, city, phone: phone || undefined };
    setBuyerProfile(prev => {
      const base = prev ?? loadBuyerProfile();
      const updated: BuyerProfile = {
        ...base,
        pickups: [...base.pickups, entry],
      };
      saveBuyerProfile(updated);
      return updated;
    });
    trackEvent('pickup_added', { mode: 'buyer', pickupId: id });
    setPendingPickupId(id);
    setAddingHub(false);
    setNewHub({ name: '', address: '', city: '', phone: '' });
    toast({ title: t('profile.pickupsFlow.toastHubAdded') });
  };

  const handleSaveWallet = () => {
    if (!walletSelection) {
      closeQuickFlow();
      return;
    }
    setBuyerProfile(prev => {
      const base = prev ?? loadBuyerProfile();
      const updated: BuyerProfile = {
        ...base,
        payments: {
          ...base.payments,
          preferredWallet: walletSelection,
        },
      };
      saveBuyerProfile(updated);
      return updated;
    });
    trackEvent('profile_payment_preference_save', { wallet: walletSelection });
    toast({ title: t('profile.toast.paymentSaved') });
    closeQuickFlow();
  };

  const handleNotifyMe = () => {
    if (activeBuyer.payments.notifyOnLaunch) {
      toast({ title: t('profile.toast.notifyExisting') });
      return;
    }
    setBuyerProfile(prev => {
      const base = prev ?? loadBuyerProfile();
      const updated: BuyerProfile = {
        ...base,
        payments: {
          ...base.payments,
          notifyOnLaunch: true,
        },
      };
      saveBuyerProfile(updated);
      return updated;
    });
    trackEvent('profile_payment_notify_subscribe');
    toast({ title: t('profile.toast.notifySaved') });
  };

  const handleSupportSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedMessage = supportMessage.trim();
    if (!trimmedMessage) {
      toast({ title: t('profile.supportFlow.toastMissingMessage') });
      return;
    }
    trackEvent('profile_support_request', { topic: supportTopic, offline: !isOnline });
    toast({ title: t('profile.toast.supportSent') });
    setSupportMessage('');
    closeQuickFlow();
  };

  const handleOpenDispute = (orderId: string) => {
    closeQuickFlow();
    trackEvent('profile_support_dispute_shortcut', { orderId });
    toast({ title: t('profile.supportFlow.toastDisputeOpened') });
    navigate(`/order/${orderId}`);
  };

  const quickActions = mode === 'buyer'
    ? [
        {
          label: t('profile.actions.orders'),
          description:
            openOrdersCount > 0
              ? t('profile.quickSummary.orders', { count: openOrdersCount })
              : t('profile.quickSummary.ordersZero'),
          icon: Package,
          onClick: () => openQuickFlow('orders'),
        },
        {
          label: t('profile.actions.pickups'),
          description: t('profile.quickSummary.pickups', { name: buyerDefaultPickup.name }),
          icon: MapPin,
          onClick: () => openQuickFlow('pickups'),
        },
        {
          label: t('profile.actions.paymentsSoon'),
          description: preferredWalletLabel
            ? t('profile.quickSummary.payments', { wallet: preferredWalletLabel })
            : t('profile.quickSummary.paymentsUnset'),
          icon: CreditCard,
          badge: t('profile.badges.comingSoon'),
          onClick: () => openQuickFlow('payments'),
        },
        {
          label: t('profile.actions.support'),
          description: t('profile.quickSummary.support'),
          icon: LifeBuoy,
          onClick: () => openQuickFlow('support'),
        },
      ]
    : [
        {
          label: t('profile.actions.createListing'),
          description: t('profile.actions.createListingHint'),
          icon: PlusCircle,
          onClick: () => navigate('/importer/create'),
        },
        {
          label: t('profile.actions.dashboard'),
          description: t('profile.actions.dashboardHint'),
          icon: LayoutDashboard,
          onClick: () => navigate('/'),
        },
        {
          label: t('profile.actions.payouts'),
          description: t('profile.actions.payoutsHint'),
          icon: Banknote,
          badge: t('profile.badges.comingSoon'),
        },
        {
          label: t('profile.actions.support'),
          description: t('profile.actions.supportHint'),
          icon: LifeBuoy,
        },
      ];

  const openEdit = (state: EditState) => {
    setEditState(state);
  };

  const handleSaveEdit = () => {
    if (!editState) return;

    if (editState.type === 'text' || editState.type === 'textarea') {
      const nextValue = editValue.trim();
      if (editState.mode === 'buyer') {
        setBuyerProfile(prev => {
          const base = prev ?? loadBuyerProfile();
          let updated: BuyerProfile = base;
          if (editState.field === 'name') {
            updated = { ...base, name: nextValue };
          } else if (editState.field === 'phone') {
            updated = { ...base, phone: nextValue };
          } else if (editState.field === 'email') {
            updated = { ...base, email: nextValue };
          } else if (editState.field === 'deliveryNote') {
            updated = { ...base, deliveryNote: nextValue };
          }
          saveBuyerProfile(updated);
          return updated;
        });
      } else {
        setImporterProfile(prev => {
          const base = prev ?? loadImporterProfile();
          let updated: ImporterProfile = base;
          if (editState.field === 'storeName') {
            updated = { ...base, storeName: nextValue };
          } else if (editState.field === 'contactName') {
            updated = { ...base, contactName: nextValue };
          } else if (editState.field === 'storePhone') {
            updated = { ...base, phone: nextValue };
          } else if (editState.field === 'storeEmail') {
            updated = { ...base, email: nextValue };
          } else if (editState.field === 'bio') {
            updated = { ...base, bio: nextValue };
          }
          saveImporterProfile(updated);
          return updated;
        });
      }
      toast({ title: t('profile.toast.saved') });
      trackEvent('profile_edit_save', { field: editState.field, mode: editState.mode });
      setEditState(null);
      return;
    }

    if (editState.type === 'pickup') {
      const selectedId = mode === 'buyer' ? buyerSelection : importerSelection;
      if (!selectedId) {
        setEditState(null);
        return;
      }
      if (editState.mode === 'buyer') {
        setBuyerProfile(prev => {
          const base = prev ?? loadBuyerProfile();
          const updated = { ...base, defaultPickupId: selectedId };
          saveBuyerProfile(updated);
          return updated;
        });
      } else {
        setImporterProfile(prev => {
          const base = prev ?? loadImporterProfile();
          const updated = { ...base, defaultPickupId: selectedId };
          saveImporterProfile(updated);
          return updated;
        });
      }
      trackEvent('profile_edit_save', { field: editState.field, mode: editState.mode });
      trackEvent('pickup_default_change', { mode: editState.mode, pickupId: selectedId });
      toast({ title: t('profile.toast.pickupSaved') });
      setEditState(null);
    }
  };

  const [editValue, setEditValue] = useState('');
  const [buyerSelection, setBuyerSelection] = useState<string | null>(null);
  const [importerSelection, setImporterSelection] = useState<string | null>(null);

  useEffect(() => {
    if (!editState) return;
    if (editState.type === 'text' || editState.type === 'textarea') {
      setEditValue(editState.value);
    } else if (editState.type === 'pickup') {
      if (editState.mode === 'buyer') {
        setBuyerSelection(activeBuyer.defaultPickupId);
      } else {
        setImporterSelection(activeImporter.defaultPickupId);
      }
    }
  }, [editState, activeBuyer, activeImporter]);

  const closeEdit = () => setEditState(null);

  const buyerPickupOptions = activeBuyer.pickups;
  const importerPickupOptions = activeImporter.pickups;

  const updateBuyerNotifications = (key: keyof BuyerProfile['notifications'], value: boolean) => {
    setBuyerProfile(prev => {
      const base = prev ?? loadBuyerProfile();
      const updated: BuyerProfile = {
        ...base,
        notifications: { ...base.notifications, [key]: value },
      };
      saveBuyerProfile(updated);
      return updated;
    });
    trackEvent('notif_pref_change', { mode: 'buyer', name: key, on: value });
  };

  const updateImporterNotifications = (key: keyof ImporterProfile['notifications'], value: boolean) => {
    setImporterProfile(prev => {
      const base = prev ?? loadImporterProfile();
      const updated: ImporterProfile = {
        ...base,
        notifications: { ...base.notifications, [key]: value },
      };
      saveImporterProfile(updated);
      return updated;
    });
    trackEvent('notif_pref_change', { mode: 'importer', name: key, on: value });
  };

  const toggleBuyerPrivacy = (value: boolean) => {
    setBuyerProfile(prev => {
      const base = prev ?? loadBuyerProfile();
      const updated = { ...base, privacy: { ...base.privacy, shareNameWithSellers: value } };
      saveBuyerProfile(updated);
      return updated;
    });
  };

  const toggleImporterPrivacy = (value: boolean) => {
    setImporterProfile(prev => {
      const base = prev ?? loadImporterProfile();
      const updated = { ...base, privacy: { ...base.privacy, showEmailToBuyers: value } };
      saveImporterProfile(updated);
      return updated;
    });
  };

  const markStepCompleted = (step: VerificationStep) => {
    setImporterProfile(prev => {
      const base = prev ?? loadImporterProfile();
      const nextSteps = base.verification.steps.map(item => {
        if (item.id === step.id) {
          return { ...item, status: 'complete' as const };
        }
        if (item.status === 'upcoming') {
          return { ...item, status: 'current' as const };
        }
        return item;
      });

      const updated: ImporterProfile = {
        ...base,
        verification: {
          ...base.verification,
          steps: nextSteps,
        },
      };
      saveImporterProfile(updated);
      return updated;
    });
    trackEvent('kyc_step_complete', { step: step.id });
    toast({ title: t('profile.toast.stepComplete') });
    setVerificationStep(null);
  };

  const verificationProgress = computeStepProgress(activeImporter.verification.steps);

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex min-h-dvh w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <header className="space-y-4">
          <div className="rounded-3xl border border-border/70 bg-card/90 p-5 shadow-soft">
            <div className="flex items-start gap-4">
              <Avatar className="h-14 w-14 rounded-2xl border border-border/60 shadow-soft">
                <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">{headerName}</h1>
                  <Badge
                    variant="outline"
                    className="rounded-full border-primary/50 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {mode === 'buyer' ? t('roles.buyerBadge') : t('roles.importerBadge')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{maskedContact}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {mode === 'buyer' ? (
                <Badge className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-emerald-50 shadow-soft">
                  <ShieldCheck className="mr-1 h-3.5 w-3.5" />
                  {t('profile.header.escrow')}
                </Badge>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className="rounded-full border-emerald-400 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                    {activeImporter.verified ? t('profile.header.verified') : t('profile.header.verificationInProgress')}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-soft"
                  >
                    <Sparkles className="mr-1 h-3.5 w-3.5 text-amber-500" />
                    {t('profile.header.score', { value: activeImporter.score })}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="rounded-full border-border/70 bg-card px-3 py-1 text-xs font-semibold text-foreground shadow-soft"
                  >
                    <Truck className="mr-1 h-3.5 w-3.5 text-emerald-500" />
                    {t('profile.header.onTime', { value: activeImporter.onTime })}
                  </Badge>
                </div>
              )}
            </div>
          </div>

          {mode === 'buyer' && (
            <div className="grid w-full grid-cols-2 gap-3 sm:grid-cols-4">
              {auctionTiles.map(tile => {
                const { key, ...tileProps } = tile;
                return <SummaryTile key={key} {...tileProps} />;
              })}
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-3xl border border-border/70 bg-card/90 p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-muted-foreground">
                {mode === 'buyer' ? t('profile.subtitleBuyer') : t('profile.subtitleImporter')}
              </p>
              <div className="hidden sm:flex">
                <LanguageToggle />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2">
              {quickActions.map(action => (
                <QuickActionButton key={action.label} {...action} />
              ))}
            </div>
            <div className="sm:hidden">
              <LanguageToggle className="w-full justify-center" />
            </div>
          </div>
        </header>

        <Accordion type="multiple" defaultValue={['personal', 'verification', 'preferences']} className="space-y-3">
          <SectionCard
            value="personal"
            title={mode === 'buyer' ? t('profile.sections.personalBuyer') : t('profile.sections.personalImporter')}
            subtitle={
              mode === 'buyer'
                ? t('profile.sections.personalBuyerHint')
                : t('profile.sections.personalImporterHint', { city: activeImporter.city })
            }
          >
            {mode === 'buyer' ? (
              <>
                <InfoRow
                  label={t('profile.fields.name')}
                  value={activeBuyer.name}
                  onClick={() =>
                    openEdit({
                      mode: 'buyer',
                      field: 'name',
                      label: t('profile.edit.nameTitle'),
                      value: activeBuyer.name,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.phone')}
                  value={activeBuyer.phone}
                  onClick={() =>
                    openEdit({
                      mode: 'buyer',
                      field: 'phone',
                      label: t('profile.edit.phoneTitle'),
                      value: activeBuyer.phone,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.email')}
                  value={activeBuyer.email}
                  onClick={() =>
                    openEdit({
                      mode: 'buyer',
                      field: 'email',
                      label: t('profile.edit.emailTitle'),
                      value: activeBuyer.email,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.defaultPickup')}
                  value={
                    <div className="flex flex-col">
                      <span className="font-medium text-foreground">{buyerDefaultPickup.name}</span>
                      <span className="text-xs text-muted-foreground">{buyerDefaultPickup.city}</span>
                    </div>
                  }
                  hint={t('profile.fields.defaultPickupHint')}
                  actionLabel={t('profile.actions.change')}
                  onClick={() =>
                    openEdit({ mode: 'buyer', field: 'defaultPickup', label: t('profile.edit.pickupTitle'), type: 'pickup' })
                  }
                />
                <InfoRow
                  label={t('profile.fields.deliveryNote')}
                  value={activeBuyer.deliveryNote || t('profile.fields.deliveryNotePlaceholder')}
                  onClick={() =>
                    openEdit({
                      mode: 'buyer',
                      field: 'deliveryNote',
                      label: t('profile.edit.deliveryNoteTitle'),
                      value: activeBuyer.deliveryNote ?? '',
                      type: 'textarea',
                      description: t('profile.edit.deliveryNoteHint'),
                    })
                  }
                />
              </>
            ) : (
              <>
                <InfoRow
                  label={t('profile.fields.storeName')}
                  value={activeImporter.storeName}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'storeName',
                      label: t('profile.edit.storeNameTitle'),
                      value: activeImporter.storeName,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.contactName')}
                  value={activeImporter.contactName}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'contactName',
                      label: t('profile.edit.contactNameTitle'),
                      value: activeImporter.contactName,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.phone')}
                  value={activeImporter.phone}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'storePhone',
                      label: t('profile.edit.phoneTitle'),
                      value: activeImporter.phone,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.email')}
                  value={activeImporter.email}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'storeEmail',
                      label: t('profile.edit.emailTitle'),
                      value: activeImporter.email,
                      type: 'text',
                    })
                  }
                />
                <InfoRow
                  label={t('profile.fields.bio')}
                  value={activeImporter.bio}
                  onClick={() =>
                    openEdit({
                      mode: 'importer',
                      field: 'bio',
                      label: t('profile.edit.bioTitle'),
                      value: activeImporter.bio,
                      type: 'textarea',
                      description: t('profile.edit.bioHint'),
                    })
                  }
                />
                <Button
                  variant="outline"
                  className="w-full justify-between rounded-2xl border-primary/60 text-primary"
                  onClick={() => navigate(`/importers/${activeImporter.id}/profile`)}
                >
                  <span>{t('profile.actions.publicProfile')}</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </SectionCard>

          <SectionCard
            value="verification"
            title={t('profile.sections.verification')}
            subtitle={
              mode === 'buyer'
                ? t('profile.sections.verificationBuyerHint')
                : t('profile.sections.verificationImporterHint')
            }
          >
            {mode === 'buyer' ? (
              <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <BadgeCheck className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      {activeBuyer.kyc.status === 'verified'
                        ? t('profile.verification.verified')
                        : t('profile.verification.pending')}
                    </p>
                    <p className="text-xs text-muted-foreground">{activeBuyer.kyc.helper}</p>
                  </div>
                </div>
                <Separator className="bg-border/60" />
                <p className="text-sm text-muted-foreground">{activeBuyer.kyc.lastChecked}</p>
                <div className="flex items-center gap-2 rounded-2xl bg-emerald-50/80 px-4 py-3 text-sm text-emerald-900">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{t('profile.verification.buyerExplainer')}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t('profile.verification.progress')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.verification.progressHint', { value: verificationProgress })}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full border-primary/40 text-sm text-primary">
                      {verificationProgress}%
                    </Badge>
                  </div>
                  <div className="mt-4 h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${verificationProgress}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  {activeImporter.verification.steps.map(step => (
                    <div
                      key={step.id}
                      className={cn(
                        'flex items-start justify-between gap-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft',
                        step.status === 'complete' && 'border-emerald-200 bg-emerald-50/60',
                      )}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {step.status === 'complete' ? (
                            <Check className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-amber-500" />
                          )}
                          <p className="text-sm font-semibold text-foreground">{step.label}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">{step.description}</p>
                      </div>
                      {step.status === 'complete' ? (
                        <Badge variant="outline" className="rounded-full border-emerald-400 text-xs text-emerald-700">
                          {t('profile.verification.stepDone')}
                        </Badge>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => setVerificationStep(step)}
                        >
                          {t('profile.verification.reviewStep')}
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
                  <Sparkles className="mr-2 inline h-4 w-4" />
                  {t('profile.verification.importerExplainer')}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard value="preferences" title={t('profile.sections.preferences')}>
            <div className="space-y-4 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('profile.preferences.language')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.preferences.languageHint')}</p>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-border/70 px-3 py-1 text-xs font-semibold">
                  <Globe2 className="h-4 w-4" />
                  <span className="uppercase">{locale}</span>
                </div>
              </div>
              <LanguageToggle className="w-full justify-center" />
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <BellRing className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('profile.preferences.notifications')}</p>
              </div>
              {mode === 'buyer' ? (
                <div className="space-y-3">
                  <ToggleRow
                    label={t('profile.preferences.orderUpdates')}
                    hint={t('profile.preferences.orderUpdatesHint')}
                    checked={activeBuyer.notifications.orderUpdates}
                    onCheckedChange={value => updateBuyerNotifications('orderUpdates', value)}
                  />
                  <ToggleRow
                    label={t('profile.preferences.arrivals')}
                    hint={t('profile.preferences.arrivalsHint')}
                    checked={activeBuyer.notifications.arrivals}
                    onCheckedChange={value => updateBuyerNotifications('arrivals', value)}
                  />
                  <ToggleRow
                    label={t('profile.preferences.refunds')}
                    hint={t('profile.preferences.refundsHint')}
                    checked={activeBuyer.notifications.refunds}
                    onCheckedChange={value => updateBuyerNotifications('refunds', value)}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <ToggleRow
                    label={t('profile.preferences.buyerUpdates')}
                    hint={t('profile.preferences.buyerUpdatesHint')}
                    checked={activeImporter.notifications.buyerUpdates}
                    onCheckedChange={value => updateImporterNotifications('buyerUpdates', value)}
                  />
                  <ToggleRow
                    label={t('profile.preferences.payouts')}
                    hint={t('profile.preferences.payoutsHint')}
                    checked={activeImporter.notifications.payouts}
                    onCheckedChange={value => updateImporterNotifications('payouts', value)}
                  />
                  <ToggleRow
                    label={t('profile.preferences.disputes')}
                    hint={t('profile.preferences.disputesHint')}
                    checked={activeImporter.notifications.disputes}
                    onCheckedChange={value => updateImporterNotifications('disputes', value)}
                  />
                </div>
              )}
            </div>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('profile.preferences.privacy')}</p>
              </div>
              {mode === 'buyer' ? (
                <ToggleRow
                  label={t('profile.preferences.buyerPrivacy')}
                  hint={t('profile.preferences.buyerPrivacyHint')}
                  checked={activeBuyer.privacy.shareNameWithSellers}
                  onCheckedChange={toggleBuyerPrivacy}
                />
              ) : (
                <ToggleRow
                  label={t('profile.preferences.importerPrivacy')}
                  hint={t('profile.preferences.importerPrivacyHint')}
                  checked={activeImporter.privacy.showEmailToBuyers}
                  onCheckedChange={toggleImporterPrivacy}
                />
              )}
            </div>
          </SectionCard>

          <SectionCard value="logistics" title={t('profile.sections.logistics')}>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <Truck className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('profile.logistics.pickupsTitle')}</p>
              </div>
              <div className="space-y-3">
                {(mode === 'buyer' ? buyerPickupOptions : importerPickupOptions).map(pickup => {
                  const isDefault =
                    (mode === 'buyer' ? activeBuyer.defaultPickupId : activeImporter.defaultPickupId) === pickup.id;
                  return (
                    <div
                      key={pickup.id}
                      className={cn(
                        'flex items-start justify-between gap-3 rounded-2xl border border-border/60 bg-background/60 p-4 shadow-soft',
                        isDefault && 'border-primary/50',
                      )}
                    >
                      <div>
                        <p className="text-sm font-semibold text-foreground">{pickup.name}</p>
                        <p className="text-xs text-muted-foreground">{pickup.address}</p>
                        <p className="text-xs text-muted-foreground">{pickup.city}</p>
                        {pickup.phone ? (
                          <p className="mt-1 text-xs text-primary">{pickup.phone}</p>
                        ) : null}
                        {pickup.note ? (
                          <p className="mt-1 text-xs text-muted-foreground/80">{pickup.note}</p>
                        ) : null}
                      </div>
                      <Badge
                        variant={isDefault ? 'default' : 'outline'}
                        className={cn(
                          'rounded-full px-3 py-1 text-[11px] font-semibold',
                          isDefault ? 'bg-primary text-primary-foreground' : 'border-border/70 text-muted-foreground',
                        )}
                      >
                        {isDefault ? t('profile.logistics.default') : t('profile.actions.setDefault')}
                      </Badge>
                    </div>
                  );
                })}
              </div>
              <Button
                variant="outline"
                className="w-full rounded-2xl"
                onClick={() =>
                  openEdit({
                    mode,
                    field: 'defaultPickup',
                    label: t('profile.edit.pickupTitle'),
                    type: 'pickup',
                  })
                }
              >
                <MapPin className="mr-2 h-4 w-4" />
                {t('profile.logistics.changeDefault')}
              </Button>
            </div>
          </SectionCard>

          <SectionCard value="security" title={t('profile.sections.security')}>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('profile.security.devicesTitle')}</p>
              </div>
              <div className="space-y-3">
                {(mode === 'buyer' ? activeBuyer.devices : activeImporter.devices).map(device => (
                  <div key={device.id} className="flex items-center justify-between rounded-2xl bg-background/70 px-4 py-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{device.label}</p>
                      <p className="text-xs text-muted-foreground">{device.location}</p>
                      <p className="text-xs text-muted-foreground">{device.lastActive}</p>
                    </div>
                    {device.current ? (
                      <Badge variant="outline" className="rounded-full border-emerald-400 text-xs text-emerald-700">
                        {t('profile.security.thisDevice')}
                      </Badge>
                    ) : null}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" className="flex-1 rounded-full">
                  <LogOut className="mr-2 h-4 w-4" />
                  {t('profile.security.logoutAll')}
                </Button>
                <Button variant="ghost" className="flex-1 justify-center rounded-full text-muted-foreground">
                  <Trash2 className="mr-2 h-4 w-4" />
                  {t('profile.security.deleteAccount')}
                </Button>
              </div>
            </div>
          </SectionCard>

          <SectionCard value="help" title={t('profile.sections.help')}>
            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <InfoRow label={t('profile.help.refundPolicy')} value={t('profile.help.refundPolicyHint')} />
              <InfoRow label={t('profile.help.buyerProtection')} value={t('profile.help.buyerProtectionHint')} />
              <InfoRow
                label={t('profile.help.support')}
                value={t('profile.help.supportHint')}
                hint={`${t('profile.help.phoneLabel')}: +237 651 222 333 • ${t('profile.help.emailLabel')}: support@prolist.africa`}
              />
              <Separator className="bg-border/60" />
              <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                <span>{t('profile.help.terms')}</span>
                <span>•</span>
                <span>{t('profile.help.privacy')}</span>
              </div>
            </div>
          </SectionCard>
        </Accordion>
      </div>

      <Drawer open={activeFlow === 'orders'} onOpenChange={open => (!open ? closeQuickFlow() : undefined)}>
        <DrawerContent className="rounded-t-3xl">
          <DrawerHeader className="px-6 pt-6 text-left">
            <DrawerTitle>{t('profile.ordersFlow.title')}</DrawerTitle>
            <DrawerDescription>{t('profile.ordersFlow.subtitle')}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {orderFilterOptions.map(option => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setOrderFilter(option.id)}
                    className={cn(
                      'rounded-full border border-border/70 px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors',
                      orderFilter === option.id && 'border-primary bg-primary text-primary-foreground shadow-soft',
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              <div className="relative ml-auto w-full max-w-[220px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={orderSearch}
                  onChange={event => setOrderSearch(event.target.value)}
                  placeholder={t('profile.ordersFlow.searchPlaceholder')}
                  className="rounded-full border-border/70 bg-muted/40 pl-9"
                />
              </div>
            </div>
            <div className="space-y-3">
              {isOrdersEmpty ? (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-border/60 bg-muted/40 px-6 py-12 text-center">
                  <Package className="h-8 w-8 text-muted-foreground" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">{t('profile.ordersFlow.emptyTitle')}</p>
                    <p className="text-xs text-muted-foreground">
                      {hasStoredOrders ? t('profile.ordersFlow.emptyFiltered') : t('profile.ordersFlow.emptySubtitle')}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      closeQuickFlow();
                      navigate('/');
                    }}
                    className="rounded-full"
                  >
                    {t('profile.ordersFlow.emptyAction')}
                  </Button>
                </div>
              ) : (
                filteredOrders.map(order => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => handleOpenOrder(order.id)}
                    className="flex items-stretch gap-3 rounded-2xl border border-border/70 bg-card/80 p-3 text-left shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 active:translate-y-[1px]"
                  >
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
                      <img src={order.image} alt={order.title} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <div className="flex flex-1 flex-col justify-between gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="line-clamp-2 text-sm font-semibold text-foreground">{order.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {order.quantity} × {currencyFormatter.format(order.unitPrice)}
                          </p>
                        </div>
                        <span
                          className={cn(
                            'whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold shadow-soft',
                            orderStatusMeta[order.status].className,
                          )}
                        >
                          {orderStatusMeta[order.status].label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-medium text-amber-600">
                        <Clock className="h-3.5 w-3.5" />
                        <span>{getOrderEtaLabel(order)}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t('profile.ordersFlow.pickupLabel', { hub: order.pickupHub })}
                      </p>
                    </div>
                    <ChevronRight className="mt-4 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  </button>
                ))
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={activeFlow === 'pickups'} onOpenChange={open => (!open ? closeQuickFlow() : undefined)}>
        <DrawerContent className="rounded-t-3xl">
          <DrawerHeader className="px-6 pt-6 text-left">
            <DrawerTitle>{t('profile.pickupsFlow.title')}</DrawerTitle>
            <DrawerDescription>{t('profile.pickupsFlow.subtitle')}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={pickupSearch}
                onChange={event => setPickupSearch(event.target.value)}
                placeholder={t('profile.pickupsFlow.searchPlaceholder')}
                className="rounded-2xl border-border/70 bg-muted/40 pl-10"
              />
            </div>
            <div className="space-y-3">
              {sortedPickupOptions.map(pickup => {
                const isDefault = pickup.id === activeBuyer.defaultPickupId;
                const selected = pendingPickupId === pickup.id;
                const phoneHref = pickup.phone ? pickup.phone.replace(/\s+/g, '') : '';
                return (
                  <button
                    key={pickup.id}
                    type="button"
                    onClick={() => setPendingPickupId(pickup.id)}
                    className={cn(
                      'flex items-start justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 text-left shadow-soft transition-all hover:border-primary/40',
                      selected && 'border-primary bg-primary/10',
                    )}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{pickup.name}</p>
                        {isDefault ? (
                          <Badge className="rounded-full bg-emerald-600/90 text-[11px] text-emerald-50">
                            {t('profile.pickupsFlow.defaultBadge')}
                          </Badge>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted-foreground">{pickup.address}</p>
                      <p className="text-xs text-muted-foreground">{pickup.city}</p>
                      {pickup.note ? (
                        <p className="text-xs text-muted-foreground/80">{pickup.note}</p>
                      ) : null}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex items-center gap-2">
                        {selected ? (
                          <CheckCircle className="h-5 w-5 text-primary" />
                        ) : (
                          <CircleIcon />
                        )}
                      </div>
                      {pickup.phone ? (
                        <a
                          href={`tel:${phoneHref}`}
                          onClick={event => event.stopPropagation()}
                          className="flex items-center gap-1 rounded-full border border-border/60 bg-muted px-2 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80"
                        >
                          <PhoneCall className="h-3.5 w-3.5" />
                          {t('profile.pickupsFlow.callAction')}
                        </a>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>

            {addingHub ? (
              <div className="space-y-3 rounded-2xl border border-dashed border-border/70 bg-muted/20 p-4">
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold text-muted-foreground" htmlFor="new-hub-name">
                    {t('profile.pickupsFlow.form.name')}
                  </Label>
                  <Input
                    id="new-hub-name"
                    value={newHub.name}
                    onChange={event => setNewHub(prev => ({ ...prev, name: event.target.value }))}
                    className="rounded-2xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold text-muted-foreground" htmlFor="new-hub-address">
                    {t('profile.pickupsFlow.form.address')}
                  </Label>
                  <Input
                    id="new-hub-address"
                    value={newHub.address}
                    onChange={event => setNewHub(prev => ({ ...prev, address: event.target.value }))}
                    className="rounded-2xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold text-muted-foreground" htmlFor="new-hub-city">
                    {t('profile.pickupsFlow.form.city')}
                  </Label>
                  <Input
                    id="new-hub-city"
                    value={newHub.city}
                    onChange={event => setNewHub(prev => ({ ...prev, city: event.target.value }))}
                    className="rounded-2xl"
                  />
                </div>
                <div className="grid gap-2">
                  <Label className="text-xs font-semibold text-muted-foreground" htmlFor="new-hub-phone">
                    {t('profile.pickupsFlow.form.phone')}
                  </Label>
                  <Input
                    id="new-hub-phone"
                    value={newHub.phone}
                    onChange={event => setNewHub(prev => ({ ...prev, phone: event.target.value }))}
                    className="rounded-2xl"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleAddPickupHub} className="flex-1 rounded-full">
                    {t('profile.pickupsFlow.form.save')}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    className="flex-1 rounded-full"
                    onClick={() => {
                      setAddingHub(false);
                      setNewHub({ name: '', address: '', city: '', phone: '' });
                    }}
                  >
                    {t('common.cancel')}
                  </Button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setAddingHub(true)}
                className="flex items-center gap-2 text-sm font-semibold text-primary"
              >
                <PlusCircle className="h-4 w-4" />
                {t('profile.pickupsFlow.addNew')}
              </button>
            )}
          </div>
          <DrawerFooter className="px-6 pb-6">
            <Button
              onClick={handleConfirmPickup}
              className="w-full rounded-full text-base font-semibold"
              disabled={!pendingPickupId || pendingPickupId === activeBuyer.defaultPickupId}
            >
              {t('profile.pickupsFlow.confirm')}
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full rounded-full">
                {t('common.cancel')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={activeFlow === 'payments'} onOpenChange={open => (!open ? closeQuickFlow() : undefined)}>
        <DrawerContent className="rounded-t-3xl">
          <DrawerHeader className="px-6 pt-6 text-left">
            <DrawerTitle>{t('profile.paymentsFlow.title')}</DrawerTitle>
            <DrawerDescription>{t('profile.paymentsFlow.subtitle')}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-6 pb-6">
            <div className="rounded-2xl bg-primary/10 px-4 py-3 text-sm text-primary">
              {t('profile.paymentsFlow.note')}
            </div>
            <RadioGroup value={walletSelection ?? ''} onValueChange={value => setWalletSelection(value as PreferredWallet)}>
              {WALLET_OPTIONS.map(option => (
                <Label
                  key={option.id}
                  htmlFor={`wallet-${option.id}`}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft transition-all hover:border-primary/40',
                    walletSelection === option.id && 'border-primary bg-primary/10',
                  )}
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t(option.labelKey)}</p>
                    <p className="text-xs text-muted-foreground">{t(option.helperKey)}</p>
                  </div>
                  <RadioGroupItem value={option.id} id={`wallet-${option.id}`} className="h-5 w-5" />
                </Label>
              ))}
            </RadioGroup>
            <Button
              type="button"
              variant={notifyActive ? 'outline' : 'secondary'}
              className={cn('w-full rounded-full', notifyActive && 'border-emerald-300 text-emerald-700')}
              onClick={handleNotifyMe}
            >
              {notifyActive ? (
                <span className="flex items-center justify-center gap-2">
                  <CheckCircle className="h-4 w-4" />
                  {t('profile.paymentsFlow.notifyActive')}
                </span>
              ) : (
                t('profile.paymentsFlow.notifyCta')
              )}
            </Button>
            <div className="rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">{t('profile.paymentsFlow.faqTitle')}</p>
                  <p className="text-xs text-muted-foreground">{t('profile.paymentsFlow.faqAnswer')}</p>
                </div>
              </div>
            </div>
          </div>
          <DrawerFooter className="px-6 pb-6">
            <Button onClick={handleSaveWallet} className="w-full rounded-full text-base font-semibold">
              {t('profile.paymentsFlow.save')}
            </Button>
            <DrawerClose asChild>
              <Button variant="ghost" className="w-full rounded-full">
                {t('common.cancel')}
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <Drawer open={activeFlow === 'support'} onOpenChange={open => (!open ? closeQuickFlow() : undefined)}>
        <DrawerContent className="rounded-t-3xl">
          <DrawerHeader className="px-6 pt-6 text-left">
            <DrawerTitle>{t('profile.supportFlow.title')}</DrawerTitle>
            <DrawerDescription>{t('profile.supportFlow.subtitle')}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-6 pb-6">
            {recentOrder ? (
              <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">{recentOrder.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('profile.supportFlow.recentOrderStatus', {
                        status: orderStatusMeta[recentOrder.status].label,
                      })}
                    </p>
                  </div>
                  <Badge className="rounded-full bg-primary/10 text-primary">
                    {orderStatusMeta[recentOrder.status].label}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" className="rounded-full" onClick={() => handleOpenOrder(recentOrder.id)}>
                    {t('profile.supportFlow.viewStatus')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleOpenDispute(recentOrder.id)}
                  >
                    {t('profile.supportFlow.openDispute')}
                  </Button>
                </div>
              </div>
            ) : null}

            <Button
              variant="ghost"
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-border/70 bg-card/80 px-4 py-3"
              onClick={() => {
                closeQuickFlow();
                navigate('/policy/refunds');
              }}
            >
              <span className="text-left">
                <p className="text-sm font-semibold text-foreground">{t('profile.supportFlow.refundPolicyTitle')}</p>
                <p className="text-xs text-muted-foreground">{t('profile.supportFlow.refundPolicySubtitle')}</p>
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Button>

            <div className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="flex items-center gap-3">
                <LifeBuoy className="h-5 w-5 text-primary" />
                <p className="text-sm font-semibold text-foreground">{t('profile.supportFlow.contactTitle')}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {supportContacts.map(contact => {
                  const Icon = contact.icon;
                  return (
                    <a
                      key={contact.id}
                      href={contact.href}
                      target={contact.href.startsWith('http') ? '_blank' : undefined}
                      rel={contact.href.startsWith('http') ? 'noreferrer' : undefined}
                      onClick={() => trackEvent('profile_support_contact', { channel: contact.id })}
                      className="flex items-center gap-2 rounded-full border border-border/70 bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/80"
                    >
                      <Icon className="h-4 w-4" />
                      {contact.label}
                    </a>
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">{t('profile.supportFlow.hours')}</p>
              <p className="text-xs font-medium text-primary">{t('profile.supportFlow.promise')}</p>
              {!isOnline ? (
                <p className="rounded-2xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
                  {t('profile.supportFlow.offline')}
                </p>
              ) : null}
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft">
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">{t('profile.supportFlow.form.topic')}</Label>
                <Select value={supportTopic} onValueChange={value => setSupportTopic(value as SupportTopic)}>
                  <SelectTrigger className="rounded-2xl">
                    <SelectValue placeholder={t('profile.supportFlow.form.topicPlaceholder')} />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPORT_TOPIC_OPTIONS.map(option => (
                      <SelectItem key={option.id} value={option.id}>
                        {t(option.labelKey)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground" htmlFor="support-message">
                  {t('profile.supportFlow.form.message')}
                </Label>
                <Textarea
                  id="support-message"
                  value={supportMessage}
                  onChange={event => setSupportMessage(event.target.value)}
                  rows={4}
                  placeholder={t('profile.supportFlow.form.placeholder')}
                  className="rounded-2xl"
                />
              </div>
              <Button type="submit" className="w-full rounded-full">
                {t('profile.supportFlow.form.submit')}
              </Button>
            </form>
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={Boolean(editState)} onOpenChange={open => (!open ? closeEdit() : undefined)}>
        <DrawerContent className="rounded-t-3xl">
          {editState ? (
            <>
              <DrawerHeader className="px-6 pt-6 text-left">
                <DrawerTitle>{editState.label}</DrawerTitle>
                {('description' in editState && editState.description) ? <DrawerDescription>{editState.description}</DrawerDescription> : null}
              </DrawerHeader>
              <div className="px-6">
                {editState.type === 'text' ? (
                  <Input
                    autoFocus
                    value={editValue}
                    onChange={event => setEditValue(event.target.value)}
                    className="rounded-2xl"
                  />
                ) : editState.type === 'textarea' ? (
                  <Textarea
                    value={editValue}
                    onChange={event => setEditValue(event.target.value)}
                    rows={4}
                    className="rounded-2xl"
                  />
                ) : (
                  <div className="space-y-3 pb-6">
                    {(editState.mode === 'buyer' ? buyerPickupOptions : importerPickupOptions).map(pickup => {
                      const selected =
                        editState.mode === 'buyer' ? buyerSelection === pickup.id : importerSelection === pickup.id;
                      return (
                        <button
                          type="button"
                          key={pickup.id}
                          onClick={() =>
                            editState.mode === 'buyer'
                              ? setBuyerSelection(pickup.id)
                              : setImporterSelection(pickup.id)
                          }
                          className={cn(
                            'w-full rounded-2xl border border-border/70 bg-card/80 p-4 text-left shadow-soft transition-all hover:border-primary/40',
                            selected && 'border-primary bg-primary/10',
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-foreground">{pickup.name}</p>
                              <p className="text-xs text-muted-foreground">{pickup.address}</p>
                            </div>
                            {selected ? (
                              <CheckCircle2 className="h-5 w-5 text-primary" />
                            ) : (
                              <CircleIcon />
                            )}
                          </div>
                          <p className="mt-2 text-xs text-muted-foreground">{pickup.city}</p>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
              <DrawerFooter className="px-6 pb-6">
                <Button onClick={handleSaveEdit} className="w-full rounded-full text-base font-semibold">
                  {t('profile.actions.save')}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" className="w-full rounded-full">
                    {t('common.cancel')}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>

      <Drawer open={Boolean(verificationStep)} onOpenChange={open => (!open ? setVerificationStep(null) : undefined)}>
        <DrawerContent className="rounded-t-3xl">
          {verificationStep ? (
            <>
              <DrawerHeader className="px-6 pt-6 text-left">
                <DrawerTitle>{verificationStep.label}</DrawerTitle>
                <DrawerDescription>{verificationStep.description}</DrawerDescription>
              </DrawerHeader>
              <div className="px-6 text-sm text-muted-foreground">
                <p>{t('profile.verification.stepDetail')}</p>
              </div>
              <DrawerFooter className="px-6 pb-6">
                <Button
                  className="w-full rounded-full"
                  onClick={() => markStepCompleted(verificationStep)}
                >
                  {t('profile.verification.completeStep')}
                </Button>
                <DrawerClose asChild>
                  <Button variant="ghost" className="w-full rounded-full">
                    {t('common.cancel')}
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          ) : null}
        </DrawerContent>
      </Drawer>
    </main>
  );
};

const CircleIcon = () => <div className="h-5 w-5 rounded-full border border-border/60" />;

const ToggleRow = ({
  label,
  hint,
  checked,
  onCheckedChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onCheckedChange: (value: boolean) => void;
}) => (
  <div className="flex items-center justify-between gap-4 rounded-2xl bg-background/70 px-4 py-3">
    <div>
      <p className="text-sm font-semibold text-foreground">{label}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default Profile;

