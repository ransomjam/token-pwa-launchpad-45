import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type SyntheticEvent,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Info,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  Star,
  XCircle,
} from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from '@/components/ui/carousel';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import ShareSheet from '@/components/share/ShareSheet';
import { activateDemoMode, DEMO_PICKUPS, getDemoListingById, isDemoActive, primaryDemoListing } from '@/lib/demoMode';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';
import { ensureAbsoluteUrl, type ListingShareContent } from '@/lib/share';
import type { ListingSummary, PickupPoint } from '@/types';

const laneTone = (pct: number) => {
  if (pct >= 0.9) return 'green' as const;
  if (pct >= 0.75) return 'amber' as const;
  return 'red' as const;
};

const laneStyles = {
  green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  amber: 'border-amber-200 bg-amber-50 text-amber-700',
  red: 'border-rose-200 bg-rose-50 text-rose-700',
} as const;

const REVIEW_SNIPPETS = [
  {
    id: 'rev-1',
    name: 'Flora B.',
    location: 'Douala',
    rating: 5,
    text: 'Pool locked fast and the cartons landed a day early. Clear updates all through.',
  },
  {
    id: 'rev-2',
    name: 'Elvis N.',
    location: 'Yaoundé',
    rating: 4,
    text: 'Escrow made the group buy stress-free. Pickup at Akwa hub was seamless.',
  },
  {
    id: 'rev-3',
    name: 'Marion K.',
    location: 'Bafoussam',
    rating: 5,
    text: 'Lane stayed true to ETA. Packaging was premium—customers loved the unboxing.',
  },
] as const;

const fetchListingById = async (id: string) => {
  const response = await fetch(`/api/listings/${id}`);
  if (!response.ok) {
    throw new Error('Listing not found');
  }
  return response.json() as Promise<ListingSummary>;
};

const fetchPickupPoints = async () => {
  const response = await fetch('/api/pickups');
  if (!response.ok) {
    throw new Error('Failed to load pickup points');
  }
  const json = await response.json() as { items: PickupPoint[] };
  return json.items;
};

const formatLockMeta = (iso: string) => {
  const now = Date.now();
  const lockTime = new Date(iso).getTime();
  if (Number.isNaN(lockTime)) {
    return { label: 'Locks soon', hoursUntilLock: 0 };
  }
  const diff = lockTime - now;
  if (diff <= 0) {
    return { label: 'Locks now', hoursUntilLock: 0 };
  }
  const minutes = Math.floor(diff / 60000);
  if (minutes >= 1440) {
    const days = Math.round(minutes / 1440);
    return { label: `Locks in ${days} day${days > 1 ? 's' : ''}`, hoursUntilLock: minutes / 60 };
  }
  if (minutes >= 60) {
    const hours = Math.max(1, Math.round(minutes / 60));
    return { label: `Locks in ${hours} hour${hours > 1 ? 's' : ''}`, hoursUntilLock: hours };
  }
  const safeMinutes = Math.max(1, minutes);
  return { label: `Locks in ${safeMinutes} min`, hoursUntilLock: safeMinutes / 60 };
};

const formatEtaChip = (min: number, max: number) => `${min}–${max} days`;

const ListingDetails = () => {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale } = useI18n();
  const id = params.id;

  const [qty, setQty] = useState(1);
  const [activeTab, setActiveTab] = useState('description');
  const [selectedPickup, setSelectedPickup] = useState<PickupPoint | null>(null);
  const [pendingPickupId, setPendingPickupId] = useState<string | null>(null);
  const [pickupSheetOpen, setPickupSheetOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [importerModalOpen, setImporterModalOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const heroRef = useRef<HTMLDivElement | null>(null);
  const viewTrackedRef = useRef(false);

  const {
    data: listingData,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => fetchListingById(id!),
    enabled: Boolean(id),
  });

  const {
    data: pickupData,
    isError: pickupError,
    isLoading: pickupLoading,
  } = useQuery({
    queryKey: ['pickups'],
    queryFn: fetchPickupPoints,
    staleTime: 1000 * 60 * 10,
  });

  const [demoActiveState, setDemoActiveState] = useState(() => isDemoActive);

  const listingQueryResolved = Boolean(id) ? isError || listingData !== undefined : true;
  const listingFallbackReason = !id || (!isLoading && listingQueryResolved && (isError || listingData === undefined));
  const pickupQueryResolved = pickupError || pickupData !== undefined;
  const pickupFallbackReason = !pickupLoading && pickupQueryResolved && (pickupError || (pickupData?.length ?? 0) === 0);

  useEffect(() => {
    if (!demoActiveState && (listingFallbackReason || pickupFallbackReason)) {
      activateDemoMode();
      setDemoActiveState(true);
    }
  }, [demoActiveState, listingFallbackReason, pickupFallbackReason]);

  const shouldUseDemoListing = demoActiveState || listingFallbackReason;
  const shouldUseDemoPickups = demoActiveState || pickupFallbackReason;

  const fallbackListing = useMemo(() => getDemoListingById(id) ?? primaryDemoListing, [id]);
  const listing = shouldUseDemoListing ? fallbackListing : listingData ?? fallbackListing;
  const pickupOptions = shouldUseDemoPickups ? DEMO_PICKUPS : pickupData ?? [];
  const isListingLoading = isLoading && !shouldUseDemoListing;

  const shareContent = useMemo<ListingShareContent | null>(() => {
    if (!listing) return null;
    const origin = typeof window !== 'undefined' ? window.location.origin : undefined;
    const absoluteOrigin = ensureAbsoluteUrl(origin);
    const trimmedOrigin = absoluteOrigin.endsWith('/') ? absoluteOrigin.slice(0, -1) : absoluteOrigin;
    return {
      id: listing.id,
      title: listing.title,
      priceXAF: listing.priceXAF,
      etaMin: listing.etaDays.min,
      etaMax: listing.etaDays.max,
      laneCode: listing.lane.code,
      onTimePct: listing.lane.onTimePct * 100,
      committed: listing.moq.committed,
      target: listing.moq.target,
      image: listing.images[0] ?? '/placeholder.svg',
      shareUrls: {
        short: `${trimmedOrigin}/l/${listing.id}`,
        long: `${trimmedOrigin}/listings/${listing.id}`,
      },
      isDemo: shouldUseDemoListing,
    };
  }, [listing, shouldUseDemoListing]);

  useEffect(() => {
    if (pickupOptions.length === 0) return;
    if (!selectedPickup || !pickupOptions.some(point => point.id === selectedPickup.id)) {
      setSelectedPickup(pickupOptions[0]);
    }
  }, [pickupOptions, selectedPickup]);

  useEffect(() => {
    if (!listing || viewTrackedRef.current) return;
    trackEvent('listing_view', { id: listing.id });
    viewTrackedRef.current = true;
  }, [listing]);

  useEffect(() => {
    if (!carouselApi) return;
    const onSelect = () => {
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    carouselApi.on('select', onSelect);
    onSelect();
    return () => {
      carouselApi.off('select', onSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    const el = heroRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          setShowStickyCta(!entry.isIntersecting);
        });
      },
      { threshold: 0.1 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [heroRef]);

  const priceFormatter = useMemo(() => {
    const localeKey = locale === 'fr' ? 'fr-CM' : 'en-US';
    return new Intl.NumberFormat(localeKey, {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    });
  }, [locale]);

  const handleQtyChange = useCallback(
    (delta: number) => {
      setQty(prev => {
        const next = Math.min(5, Math.max(1, prev + delta));
        return next;
      });
    },
    [],
  );

  const handlePreorder = useCallback(() => {
    if (!listing) return;
    trackEvent('cta_preorder_click', { id: listing.id, qty });
    navigate(`/checkout/${listing.id}`, {
      state: {
        listingId: listing.id,
        qty,
        pickupPointId: selectedPickup?.id,
      },
    });
  }, [listing, navigate, qty, selectedPickup]);

  const handlePickupOpen = useCallback(() => {
    if (selectedPickup) {
      setPendingPickupId(selectedPickup.id);
    }
    setPickupSheetOpen(true);
    if (listing) {
      trackEvent('pickup_select_open', { id: listing.id });
    }
  }, [listing, selectedPickup]);

  const handlePickupConfirm = useCallback(() => {
    if (pickupOptions.length === 0) {
      setPickupSheetOpen(false);
      return;
    }
    const next = pickupOptions.find(point => point.id === pendingPickupId) ?? pickupOptions[0];
    setSelectedPickup(next);
    setPickupSheetOpen(false);
    if (listing) {
      trackEvent('pickup_select_confirm', { id: listing.id, pickupPointId: next.id });
    }
    toast({ description: `${next.name} selected.` });
  }, [listing, pendingPickupId, pickupOptions, toast]);

  const subtotal = listing ? listing.priceXAF * qty : 0;

  if (isListingLoading) {
    return (
      <main className="min-h-dvh bg-background px-6 py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-6 w-40 rounded-full" />
          </div>
          <Skeleton className="h-72 w-full rounded-3xl" />
          <Skeleton className="h-10 w-64 rounded-full" />
          <Skeleton className="h-20 w-full rounded-3xl" />
          <Skeleton className="h-48 w-full rounded-3xl" />
        </div>
      </main>
    );
  }

  if (!listing) {
    return (
      <main className="min-h-dvh bg-background px-6 py-8">
        <div className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-4 text-center">
          <p className="text-lg font-semibold text-foreground">Listing unavailable</p>
          <p className="text-sm text-muted-foreground">
            We could not load this listing. Please return to the feed and try again.
          </p>
          <Button onClick={() => navigate(-1)}>Close</Button>
        </div>
      </main>
    );
  }

  const etaChip = formatEtaChip(listing.etaDays.min, listing.etaDays.max);
  const laneVariant = laneTone(listing.lane.onTimePct);
  const LaneIcon = laneVariant === 'green' ? CheckCircle2 : laneVariant === 'amber' ? AlertTriangle : XCircle;
  const progressPercent = Math.min(100, Math.round((listing.moq.committed / listing.moq.target) * 100));
  const lockMeta = formatLockMeta(listing.moq.lockAt);
  const progressLabel = `${listing.moq.committed}/${listing.moq.target} locked`;
  const lockCaption = `${lockMeta.label} • ${listing.moq.committed}/${listing.moq.target} committed`;
  const subtotalLabel = priceFormatter.format(subtotal);
  const unitPriceLabel = priceFormatter.format(listing.priceXAF);
  const [origin = '', destination = '', modeRaw = ''] = listing.lane.code.split('-');
  const laneMode = modeRaw.toLowerCase() === 'air' ? 'Air' : 'Sea';
  const nearLockHint = progressPercent <= 20 && lockMeta.hoursUntilLock <= 72;
  const handleImageError = useCallback((event: SyntheticEvent<HTMLImageElement>) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = '/placeholder.svg';
  }, []);

  return (
    <TooltipProvider delayDuration={0}>
      <main className="min-h-dvh bg-background pb-28">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-8">
          <div className="sticky top-4 z-20">
            <div className="relative">
              <div aria-hidden className="absolute inset-0 rounded-3xl bg-background shadow-sm" />
              <header className="relative flex items-center gap-3 px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 rounded-full border"
                  onClick={() => navigate(-1)}
                >
                  <ArrowLeft className="h-5 w-5" />
                  <span className="sr-only">Back</span>
                </Button>
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Listing</p>
                  <h1 className="line-clamp-2 text-xl font-semibold text-foreground">{listing.title}</h1>
                </div>
              </header>
            </div>
          </div>

          <section ref={heroRef} className="space-y-5">
            <div className="rounded-3xl bg-card p-3 shadow-soft">
              <Carousel setApi={setCarouselApi} className="rounded-2xl">
                <CarouselContent>
                  {listing.images.map(image => (
                    <CarouselItem key={image}>
                      <AspectRatio ratio={4 / 3} className="overflow-hidden rounded-2xl bg-muted">
                        <img
                          src={image}
                          alt={listing.title}
                          loading="lazy"
                          decoding="async"
                          onError={handleImageError}
                          className="h-full w-full object-cover"
                        />
                      </AspectRatio>
                    </CarouselItem>
                  ))}
                </CarouselContent>
              </Carousel>
              <div className="mt-3 flex items-center justify-center gap-2">
                {listing.images.map((image, index) => (
                  <button
                    key={image}
                    type="button"
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-all',
                      currentSlide === index ? 'w-6 bg-foreground' : 'bg-muted-foreground/30',
                    )}
                    onClick={() => carouselApi?.scrollTo(index)}
                    aria-label={`Show image ${index + 1}`}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <h2 className="line-clamp-2 text-2xl font-semibold text-foreground">{listing.title}</h2>
                <p className="text-sm text-muted-foreground">Per unit price</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold tracking-tight text-foreground">{unitPriceLabel}</p>
                <p className="text-xs text-muted-foreground">Exclusive of duties</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-3 text-sm font-medium text-foreground shadow-soft">
              <span className="inline-flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-emerald-600" />
                Protected by Escrow
              </span>
              <span className="inline-flex items-center gap-2">
                <Clock3 className="h-4 w-4 text-sky-600" />
                Auto-refund if late
              </span>
              <span
                className={cn(
                  'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm',
                  laneStyles[laneVariant],
                )}
                style={{ animationDuration: '80ms' }}
              >
                <LaneIcon className="h-3.5 w-3.5" />
                {`${origin}→${destination} ${laneMode} • ${Math.round(listing.lane.onTimePct * 100)}% on-time`}
              </span>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex flex-wrap items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/70 px-3 py-1 text-sm font-medium"
                  >
                    <Clock3 className="h-4 w-4" />
                    {etaChip}
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  Median {listing.lane.medianDays} days on this lane
                </TooltipContent>
              </Tooltip>
              <span className="text-xs text-muted-foreground">{lockCaption}</span>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>{progressLabel}</span>
                <span>{progressPercent}%</span>
              </div>
              <Progress value={progressPercent} aria-label={`MOQ progress ${progressPercent}%`} />
              <div className="flex flex-wrap items-center gap-2">
                {progressPercent >= 80 && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 animate-[pulse_2s_ease-in-out_infinite]">
                    <Check className="h-3.5 w-3.5" />
                    Almost there
                  </span>
                )}
                {nearLockHint && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                    <Info className="h-3.5 w-3.5" />
                    New pool • help reach MOQ
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center rounded-full border border-border bg-muted px-3 py-1">
                    <button
                      type="button"
                      className="rounded-full p-1 disabled:opacity-40"
                      onClick={() => handleQtyChange(-1)}
                      disabled={qty <= 1}
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="mx-3 min-w-[2ch] text-center text-base font-semibold">{qty}</span>
                    <button
                      type="button"
                      className="rounded-full p-1 disabled:opacity-40"
                      onClick={() => handleQtyChange(1)}
                      disabled={qty >= 5}
                      aria-label="Increase quantity"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-foreground">Subtotal</p>
                    <p className="text-muted-foreground">{subtotalLabel}</p>
                  </div>
                </div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      className="h-12 w-12 rounded-full border"
                      aria-label="Share"
                      onClick={() => setShareSheetOpen(true)}
                    >
                      <MessageCircle className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Share</TooltipContent>
                </Tooltip>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <button
                  type="button"
                  className="inline-flex items-center gap-2 text-primary underline-offset-4 hover:underline"
                  onClick={handlePickupOpen}
                >
                  <MapPin className="h-4 w-4" />
                  {selectedPickup ? selectedPickup.name : 'Select pickup hub'}
                  <ChevronRight className="h-4 w-4" />
                </button>
                <Button className="flex-1 rounded-2xl py-3 text-base font-semibold" onClick={handlePreorder}>
                  Pre-order
                </Button>
              </div>
            </div>
          </section>

          <section className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <Tabs
              value={activeTab}
              onValueChange={value => {
                setActiveTab(value);
                trackEvent('tab_change', { id: listing.id, tab: value });
              }}
            >
              <TabsList className="grid w-full grid-cols-3 rounded-full bg-muted/60 p-1">
                <TabsTrigger value="description" className="rounded-full">Description</TabsTrigger>
                <TabsTrigger value="lane" className="rounded-full">Lane Info</TabsTrigger>
                <TabsTrigger value="reviews" className="rounded-full">Reviews</TabsTrigger>
              </TabsList>
              <TabsContent value="description" className="mt-4">
                <ul className="space-y-2 text-sm text-foreground">
                  {listing.specs.slice(0, 6).map(spec => (
                    <li key={spec} className="flex items-start gap-2 rounded-2xl bg-muted px-3 py-2">
                      <span className="mt-1 h-1.5 w-1.5 rounded-full bg-foreground" aria-hidden />
                      <span>{spec}</span>
                    </li>
                  ))}
                </ul>
              </TabsContent>
              <TabsContent value="lane" className="mt-4 space-y-3 text-sm">
                <div className="space-y-2 rounded-2xl bg-muted px-4 py-3">
                  <p className="font-medium text-foreground">On-time performance</p>
                  <p className="text-muted-foreground">{Math.round(listing.lane.onTimePct * 100)}% of batches delivered inside the promised window.</p>
                </div>
                <div className="space-y-2 rounded-2xl bg-muted px-4 py-3">
                  <p className="font-medium text-foreground">Median transit</p>
                  <p className="text-muted-foreground">{listing.lane.medianDays} days door-to-door. ETA window {listing.etaDays.min}–{listing.etaDays.max} days.</p>
                </div>
                <div className="space-y-2 rounded-2xl bg-muted px-4 py-3">
                  <p className="font-medium text-foreground">Mode insight</p>
                  <p className="text-muted-foreground">
                    {laneMode === 'Air'
                      ? 'Air keeps inventory light and cash moving. Expect fast customs clearance with premium handling.'
                      : 'Sea lowers landed cost for bulk runs. Build in buffer for port handling and final mile.'}
                  </p>
                </div>
              </TabsContent>
              <TabsContent value="reviews" className="mt-4 space-y-3">
                {REVIEW_SNIPPETS.map(review => (
                  <div key={review.id} className="space-y-2 rounded-2xl border border-border/80 bg-card/80 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{review.name}</p>
                        <p className="text-xs text-muted-foreground">{review.location}</p>
                      </div>
                      <div className="flex items-center gap-1 text-amber-500">
                        {Array.from({ length: review.rating }).map((_, idx) => (
                          <Star key={`${review.id}-${idx}`} className="h-4 w-4 fill-current" />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">“{review.text}”</p>
                  </div>
                ))}
              </TabsContent>
            </Tabs>
          </section>

          <section className="rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-12 w-12 rounded-2xl border">
                  <AvatarFallback className="text-base font-semibold">{listing.importer.displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-base font-semibold text-foreground">{listing.importer.displayName}</p>
                    {listing.importer.verified && (
                      <Badge variant="secondary" className="rounded-full border border-emerald-200 bg-emerald-50 text-emerald-700">
                        Verified
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">92% on-time · 120 orders</p>
                </div>
              </div>
              <Dialog open={importerModalOpen} onOpenChange={setImporterModalOpen}>
                <Button variant="ghost" className="rounded-full border px-4" onClick={() => setImporterModalOpen(true)}>
                  View profile
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{listing.importer.displayName}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Trusted importer with 120 fulfilled group buys across electronics and accessories.</p>
                    <p>Average response under 2 hours. Escrow verified for every pool.</p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </section>
        </div>

        {showStickyCta && (
          <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/95 px-4 py-4 backdrop-blur">
            <div className="mx-auto flex w-full max-w-3xl items-center gap-4">
              <div className="flex flex-col text-sm">
                <span className="text-muted-foreground">Subtotal ({qty})</span>
                <span className="text-base font-semibold text-foreground">{subtotalLabel}</span>
              </div>
              <Button className="ml-auto h-12 flex-1 rounded-2xl text-base font-semibold" onClick={handlePreorder}>
                Pre-order
              </Button>
            </div>
          </div>
        )}

        <Sheet open={pickupSheetOpen} onOpenChange={setPickupSheetOpen}>
          <SheetContent side="bottom" className="h-[70vh] rounded-t-3xl">
            <SheetHeader>
              <SheetTitle>Select pickup hub</SheetTitle>
            </SheetHeader>
            <div className="mt-4 flex h-full flex-col gap-4">
              <ScrollArea className="h-full pr-1">
                <div className="space-y-3">
                  {pickupLoading && (
                    <div className="space-y-2">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <Skeleton key={index} className="h-16 w-full rounded-2xl" />
                      ))}
                    </div>
                  )}
                  {!pickupLoading && pickupOptions.map(point => {
                    const active = (pendingPickupId ?? selectedPickup?.id) === point.id;
                    return (
                      <button
                        key={point.id}
                        type="button"
                        onClick={() => setPendingPickupId(point.id)}
                        className={cn(
                          'w-full rounded-2xl border px-4 py-3 text-left transition-colors',
                          active
                            ? 'border-primary bg-primary/5 text-foreground'
                            : 'border-border bg-card/80 hover:border-foreground/40',
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-foreground">{point.name}</p>
                            <p className="text-sm text-muted-foreground">{point.address}</p>
                            <p className="text-xs text-muted-foreground">{point.city}</p>
                          </div>
                          {active && <Check className="mt-1 h-5 w-5 text-primary" />}
                        </div>
                      </button>
                    );
                  })}
                  {!pickupLoading && pickupOptions.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                      Pickup hubs will appear here once available.
                    </div>
                  )}
                </div>
              </ScrollArea>
              <SheetFooter className="mt-auto flex flex-col gap-3 sm:flex-row">
                <Button
                  variant="secondary"
                  className="rounded-2xl"
                  onClick={() => setPickupSheetOpen(false)}
                >
                  Cancel
                </Button>
                <Button className="rounded-2xl" onClick={handlePickupConfirm}>
                  Confirm hub
                </Button>
              </SheetFooter>
            </div>
          </SheetContent>
        </Sheet>
        <ShareSheet
          open={shareSheetOpen}
          onOpenChange={setShareSheetOpen}
          context="listing"
          data={shareContent}
        />
      </main>
    </TooltipProvider>
  );
};

export default ListingDetails;
