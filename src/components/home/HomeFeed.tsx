import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  Clock3,
  Filter,
  Grid2X2,
  Leaf,
  ListFilter,
  Loader2,
  Plane,
  RefreshCw,
  Search,
  Ship,
  Sparkles,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nContext';
import { ListingCard } from './ListingCard';
import type { ListingSummary, Session } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { AccountSheet, LanguageToggle } from '@/components/shell/AccountControls';
import { useIntersectionOnce } from '@/hooks/use-intersection-once';
import { cn } from '@/lib/utils';
import { activateDemoMode, DEMO_LISTINGS, isDemoActive } from '@/lib/demoMode';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Logo } from '@/components/Logo';

const RECENT_KEY = 'pl.recentListings';
const RECENT_SEARCH_KEY = 'pl.recentSearches';

type SortOption = 'relevance' | 'endingSoon' | 'priceLowHigh' | 'priceHighLow';

type FilterState = {
  laneMode: 'air' | 'sea' | null;
  etaRange: [number, number];
  priceRange: [number, number];
  verifiedOnly: boolean;
  greenLanesOnly: boolean;
};

type Bounds = {
  eta: [number, number];
  price: [number, number];
};

type HomeFeedProps = {
  session: Session;
};

const ALL_CATEGORY = '__all__';

const fetchListings = async (): Promise<ListingSummary[]> => {
  const response = await fetch('/api/listings');
  if (!response.ok) {
    throw new Error('Failed to load listings');
  }
  const json = await response.json() as { items: ListingSummary[] };
  return json.items;
};

const ListingSkeleton = () => (
  <div className="flex flex-col gap-5 rounded-3xl border border-border/70 bg-card p-5 shadow-soft">
    <div className="relative">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="absolute left-4 top-4 flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
    </div>
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-48 rounded" />
          <Skeleton className="h-4 w-32 rounded" />
        </div>
        <div className="space-y-2 text-right">
          <Skeleton className="h-5 w-20 rounded" />
          <Skeleton className="h-3 w-16 rounded" />
        </div>
      </div>
      <Skeleton className="h-4 w-3/4 rounded" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-4 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-40 rounded" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 flex-1 rounded-full" />
        <Skeleton className="h-12 w-12 rounded-full" />
      </div>
    </div>
  </div>
);

type SectionProps = {
  id: string;
  title: string;
  subtitle?: string;
  items: ListingSummary[];
  isLoading: boolean;
  renderItem: (item: ListingSummary, index: number) => ReactNode;
  animationDelay: number;
};

const Section = ({ id, title, subtitle, items, isLoading, renderItem, animationDelay }: SectionProps) => {
  const sectionRef = useIntersectionOnce<HTMLDivElement>(() => {
    trackEvent('feed_section_view', { section: id });
  }, { threshold: 0.2 });

  if (!isLoading && items.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className="space-y-3 opacity-0 animate-fade-in"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-foreground">{title}</h2>
        {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {isLoading ? (
        <div className="grid gap-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <ListingSkeleton key={`skeleton-${id}-${index}`} />
          ))}
        </div>
      ) : (
        <div className="grid gap-4">
          {items.map((item, index) => renderItem(item, index))}
        </div>
      )}
    </section>
  );
};

type SearchOverlayProps = {
  open: boolean;
  value: string;
  suggestions: ListingSummary[];
  recentTerms: string[];
  popularTerms: string[];
  onClose: () => void;
  onChange: (term: string) => void;
  onSubmit: (term: string) => void;
  onSelectSuggestion: (listing: ListingSummary) => void;
  labels: {
    title: string;
    placeholder: string;
    search: string;
    clear: string;
    recent: string;
    popular: string;
    noRecent: string;
    results: string;
    noResults: string;
    hint: string;
    close: string;
  };
  formatPrice: (value: number) => string;
  getEtaLabel: (listing: ListingSummary) => string;
  getLaneLabel: (listing: ListingSummary) => string;
};

const SearchOverlay = ({
  open,
  value,
  suggestions,
  recentTerms,
  popularTerms,
  onClose,
  onChange,
  onSubmit,
  onSelectSuggestion,
  labels,
  formatPrice,
  getEtaLabel,
  getLaneLabel,
}: SearchOverlayProps) => {
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      onClose();
      return;
    }
    onSubmit(trimmed);
    onClose();
  };

  const handleClear = () => {
    onChange('');
    inputRef.current?.focus();
  };

  const handleQuickSelect = (term: string) => {
    onChange(term);
    onSubmit(term);
    onClose();
  };

  const handleSuggestionClick = (listing: ListingSummary) => {
    onChange(listing.title);
    onSelectSuggestion(listing);
    onClose();
  };

  const showResults = value.trim().length > 0;

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="top-0 h-[100dvh] max-w-none rounded-none border-none bg-background px-6 py-6 sm:top-[10vh] sm:h-auto sm:max-w-lg sm:rounded-3xl">
        <div className="flex h-full flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">{labels.title}</h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9 rounded-full"
              aria-label={labels.close}
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
              <Search className="h-5 w-5 text-muted-foreground" />
              <Input
                ref={inputRef}
                value={value}
                onChange={event => onChange(event.target.value)}
                placeholder={labels.placeholder}
                className="border-none bg-transparent p-0 text-base focus-visible:ring-0"
                type="search"
                aria-label={labels.search}
                autoFocus
              />
              {value && (
                <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={handleClear}>
                  {labels.clear}
                </Button>
              )}
              <Button type="submit" className="h-10 rounded-xl px-4 text-sm font-semibold">
                {labels.search}
              </Button>
            </div>
          </form>
          <div className="flex-1 overflow-y-auto pb-6">
            {showResults ? (
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labels.results}</p>
                <div className="space-y-2">
                  {suggestions.slice(0, 6).map(suggestion => {
                    const [,, modeRaw = ''] = suggestion.lane.code.split('-');
                    const mode = modeRaw.toLowerCase() === 'air' ? 'air' : 'sea';
                    const tone = suggestion.lane.onTimePct >= 0.9
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                      : suggestion.lane.onTimePct >= 0.75
                        ? 'border-amber-200 bg-amber-50 text-amber-700'
                        : 'border-rose-200 bg-rose-50 text-rose-700';
                    const ModeIcon = mode === 'air' ? Plane : Ship;
                    return (
                      <button
                        key={suggestion.id}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="flex items-center gap-3 rounded-2xl border border-border bg-card px-3 py-3 text-left shadow-soft transition-colors hover:border-primary/40"
                      >
                        <div className="h-14 w-14 overflow-hidden rounded-xl bg-muted">
                          <img
                            src={suggestion.images[0] ?? '/placeholder.svg'}
                            alt={suggestion.title}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex flex-1 flex-col gap-2">
                          <div className="flex items-start justify-between gap-3">
                            <p className="line-clamp-2 text-sm font-semibold text-foreground">{suggestion.title}</p>
                            <span className="text-sm font-semibold text-primary">{formatPrice(suggestion.priceXAF)}</span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1">
                              <Clock3 className="h-3.5 w-3.5" />
                              {getEtaLabel(suggestion)}
                            </span>
                            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-1', tone)}>
                              <ModeIcon className="h-3.5 w-3.5" />
                              {getLaneLabel(suggestion)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {suggestions.length === 0 && (
                    <div className="space-y-2 rounded-2xl border border-dashed border-border px-4 py-6 text-center">
                      <p className="text-sm font-semibold text-foreground">{labels.noResults}</p>
                      <p className="text-xs text-muted-foreground">{labels.hint}</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labels.recent}</p>
                  {recentTerms.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {recentTerms.map(term => (
                        <Button key={term} type="button" variant="secondary" className="rounded-full px-3 py-1 text-xs" onClick={() => handleQuickSelect(term)}>
                          {term}
                        </Button>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-border px-4 py-4 text-sm text-muted-foreground">
                      {labels.noRecent}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labels.popular}</p>
                  <div className="flex flex-wrap gap-2">
                    {popularTerms.map(term => (
                      <Button key={term} type="button" variant="outline" className="rounded-full px-3 py-1 text-xs" onClick={() => handleQuickSelect(term)}>
                        {term}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const HomeFeed = ({ session }: HomeFeedProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t, locale } = useI18n();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDraft, setSearchDraft] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
  const [sort, setSort] = useState<SortOption>('relevance');
  const [filters, setFilters] = useState<FilterState>({
    laneMode: null,
    etaRange: [0, 0],
    priceRange: [0, 0],
    verifiedOnly: false,
    greenLanesOnly: false,
  });
  const [filterDraft, setFilterDraft] = useState<FilterState | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sortMenuOpen, setSortMenuOpen] = useState(false);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const [bounds, setBounds] = useState<Bounds>({ eta: [0, 0], price: [0, 0] });
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [visibleTrending, setVisibleTrending] = useState(4);
  const [deferredSections, setDeferredSections] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [demoActive, setDemoActive] = useState(() => isDemoActive);

  const hasInitializedFilters = useRef(false);
  const pullDistanceRef = useRef(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const infiniteRef = useRef<HTMLDivElement | null>(null);

  const sortLabels = useMemo<Record<SortOption, string>>(
    () => ({
      relevance: t('home.sort.relevance'),
      endingSoon: t('home.sort.endingSoon'),
      priceLowHigh: t('home.sort.priceLowHigh'),
      priceHighLow: t('home.sort.priceHighLow'),
    }),
    [t, locale],
  );

  const formatLockCountdown = useCallback(
    (iso: string) => {
      const now = Date.now();
      const lockTime = new Date(iso).getTime();
      const diff = lockTime - now;
      if (Number.isNaN(diff)) return t('home.locksSoon');
      if (diff <= 0) return t('home.lockingNow');
      const minutes = Math.floor(diff / 60000);
      if (minutes >= 1440) {
        return t('home.locksInDays', { value: Math.round(minutes / 1440) });
      }
      if (minutes >= 60) {
        return t('home.locksInHours', { value: Math.floor(minutes / 60) });
      }
      return t('home.locksInMinutes', { value: Math.max(1, minutes) });
    },
    [t],
  );

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['listings'],
    queryFn: fetchListings,
    staleTime: 1000 * 60,
  });

  const remoteListings = data ?? [];
  const queryResolved = data !== undefined || isError;
  const shouldTriggerDemo = !isLoading && queryResolved && (isError || remoteListings.length === 0);

  useEffect(() => {
    if (!demoActive && shouldTriggerDemo) {
      activateDemoMode();
      setDemoActive(true);
    }
  }, [demoActive, shouldTriggerDemo]);

  const fallbackActive = demoActive || shouldTriggerDemo;
  const allListings = fallbackActive ? DEMO_LISTINGS : remoteListings;
  const isListingLoading = isLoading && !fallbackActive;

  useEffect(() => {
    setDeferredSections(false);
    const timer = window.setTimeout(() => setDeferredSections(true), 260);
    return () => window.clearTimeout(timer);
  }, [data, fallbackActive]);

  useEffect(() => {
    if (!allListings.length) return;
    const minEta = Math.min(...allListings.map(item => item.etaDays.min));
    const maxEta = Math.max(...allListings.map(item => item.etaDays.max));
    const minPrice = Math.min(...allListings.map(item => item.priceXAF));
    const maxPrice = Math.max(...allListings.map(item => item.priceXAF));
    setBounds({ eta: [minEta, maxEta], price: [minPrice, maxPrice] });
    if (!hasInitializedFilters.current) {
      setFilters({
        laneMode: null,
        etaRange: [minEta, maxEta],
        priceRange: [minPrice, maxPrice],
        verifiedOnly: false,
        greenLanesOnly: false,
      });
      hasInitializedFilters.current = true;
    }
  }, [allListings]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(RECENT_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setRecentIds(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse recent listings', error);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const stored = window.localStorage.getItem(RECENT_SEARCH_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as string[];
        setRecentSearches(parsed);
      }
    } catch (error) {
      console.warn('Failed to parse recent searches', error);
    }
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let startY = 0;
    let pulling = false;

    const handleTouchStart = (event: TouchEvent) => {
      if (el.scrollTop > 0 || isRefreshing) return;
      startY = event.touches[0].clientY;
      pulling = true;
    };

    const handleTouchMove = (event: TouchEvent) => {
      if (!pulling) return;
      const distance = event.touches[0].clientY - startY;
      if (distance <= 0) {
        pullDistanceRef.current = 0;
        setPullDistance(0);
        return;
      }
      const clamped = Math.min(140, distance);
      pullDistanceRef.current = clamped;
      setPullDistance(clamped);
    };

    const finishPull = () => {
      if (!pulling) return;
      if (pullDistanceRef.current > 70 && !isRefreshing) {
        setIsRefreshing(true);
        refetch().finally(() => setIsRefreshing(false));
      }
      pullDistanceRef.current = 0;
      setPullDistance(0);
      pulling = false;
    };

    el.addEventListener('touchstart', handleTouchStart, { passive: true });
    el.addEventListener('touchmove', handleTouchMove, { passive: true });
    el.addEventListener('touchend', finishPull);
    el.addEventListener('touchcancel', finishPull);

    return () => {
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove', handleTouchMove);
      el.removeEventListener('touchend', finishPull);
      el.removeEventListener('touchcancel', finishPull);
    };
  }, [isRefreshing, refetch]);

  const categories = useMemo(() => {
    const unique = new Set(allListings.map(item => item.category));
    return [ALL_CATEGORY, ...Array.from(unique)];
  }, [allListings]);

  const updateRecent = useCallback((id: string) => {
    setRecentIds(prev => {
      const next = [id, ...prev.filter(item => item !== id)].slice(0, 6);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const updateRecentSearches = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setRecentSearches(prev => {
      const next = [trimmed, ...prev.filter(item => item.toLowerCase() !== trimmed.toLowerCase())].slice(0, 6);
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat('fr-FR', { style: 'decimal', maximumFractionDigits: 0 }),
    [],
  );

  const formatPrice = useCallback(
    (value: number) => {
      const formatted = numberFormatter
        .format(value)
        .replace(/\u00A0/g, '\u202F');
      return `XAF ${formatted}`;
    },
    [numberFormatter],
  );

  const filteredListings = useMemo(() => {
    let items = allListings;
    if (selectedCategory !== ALL_CATEGORY) {
      items = items.filter(item => item.category === selectedCategory);
    }
    if (filters.laneMode) {
      items = items.filter(item => item.lane.code.toLowerCase().includes(filters.laneMode ?? ''));
    }
    if (filters.greenLanesOnly) {
      items = items.filter(item => item.lane.onTimePct >= 0.9);
    }
    items = items.filter(item => item.etaDays.min >= filters.etaRange[0] && item.etaDays.max <= filters.etaRange[1]);
    items = items.filter(item => item.priceXAF >= filters.priceRange[0] && item.priceXAF <= filters.priceRange[1]);
    if (filters.verifiedOnly) {
      items = items.filter(item => item.importer.verified);
    }
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      items = items.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.specs.some(spec => spec.toLowerCase().includes(term))
      );
    }
    return items;
  }, [allListings, filters, searchTerm, selectedCategory]);

  const sortedListings = useMemo(() => {
    const items = [...filteredListings];
    switch (sort) {
      case 'endingSoon':
        return items.sort((a, b) => new Date(a.moq.lockAt).getTime() - new Date(b.moq.lockAt).getTime());
      case 'priceLowHigh':
        return items.sort((a, b) => a.priceXAF - b.priceXAF);
      case 'priceHighLow':
        return items.sort((a, b) => b.priceXAF - a.priceXAF);
      default:
        return items.sort((a, b) => {
          const engagementA = a.moq.committed / a.moq.target;
          const engagementB = b.moq.committed / b.moq.target;
          if (engagementA === engagementB) {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          }
          return engagementB - engagementA;
        });
    }
  }, [filteredListings, sort]);

  useEffect(() => {
    setVisibleTrending(fallbackActive ? 14 : 4);
  }, [fallbackActive, sort, selectedCategory, filters, searchTerm]);

  const trendingListings = useMemo(() => sortedListings.slice(0, Math.min(sortedListings.length, visibleTrending)), [sortedListings, visibleTrending]);

  const endingSoonListings = useMemo(() => {
    return [...filteredListings]
      .sort((a, b) => new Date(a.moq.lockAt).getTime() - new Date(b.moq.lockAt).getTime())
      .slice(0, 6);
  }, [filteredListings]);

  const greenLaneListings = useMemo(() => sortedListings.filter(item => item.lane.onTimePct >= 0.9).slice(0, 6), [sortedListings]);

  const recentListings = useMemo(() => {
    if (!recentIds.length) return [];
    const map = new Map(sortedListings.map(item => [item.id, item] as const));
    return recentIds.map(id => map.get(id)).filter((item): item is ListingSummary => Boolean(item));
  }, [recentIds, sortedListings]);

  useEffect(() => {
    const node = infiniteRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setVisibleTrending(prev => {
            if (prev >= sortedListings.length) return prev;
            trackEvent('infinite_scroll_next');
            return Math.min(sortedListings.length, prev + 4);
          });
        }
      });
    }, { threshold: 0.4 });
    observer.observe(node);
    return () => observer.disconnect();
  }, [sortedListings.length]);

  const handleCardOpen = useCallback((listing: ListingSummary, position: number) => {
    updateRecent(listing.id);
    trackEvent('listing_card_click', { id: listing.id, position });
    navigate(`/listings/${listing.id}`);
  }, [navigate, updateRecent]);

  const handlePreOrder = useCallback((listing: ListingSummary) => {
    updateRecent(listing.id);
    navigate(`/listings/${listing.id}?action=preorder`);
  }, [navigate, updateRecent]);

  const handleShare = useCallback(async (listing: ListingSummary) => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    const shareUrl = `${window.location.origin}/listings/${listing.id}`;
    trackEvent('share_click', { id: listing.id, channel: 'whatsapp' });
    const message = `Check this preorder: ${listing.title} – ${formatPrice(listing.priceXAF)}\n${shareUrl}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, text: message, url: shareUrl });
        toast({ description: t('home.shareOpened') });
        return;
      } catch (error) {
        // ignore cancellation and fallback to clipboard
      }
    }
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(message);
        toast({ description: t('home.shareCopied') });
      } catch (error) {
        toast({ description: t('home.shareFailed'), variant: 'destructive' });
      }
    } else {
      toast({ description: `${t('home.shareFallback')} ${shareUrl}` });
    }
  }, [formatPrice, t, toast]);

  const handleCardView = useCallback((id: string) => {
    trackEvent('listing_card_view', { id });
  }, []);

  const resetFilters = useCallback((shouldTrack = false) => {
    setFilters({
      laneMode: null,
      etaRange: bounds.eta,
      priceRange: bounds.price,
      verifiedOnly: false,
      greenLanesOnly: false,
    });
    setFilterDraft(prev =>
      prev
        ? {
            ...prev,
            laneMode: null,
            etaRange: bounds.eta,
            priceRange: bounds.price,
            verifiedOnly: false,
            greenLanesOnly: false,
          }
        : prev
    );
    if (shouldTrack) {
      trackEvent('filter_reset');
    }
  }, [bounds.eta, bounds.price]);

  const handleFilterApply = () => {
    if (!filterDraft) {
      setFilterOpen(false);
      return;
    }
    setFilters({ ...filterDraft });
    setFilterOpen(false);
    trackEvent('filter_apply', {
      laneMode: filterDraft.laneMode,
      eta: filterDraft.etaRange,
      price: filterDraft.priceRange,
      verifiedOnly: filterDraft.verifiedOnly,
      greenLanesOnly: filterDraft.greenLanesOnly,
    });
  };

  const handleFilterOpen = (next: boolean) => {
    setFilterOpen(next);
    if (next) {
      setFilterDraft({ ...filters });
      trackEvent('filter_open');
    }
  };

  const searchSuggestions = useMemo(() => {
    const term = searchDraft.trim().toLowerCase();
    if (!term) return sortedListings.slice(0, 6);
    return sortedListings
      .filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.specs.some(spec => spec.toLowerCase().includes(term))
      )
      .slice(0, 6);
  }, [searchDraft, sortedListings]);

  const popularTerms = useMemo(() => {
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const item of sortedListings) {
      const title = item.title;
      const normalized = title.toLowerCase();
      if (!seen.has(normalized)) {
        seen.add(normalized);
        unique.push(title);
      }
      if (unique.length >= 6) break;
    }
    return unique;
  }, [sortedListings]);

  const filterPills = useMemo(() => {
    const pills: { key: string; label: string; onRemove: () => void }[] = [];
    if (selectedCategory !== ALL_CATEGORY) {
      pills.push({
        key: `category-${selectedCategory}`,
        label: selectedCategory,
        onRemove: () => setSelectedCategory(ALL_CATEGORY),
      });
    }
    if (filters.laneMode) {
      const modeLabel = filters.laneMode === 'air' ? t('home.modeAir') : t('home.modeSea');
      pills.push({
        key: `lane-${filters.laneMode}`,
        label: t('home.pillLane', { mode: modeLabel }),
        onRemove: () => setFilters(prev => ({ ...prev, laneMode: null })),
      });
    }
    if (filters.greenLanesOnly) {
      pills.push({
        key: 'green',
        label: t('home.pillGreen'),
        onRemove: () => setFilters(prev => ({ ...prev, greenLanesOnly: false })),
      });
    }
    if (filters.verifiedOnly) {
      pills.push({
        key: 'verified',
        label: t('home.pillVerified'),
        onRemove: () => setFilters(prev => ({ ...prev, verifiedOnly: false })),
      });
    }
    const hasBounds = hasInitializedFilters.current;
    if (hasBounds && (filters.etaRange[0] !== bounds.eta[0] || filters.etaRange[1] !== bounds.eta[1])) {
      pills.push({
        key: `eta-${filters.etaRange.join('-')}`,
        label: t('home.pillEta', { min: filters.etaRange[0], max: filters.etaRange[1] }),
        onRemove: () => setFilters(prev => ({ ...prev, etaRange: bounds.eta })),
      });
    }
    if (hasBounds && (filters.priceRange[0] !== bounds.price[0] || filters.priceRange[1] !== bounds.price[1])) {
      pills.push({
        key: `price-${filters.priceRange.join('-')}`,
        label: t('home.pillPrice', {
          min: formatPrice(filters.priceRange[0]),
          max: formatPrice(filters.priceRange[1]),
        }),
        onRemove: () => setFilters(prev => ({ ...prev, priceRange: bounds.price })),
      });
    }
    return pills;
  }, [bounds.eta, bounds.price, filters, formatPrice, selectedCategory, t]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.laneMode) count += 1;
    if (filters.greenLanesOnly) count += 1;
    if (filters.verifiedOnly) count += 1;
    if (hasInitializedFilters.current) {
      if (filters.etaRange[0] !== bounds.eta[0] || filters.etaRange[1] !== bounds.eta[1]) {
        count += 1;
      }
      if (filters.priceRange[0] !== bounds.price[0] || filters.priceRange[1] !== bounds.price[1]) {
        count += 1;
      }
    }
    return count;
  }, [bounds.eta, bounds.price, filters]);

  const filterLabel = useMemo(
    () => (activeFilterCount > 0 ? `${t('home.filterCta')} · ${activeFilterCount}` : t('home.filterCta')),
    [activeFilterCount, t],
  );

  const getEtaLabel = useCallback(
    (listing: ListingSummary) => t('home.etaChip', { min: listing.etaDays.min, max: listing.etaDays.max }),
    [t],
  );

  const getLaneLabel = useCallback(
    (listing: ListingSummary) => {
      const [,, modeRaw = ''] = listing.lane.code.split('-');
      const modeLabel = modeRaw.toLowerCase() === 'air' ? t('home.modeAir') : t('home.modeSea');
      return t('home.searchLaneLabel', { mode: modeLabel, pct: Math.round(listing.lane.onTimePct * 100) });
    },
    [t],
  );

  const handleSearchSubmit = (term: string) => {
    const trimmed = term.trim();
    setSearchTerm(trimmed);
    setSearchDraft(trimmed);
    if (trimmed) {
      updateRecentSearches(trimmed);
    }
  };

  const handleSearchResultSelect = (listing: ListingSummary) => {
    const position = sortedListings.findIndex(item => item.id === listing.id);
    const normalizedPosition = position >= 0 ? position : 0;
    updateRecentSearches(listing.title);
    setSearchTerm(listing.title);
    setSearchDraft(listing.title);
    trackEvent('search_result_click', { id: listing.id });
    handleCardOpen(listing, normalizedPosition);
  };

  const handleSortChange = (next: SortOption) => {
    setSort(next);
    trackEvent('sort_change', { sort: next });
  };

  const hasResults = filteredListings.length > 0;

  return (
    <div className="relative min-h-dvh overflow-x-hidden" ref={containerRef}>
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <header className="sticky inset-x-0 top-0 z-50 border-b border-border/40 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="order-1 flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-teal/5 to-blue/10 shadow-soft">
                  <Logo className="h-8 w-auto" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-foreground">ProList</span>
              </div>
              <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0 sm:gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className={cn(
                    'inline-flex h-11 items-center gap-2 rounded-full border border-border/70 bg-white px-4 text-sm font-semibold text-muted-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/40',
                    activeFilterCount > 0 ? 'border-primary bg-primary/15 text-primary' : '',
                  )}
                  onClick={() => handleFilterOpen(true)}
                  aria-label={filterLabel}
                >
                  <Filter className="h-4 w-4" />
                  <span className="hidden sm:inline">{filterLabel}</span>
                </Button>
                <LanguageToggle className="h-11 rounded-full border border-border/70 bg-white px-4 text-xs font-semibold uppercase text-muted-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary" />
                <AccountSheet session={session} />
              </div>
              <button
                type="button"
                onClick={() => {
                  setSearchDraft(searchTerm);
                  setSearchOpen(true);
                  trackEvent('search_open');
                }}
                className="group order-3 flex h-12 w-full flex-1 items-center gap-3 rounded-full border border-border/70 bg-white px-4 text-left text-sm text-muted-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 sm:order-2 sm:min-w-[260px]"
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-teal/15 to-blue/20 text-primary shadow-inner">
                  <Search className="h-4 w-4" />
                </span>
                <span className="flex-1 truncate font-medium text-foreground/70 group-hover:text-foreground">
                  {searchTerm ? searchTerm : t('home.searchPlaceholder')}
                </span>
                {searchTerm && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 rounded-full px-4 text-xs font-semibold"
                    onClick={event => {
                      event.stopPropagation();
                      setSearchTerm('');
                      setSearchDraft('');
                    }}
                  >
                    {t('home.clear')}
                  </Button>
                )}
              </button>
            </div>

            <div className="flex flex-col gap-3">
              {filterPills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {filterPills.map(pill => (
                    <button
                      key={pill.key}
                      type="button"
                      onClick={pill.onRemove}
                      className="pill bg-white/70 text-muted-foreground hover:border-primary/40 hover:text-primary"
                      aria-label={t('home.removeFilter', { label: pill.label })}
                    >
                      <span className="truncate">{pill.label}</span>
                      <X className="h-3 w-3" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="px-5 pb-4">
          <div className="pill gap-2 bg-white/75 text-muted-foreground shadow-soft">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-[12px] font-medium normal-case tracking-normal">{t('home.heroCopy')}</span>
          </div>
        </div>

        <SearchOverlay
        open={searchOpen}
        value={searchDraft}
        onClose={() => {
          setSearchOpen(false);
          setSearchDraft(searchTerm);
        }}
        onChange={setSearchDraft}
        onSubmit={handleSearchSubmit}
        onSelectSuggestion={handleSearchResultSelect}
        suggestions={searchSuggestions}
        recentTerms={recentSearches}
        popularTerms={popularTerms}
        formatPrice={formatPrice}
        getEtaLabel={getEtaLabel}
        getLaneLabel={getLaneLabel}
        labels={{
          title: t('home.searchTitle'),
          placeholder: t('home.searchPlaceholder'),
          search: t('home.searchAction'),
          clear: t('home.clear'),
          recent: t('home.searchRecent'),
          popular: t('home.searchPopular'),
          noRecent: t('home.searchRecentEmpty'),
          results: t('home.searchResults'),
          noResults: t('home.searchNoResults'),
          hint: t('home.searchHint'),
          close: t('common.close'),
        }}
      />

      <Drawer open={filterOpen} onOpenChange={handleFilterOpen}>
        <DrawerContent>
          <DrawerHeader className="space-y-2 text-left">
            <DrawerTitle className="text-xl font-semibold">{t('home.filterTitle')}</DrawerTitle>
            <p className="text-sm text-muted-foreground">{t('home.filterSubtitle')}</p>
          </DrawerHeader>
          <div className="space-y-6 px-6">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('home.filterLane')}</p>
              <div className="flex gap-2">
                {['air', 'sea'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setFilterDraft(prev => prev ? { ...prev, laneMode: prev.laneMode === mode ? null : mode as 'air' | 'sea' } : prev)}
                    className={cn(
                      'flex-1 rounded-2xl border px-4 py-3 text-sm font-semibold capitalize shadow-sm',
                      filterDraft?.laneMode === mode ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card'
                    )}
                  >
                    {mode === 'air' ? t('home.modeAir') : t('home.modeSea')}
                  </button>
                ))}
              </div>
              <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
                <div className="flex items-center gap-2">
                  <Leaf className="h-4 w-4 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t('home.filterGreen')}</p>
                    <p className="text-xs text-muted-foreground">{t('home.filterGreenHint')}</p>
                  </div>
                </div>
                <Switch
                  checked={filterDraft?.greenLanesOnly ?? false}
                  onCheckedChange={checked => setFilterDraft(prev => prev ? { ...prev, greenLanesOnly: checked } : prev)}
                />
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{t('home.filterEta')}</span>
                <span>
                  {filterDraft
                    ? t('home.pillEta', { min: filterDraft.etaRange[0], max: filterDraft.etaRange[1] })
                    : ''}
                </span>
              </div>
              <Slider
                value={filterDraft ? filterDraft.etaRange : bounds.eta}
                onValueChange={value => setFilterDraft(prev => prev ? { ...prev, etaRange: [value[0], value[1]] as [number, number] } : prev)}
                min={bounds.eta[0]}
                max={bounds.eta[1]}
                step={1}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{t('home.filterPrice')}</span>
                <span>
                  {filterDraft
                    ? `${formatPrice(filterDraft.priceRange[0])} – ${formatPrice(filterDraft.priceRange[1])}`
                    : ''}
                </span>
              </div>
              <Slider
                value={filterDraft ? filterDraft.priceRange : bounds.price}
                onValueChange={value => setFilterDraft(prev => prev ? { ...prev, priceRange: [value[0], value[1]] as [number, number] } : prev)}
                min={bounds.price[0]}
                max={bounds.price[1]}
                step={500}
              />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-semibold text-foreground">{t('home.filterVerified')}</p>
                <p className="text-xs text-muted-foreground">{t('home.filterVerifiedHint')}</p>
              </div>
              <Switch
                checked={filterDraft?.verifiedOnly ?? false}
                onCheckedChange={checked => setFilterDraft(prev => prev ? { ...prev, verifiedOnly: checked } : prev)}
              />
            </div>
          </div>
          <DrawerFooter className="gap-3">
            <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => { resetFilters(true); setFilterOpen(false); }}>
              {t('home.resetFilters')}
            </Button>
            <Button className="h-11 rounded-2xl font-semibold" onClick={handleFilterApply}>
              {t('home.applyFilters')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 sm:flex-row">
        <Popover open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary"
              aria-label={t('home.sortMenu')}
              aria-expanded={sortMenuOpen}
            >
              <ListFilter className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-56 rounded-3xl border border-border bg-card/95 p-3 shadow-soft backdrop-blur">
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('home.sortMenu')}
              </p>
              <div className="flex flex-col gap-2">
                {(Object.keys(sortLabels) as SortOption[]).map(option => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      handleSortChange(option);
                      setSortMenuOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors',
                      option === sort
                        ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                    )}
                    aria-pressed={option === sort}
                  >
                    <span className="truncate">{sortLabels[option]}</span>
                    {option === sort && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
        <Popover open={categoryMenuOpen} onOpenChange={setCategoryMenuOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card/90 text-muted-foreground shadow-soft transition-all hover:border-primary/40 hover:text-primary"
              aria-label={t('home.categoriesMenu')}
              aria-expanded={categoryMenuOpen}
            >
              <Grid2X2 className="h-5 w-5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-64 rounded-3xl border border-border bg-card/95 p-3 shadow-soft backdrop-blur">
            <div className="space-y-2">
              <p className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {t('home.categoriesMenu')}
              </p>
              <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                {categories.map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(category);
                      trackEvent('category_chip_click', { category });
                      setCategoryMenuOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-2xl border px-3 py-2 text-sm font-semibold transition-colors',
                      selectedCategory === category
                        ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/40',
                    )}
                    aria-pressed={selectedCategory === category}
                  >
                    <span className="truncate">
                      {category === ALL_CATEGORY ? t('home.categoriesAll') : category}
                    </span>
                    {selectedCategory === category && <Check className="h-4 w-4" />}
                  </button>
                ))}
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <main className="flex-1 space-y-6 px-6 pb-24 pt-6">
        {fallbackActive && (
          <Badge variant="outline" className="w-fit rounded-full border-dashed border-border bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {t('home.demoData')}
          </Badge>
        )}

        {pullDistance > 0 && (
          <div className="flex items-center justify-center text-xs text-muted-foreground" style={{ height: pullDistance }}>
            {isRefreshing ? (
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm">
                <Loader2 className="h-3 w-3 animate-spin" /> {t('home.refreshing')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 rounded-full bg-card px-3 py-1 shadow-sm">
                <RefreshCw className="h-3 w-3" /> {t('home.pullToRefresh')}
              </span>
            )}
          </div>
        )}

        {!hasResults && !isListingLoading && (
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t('home.emptyTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('home.emptySubtitle')}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {!filters.greenLanesOnly && (
                <Button
                  variant="secondary"
                  className="rounded-full px-4 py-2 text-sm"
                  onClick={() =>
                    setFilters(prev => {
                      const next = { ...prev, greenLanesOnly: true };
                      trackEvent('filter_apply', {
                        laneMode: next.laneMode,
                        eta: next.etaRange,
                        price: next.priceRange,
                        verifiedOnly: next.verifiedOnly,
                        greenLanesOnly: next.greenLanesOnly,
                      });
                      return next;
                    })
                  }
                >
                  {t('home.emptyActionGreen')}
                </Button>
              )}
              <Button variant="outline" className="rounded-full px-4 py-2 text-sm" onClick={() => resetFilters(true)}>
                {t('home.emptyActionClear')}
              </Button>
            </div>
          </div>
        )}

        {isError && !fallbackActive && remoteListings.length === 0 && (
          <div className="flex items-center justify-between rounded-2xl border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            <span>{t('home.errorBanner')}</span>
            <Button size="sm" variant="outline" className="rounded-full" onClick={() => refetch()}>
              Retry
            </Button>
          </div>
        )}

        <Section
          id="trending"
          title={t('home.sections.trendingTitle')}
          subtitle={t('home.sections.trendingSubtitle')}
          items={trendingListings}
          isLoading={isListingLoading}
          animationDelay={0}
          renderItem={(item, index) => (
              <ListingCard
                key={item.id}
                listing={item}
                position={index}
                formattedPrice={formatPrice(item.priceXAF)}
                lockCountdown={formatLockCountdown(item.moq.lockAt)}
                onOpen={listing => handleCardOpen(listing, index)}
                onPreOrder={handlePreOrder}
                onShare={handleShare}
                onView={handleCardView}
              />
            )}
          />

        {deferredSections && (
          <div className="space-y-8">
            <Section
              id="endingSoon"
              title={t('home.sections.endingTitle')}
              subtitle={t('home.sections.endingSubtitle')}
              items={endingSoonListings}
              isLoading={isListingLoading}
              animationDelay={80}
              renderItem={(item, index) => (
              <ListingCard
                key={item.id}
                listing={item}
                position={index}
                formattedPrice={formatPrice(item.priceXAF)}
                lockCountdown={formatLockCountdown(item.moq.lockAt)}
                onOpen={listing => handleCardOpen(listing, index)}
                onPreOrder={handlePreOrder}
                onShare={handleShare}
                onView={handleCardView}
              />
            )}
          />

            <Section
              id="greenLanes"
              title={t('home.sections.greenTitle')}
              subtitle={t('home.sections.greenSubtitle')}
              items={greenLaneListings}
              isLoading={isListingLoading}
              animationDelay={140}
              renderItem={(item, index) => (
              <ListingCard
                key={item.id}
                listing={item}
                position={index}
                formattedPrice={formatPrice(item.priceXAF)}
                lockCountdown={formatLockCountdown(item.moq.lockAt)}
                onOpen={listing => handleCardOpen(listing, index)}
                onPreOrder={handlePreOrder}
                onShare={handleShare}
                onView={handleCardView}
              />
            )}
            />

            <Section
              id="recent"
              title={t('home.sections.recentTitle')}
              subtitle={t('home.sections.recentSubtitle')}
              items={recentListings}
              isLoading={isListingLoading && recentIds.length > 0}
              animationDelay={200}
              renderItem={(item, index) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  position={index}
                  formattedPrice={formatPrice(item.priceXAF)}
                  lockCountdown={formatLockCountdown(item.moq.lockAt)}
                  onOpen={listing => handleCardOpen(listing, index)}
                  onPreOrder={handlePreOrder}
                  onShare={handleShare}
                  onView={handleCardView}
                />
              )}
            />
          </div>
        )}

        <div ref={infiniteRef} className="flex items-center justify-center py-4 text-sm text-muted-foreground">
          {visibleTrending < sortedListings.length ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> {t('home.loadingMore')}
            </span>
          ) : (
            <span className="text-xs">{t('home.caughtUp')}</span>
          )}
        </div>
      </main>
    </div>
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/70 via-white/30 to-transparent" />
  </div>
);
};
