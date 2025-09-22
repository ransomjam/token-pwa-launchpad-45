import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  ArrowUpDown,
  Filter,
  Loader2,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Tag,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { useI18n } from '@/context/I18nContext';
import { ListingCard } from './ListingCard';
import type { ListingSummary, Session } from '@/types';
import { trackEvent } from '@/lib/analytics';
import { AccountSheet, LanguageToggle, languageNames } from '@/components/shell/AccountControls';
import { useIntersectionOnce } from '@/hooks/use-intersection-once';
import { cn } from '@/lib/utils';

const RECENT_KEY = 'pl.recentListings';

type SortOption = 'relevance' | 'endingSoon' | 'priceLowHigh' | 'priceHighLow';

type FilterState = {
  laneMode: 'air' | 'sea' | null;
  etaRange: [number, number];
  priceRange: [number, number];
  verifiedOnly: boolean;
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
  <div className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-4 shadow-soft">
    <div className="relative">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="absolute left-3 top-3 flex gap-2">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-6 w-28 rounded-full" />
      </div>
    </div>
    <div className="space-y-3">
      <div className="space-y-2">
        <Skeleton className="h-5 w-3/4 rounded" />
        <Skeleton className="h-4 w-1/3 rounded" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-full rounded-full" />
        <Skeleton className="h-3 w-5/6 rounded-full" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-11 flex-1 rounded-2xl" />
        <Skeleton className="h-11 w-11 rounded-2xl" />
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
  renderItem: (item: ListingSummary, index: number) => React.ReactNode;
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
  onClose: () => void;
  onSubmit: (term: string) => void;
  onSelectSuggestion: (term: string) => void;
  labels: {
    placeholder: string;
    search: string;
    clear: string;
    suggestions: string;
    noSuggestions: string;
  };
};

const SearchOverlay = ({ open, value, suggestions, onClose, onSubmit, onSelectSuggestion, labels }: SearchOverlayProps) => {
  const [term, setTerm] = useState(value);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setTerm(value);
    }
  }, [open, value]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 60);
    return () => window.clearTimeout(timer);
  }, [open]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(term.trim());
    onClose();
  };

  const handleClear = () => {
    setTerm('');
    inputRef.current?.focus();
  };

  return (
    <Dialog open={open} onOpenChange={next => !next && onClose()}>
      <DialogContent className="top-0 h-[100dvh] max-w-none rounded-none border-none bg-background px-6 py-8 sm:top-[10vh] sm:h-auto sm:max-w-lg sm:rounded-3xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-soft">
            <Search className="h-5 w-5 text-muted-foreground" />
            <Input
              ref={inputRef}
              value={term}
              onChange={event => setTerm(event.target.value)}
              placeholder={labels.placeholder}
              className="border-none bg-transparent p-0 text-base focus-visible:ring-0"
              type="search"
              aria-label={labels.search}
              autoFocus
            />
            {term && (
              <Button type="button" variant="ghost" size="sm" className="h-8 rounded-full px-3 text-xs" onClick={handleClear}>
                {labels.clear}
              </Button>
            )}
            <Button type="submit" className="h-10 rounded-xl px-4 text-sm font-semibold">
              {labels.search}
            </Button>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{labels.suggestions}</p>
            <div className="grid gap-2">
              {suggestions.slice(0, 6).map(suggestion => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => {
                    onSelectSuggestion(suggestion.title);
                    onClose();
                  }}
                  className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm font-medium shadow-sm hover:border-primary/40"
                >
                  <span>{suggestion.title}</span>
                  <Tag className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
              {suggestions.length === 0 && (
                <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
                  {labels.noSuggestions}
                </p>
              )}
            </div>
          </div>
        </form>
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
  const [selectedCategory, setSelectedCategory] = useState<string>(ALL_CATEGORY);
  const [sort, setSort] = useState<SortOption>('relevance');
  const [filters, setFilters] = useState<FilterState>({
    laneMode: null,
    etaRange: [0, 0],
    priceRange: [0, 0],
    verifiedOnly: false,
  });
  const [filterDraft, setFilterDraft] = useState<FilterState | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [bounds, setBounds] = useState<Bounds>({ eta: [0, 0], price: [0, 0] });
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [visibleTrending, setVisibleTrending] = useState(4);
  const [deferredSections, setDeferredSections] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

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

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['listings'],
    queryFn: fetchListings,
    staleTime: 1000 * 60,
  });

  useEffect(() => {
    setDeferredSections(false);
    const timer = window.setTimeout(() => setDeferredSections(true), 260);
    return () => window.clearTimeout(timer);
  }, [data]);

  const allListings = data ?? [];

  useEffect(() => {
    if (!allListings.length) return;
    const minEta = Math.min(...allListings.map(item => item.etaDays.min));
    const maxEta = Math.max(...allListings.map(item => item.etaDays.max));
    const minPrice = Math.min(...allListings.map(item => item.priceXAF));
    const maxPrice = Math.max(...allListings.map(item => item.priceXAF));
    setBounds({ eta: [minEta, maxEta], price: [minPrice, maxPrice] });
    if (!hasInitializedFilters.current) {
      setFilters({ laneMode: null, etaRange: [minEta, maxEta], priceRange: [minPrice, maxPrice], verifiedOnly: false });
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

  const priceFormatter = useMemo(() => {
    const localeKey = locale === 'fr' ? 'fr-CM' : 'en-US';
    return new Intl.NumberFormat(localeKey, {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    });
  }, [locale]);

  const filteredListings = useMemo(() => {
    let items = allListings;
    if (selectedCategory !== ALL_CATEGORY) {
      items = items.filter(item => item.category === selectedCategory);
    }
    if (filters.laneMode) {
      items = items.filter(item => item.lane.code.toLowerCase().includes(filters.laneMode ?? ''));
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
    setVisibleTrending(4);
  }, [sort, selectedCategory, filters, searchTerm]);

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
    const message = `Check this preorder: ${listing.title} – ${priceFormatter.format(listing.priceXAF)}\n${shareUrl}`;
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
  }, [priceFormatter, t, toast]);

  const handleCardView = useCallback((id: string) => {
    trackEvent('listing_card_view', { id });
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({ laneMode: null, etaRange: bounds.eta, priceRange: bounds.price, verifiedOnly: false });
  }, [bounds]);

  const handleFilterApply = () => {
    if (!filterDraft) {
      setFilterOpen(false);
      return;
    }
    setFilters(filterDraft);
    setFilterOpen(false);
    trackEvent('filter_apply', {
      laneMode: filterDraft.laneMode,
      eta: filterDraft.etaRange,
      price: filterDraft.priceRange,
      verifiedOnly: filterDraft.verifiedOnly,
    });
  };

  const handleFilterOpen = (next: boolean) => {
    setFilterOpen(next);
    if (next) {
      setFilterDraft(filters);
      trackEvent('filter_open');
    }
  };

  const suggestions = useMemo(() => {
    if (!searchTerm) return sortedListings.slice(0, 6);
    const term = searchTerm.toLowerCase();
    return sortedListings.filter(item => item.title.toLowerCase().includes(term)).slice(0, 6);
  }, [searchTerm, sortedListings]);

  const handleSearchSubmit = (term: string) => {
    setSearchTerm(term);
  };

  const handleSortChange = (next: SortOption) => {
    setSort(next);
    trackEvent('sort_change', { sort: next });
  };

  const hasResults = filteredListings.length > 0;

  return (
    <div className="flex min-h-dvh flex-col bg-background" ref={containerRef}>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/95 px-6 py-4 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary/80">{t('app.tagline')}</p>
              <h1 className="text-xl font-bold tracking-tight text-foreground">{t('app.name')}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <LanguageToggle />
            <AccountSheet session={session} />
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            className="flex flex-1 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 text-left text-sm text-muted-foreground shadow-soft"
          >
            <Search className="h-4 w-4" />
            <span className="flex-1 truncate">
              {searchTerm ? searchTerm : t('home.searchPlaceholder')}
            </span>
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 rounded-full px-3 text-xs"
                onClick={event => {
                  event.stopPropagation();
                  setSearchTerm('');
                }}
              >
                {t('home.clear')}
              </Button>
            )}
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 rounded-2xl px-4 text-sm font-semibold">
                <ArrowUpDown className="mr-2 h-4 w-4" />
                {sortLabels[sort]}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40 rounded-2xl p-2">
              {(Object.keys(sortLabels) as SortOption[]).map(option => (
                <DropdownMenuItem
                  key={option}
                  onSelect={() => handleSortChange(option)}
                  className={cn('rounded-xl px-3 py-2 text-sm font-medium', option === sort && 'bg-primary/10 text-primary')}
                >
                  {sortLabels[option]}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <Button
            variant="outline"
            className="h-12 rounded-2xl px-4 text-sm font-semibold"
            onClick={() => handleFilterOpen(true)}
          >
            <Filter className="mr-2 h-4 w-4" /> {t('home.filterCta')}
          </Button>
        </div>
      </header>

      <SearchOverlay
        open={searchOpen}
        value={searchTerm}
        onClose={() => setSearchOpen(false)}
        onSubmit={handleSearchSubmit}
        onSelectSuggestion={term => {
          setSearchTerm(term);
        }}
        suggestions={suggestions}
        labels={{
          placeholder: t('home.searchPlaceholder'),
          search: t('home.searchAction'),
          clear: t('home.clear'),
          suggestions: t('home.suggestions'),
          noSuggestions: t('home.noSuggestions'),
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
                    {mode}
                  </button>
                ))}
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <span>{t('home.filterEta')}</span>
                <span>{filterDraft ? `${filterDraft.etaRange[0]}–${filterDraft.etaRange[1]} days` : ''}</span>
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
                    ? `${priceFormatter.format(filterDraft.priceRange[0])} – ${priceFormatter.format(filterDraft.priceRange[1])}`
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
            <Button variant="ghost" className="h-11 rounded-2xl" onClick={() => { clearFilters(); setFilterOpen(false); }}>
              {t('home.resetFilters')}
            </Button>
            <Button className="h-11 rounded-2xl font-semibold" onClick={handleFilterApply}>
              {t('home.applyFilters')}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      <main className="flex-1 space-y-6 px-6 pb-24 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm font-medium text-primary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span>{t('home.heroCopy')}</span>
          </div>
        </div>

        <div className="sticky top-[108px] z-30 -mx-6 bg-background/95 px-6 pb-3 pt-2 backdrop-blur">
          <div className="flex items-center justify-between text-[13px] text-muted-foreground">
            <span>{selectedCategory === ALL_CATEGORY ? t('home.categoriesAll') : selectedCategory}</span>
            <span>
              {languageNames[locale]} • {t('home.resultsCount', { count: filteredListings.length })}
            </span>
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={cn(
                  'flex-shrink-0 rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-colors',
                  selectedCategory === category ? 'border-primary bg-primary text-white' : 'border-border bg-card text-muted-foreground'
                )}
              >
                {category === ALL_CATEGORY ? t('home.categoriesAll') : category}
              </button>
            ))}
          </div>
        </div>

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

        {!hasResults && !isLoading && (
          <div className="space-y-4 rounded-3xl border border-border bg-card p-6 text-center shadow-soft">
            <Sparkles className="mx-auto h-10 w-10 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{t('home.emptyTitle')}</h2>
            <p className="text-sm text-muted-foreground">{t('home.emptySubtitle')}</p>
            <Button variant="outline" className="rounded-2xl" onClick={clearFilters}>
              {t('home.resetFilters')}
            </Button>
          </div>
        )}

        {isError && (
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
          isLoading={isLoading}
          animationDelay={0}
          renderItem={(item, index) => (
            <ListingCard
              key={item.id}
              listing={item}
              position={index}
              formattedPrice={priceFormatter.format(item.priceXAF)}
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
              isLoading={isLoading}
              animationDelay={80}
              renderItem={(item, index) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  position={index}
                  formattedPrice={priceFormatter.format(item.priceXAF)}
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
              isLoading={isLoading}
              animationDelay={140}
              renderItem={(item, index) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  position={index}
                  formattedPrice={priceFormatter.format(item.priceXAF)}
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
              isLoading={isLoading && recentIds.length > 0}
              animationDelay={200}
              renderItem={(item, index) => (
                <ListingCard
                  key={item.id}
                  listing={item}
                  position={index}
                  formattedPrice={priceFormatter.format(item.priceXAF)}
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
  );
};
