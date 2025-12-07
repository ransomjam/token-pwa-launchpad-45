import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Share2, Handshake, Filter, ShieldAlert, CheckCircle, XCircle, Search } from 'lucide-react';
import { usePostStore } from '@/context/PostStore';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useSession } from '@/context/SessionContext';
import { AccountSheet } from '@/components/shell/AccountControls';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { Logo } from '@/components/Logo';
import { useI18n } from '@/context/I18nContext';
import { AppBottomNav } from '@/components/navigation/AppBottomNav';
import { normalizePost, shareContent } from '@/lib/unifiedShare';
import ShareFallbackDialog from '@/components/posts/ShareFallbackDialog';

export default function Listings() {
  const navigate = useNavigate();
  const { posts, savedListings, toggleSaved } = usePostStore();
  const { toast } = useToast();
  const { session } = useSession();
  const { t } = useI18n();
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);

  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    category: 'all',
    minPrice: '',
    maxPrice: '',
    city: 'all',
    sort: 'newest',
  });
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackImageUrl, setFallbackImageUrl] = useState<string | null>(null);
  const [fallbackCaption, setFallbackCaption] = useState('');

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;

    const updateHeight = () => {
      setHeaderHeight(node.getBoundingClientRect().height);
    };

    updateHeight();

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(updateHeight);
      resizeObserver.observe(node);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      resizeObserver?.disconnect();
    };
  }, []);

  const publicPosts = useMemo(() => {
    return posts.filter(p => p.visibility === 'PUBLIC');
  }, [posts]);

  const filteredPosts = useMemo(() => {
    let filtered = [...publicPosts];

    if (filters.category !== 'all') {
      filtered = filtered.filter(p => p.category === filters.category);
    }

    if (filters.city !== 'all') {
      filtered = filtered.filter(p => p.seller.city === filters.city);
    }

    if (filters.minPrice) {
      filtered = filtered.filter(p => p.priceXAF >= parseInt(filters.minPrice));
    }

    if (filters.maxPrice) {
      filtered = filtered.filter(p => p.priceXAF <= parseInt(filters.maxPrice));
    }

    if (filters.sort === 'newest') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (filters.sort === 'price-low') {
      filtered.sort((a, b) => a.priceXAF - b.priceXAF);
    } else if (filters.sort === 'price-high') {
      filtered.sort((a, b) => b.priceXAF - a.priceXAF);
    }

    const term = searchTerm.trim().toLowerCase();
    if (term) {
      filtered = filtered.filter(post => {
        const haystack = [
          post.title,
          post.caption,
          post.category,
          post.seller?.name,
          post.seller?.city,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(term);
      });
    }

    return filtered;
  }, [publicPosts, filters, searchTerm]);

  const categories = useMemo(() => {
    const cats = new Set(publicPosts.map(p => p.category).filter(Boolean));
    return Array.from(cats);
  }, [publicPosts]);

  const cities = useMemo(() => {
    const citySet = new Set(publicPosts.map(p => p.seller.city).filter(Boolean));
    return Array.from(citySet);
  }, [publicPosts]);

  const selectedPostData = selectedPost ? posts.find(p => p.id === selectedPost) : null;

  const handleStartDeal = (post: typeof publicPosts[0]) => {
    navigate(`/buyers/deals/new?title=${encodeURIComponent(post.title)}&price=${post.priceXAF}`);
  };

  const handleShare = async (post: typeof publicPosts[0]) => {
    const content = normalizePost(post);

    await shareContent(content, {
      onSuccess: () => {
        toast({ title: 'Shared!', description: 'Caption copied to clipboard' });
      },
      onError: (error) => {
        toast({ title: 'Error', description: error, variant: 'destructive' });
      },
      onFallback: (blobUrl, caption) => {
        if (fallbackImageUrl) {
          URL.revokeObjectURL(fallbackImageUrl);
        }
        setFallbackImageUrl(blobUrl);
        setFallbackCaption(caption);
        setFallbackOpen(true);
      },
    });
  };

  const handleReport = () => {
    toast({ title: 'Report received', description: 'Demo mode — no action taken' });
  };

  const PREVIEW_BADGE_VISIBLE = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-background">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />

      <div className="relative z-10 flex min-h-dvh flex-col">
        <header
          ref={headerRef}
          className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80"
        >
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="order-1 flex items-center gap-3">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl border border-border/80 bg-white/80 shadow-soft">
                  <Logo wrapperClassName="h-8 w-8" />
                </div>
                <span className="text-lg font-semibold tracking-tight text-foreground">ProList</span>
                {PREVIEW_BADGE_VISIBLE && (
                  <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-muted-foreground">
                    {t('common.preview')}
                  </Badge>
                )}
              </div>
              <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="order-2 h-11 w-11 rounded-xl border border-border/80 bg-white/80 text-foreground shadow-soft transition hover:border-primary/50 hover:text-primary"
                    aria-label="Search listings"
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Search listings</DialogTitle>
                  </DialogHeader>
                  <div className="relative mt-4">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search listings"
                      aria-label="Search listings"
                      autoFocus
                      className="h-12 rounded-full border border-border/60 bg-white/90 pl-11 pr-4 text-sm shadow-soft focus-visible:border-primary focus-visible:ring-0"
                    />
                  </div>
                </DialogContent>
              </Dialog>
              <div className="order-3 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0 sm:gap-3">
                <Sheet>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-11 w-11 rounded-xl border border-border/80 bg-white/80 text-foreground shadow-soft transition hover:border-primary/50 hover:text-primary"
                      aria-label="Filter listings"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-3xl">
                    <SheetHeader>
                      <SheetTitle>Filter Listings</SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      <div>
                        <label className="mb-2 block text-sm font-medium">Category</label>
                        <Select value={filters.category} onValueChange={(v) => setFilters(prev => ({ ...prev, category: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Categories</SelectItem>
                            {categories.map(cat => (
                              <SelectItem key={cat} value={cat!}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">City</label>
                        <Select value={filters.city} onValueChange={(v) => setFilters(prev => ({ ...prev, city: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Cities</SelectItem>
                            {cities.map(city => (
                              <SelectItem key={city} value={city!}>{city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="mb-2 block text-sm font-medium">Min Price</label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={filters.minPrice}
                            onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                          />
                        </div>
                        <div>
                          <label className="mb-2 block text-sm font-medium">Max Price</label>
                          <Input
                            type="number"
                            placeholder="∞"
                            value={filters.maxPrice}
                            onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                          />
                        </div>
                      </div>

                      <div>
                        <label className="mb-2 block text-sm font-medium">Sort By</label>
                        <Select value={filters.sort} onValueChange={(v) => setFilters(prev => ({ ...prev, sort: v }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="newest">Newest First</SelectItem>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button className="w-full" onClick={() => setFilters({ category: 'all', minPrice: '', maxPrice: '', city: 'all', sort: 'newest' })}>
                        Clear Filters
                      </Button>
                    </div>
                  </SheetContent>
                </Sheet>
                {session && (
                  <>
                    <NotificationBell />
                    <AccountSheet session={session} />
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        <div aria-hidden className="shrink-0" style={{ height: headerHeight }} />

        {/* Demo Banner */}
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-32 pt-6">
          <div className="mx-auto max-w-3xl space-y-6">
            <div className="rounded-2xl border border-blue/20 bg-blue/10 p-3 text-center">
              <p className="text-sm font-medium text-blue">Demo marketplace — mock data</p>
            </div>

            {/* Listings Grid */}
            <div className="grid grid-cols-2 gap-4">
              {filteredPosts.map(post => (
                <div
                  key={post.id}
                  className="relative overflow-hidden rounded-3xl bg-white shadow-lux cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => setSelectedPost(post.id)}
                >
                  <div className="relative aspect-square w-full overflow-hidden">
                    <img
                      src={post.photos[0]}
                      alt={post.title}
                      className="h-full w-full object-cover"
                    />
                    <div className="absolute top-2 right-2 rounded-full bg-primary px-2 py-1 text-xs font-bold text-white shadow-glow">
                      {post.priceXAF.toLocaleString()}
                    </div>
                    <div className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary backdrop-blur">
                      ProList
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="mb-1 text-sm font-bold text-foreground line-clamp-1">{post.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span className="line-clamp-1">{post.seller.name}</span>
                      {post.seller.verified && <CheckCircle className="h-3 w-3 text-primary" />}
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSaved(post.id);
                    }}
                    className="absolute top-2 left-2 rounded-full bg-black/20 p-1.5 backdrop-blur transition-colors hover:bg-black/40"
                  >
                    <Bookmark className={cn("h-4 w-4", savedListings.includes(post.id) ? "fill-white text-white" : "text-white")} />
                  </button>
                </div>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">No listings match your filters</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      <Dialog open={!!selectedPost} onOpenChange={(open) => !open && setSelectedPost(null)}>
        <DialogContent className="max-w-md">
          {selectedPostData && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedPostData.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <img
                  src={selectedPostData.photos[0]}
                  alt={selectedPostData.title}
                  className="w-full rounded-2xl"
                />
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-blue flex items-center justify-center text-white font-bold text-sm">
                      {selectedPostData.seller.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-1">
                        <p className="text-sm font-semibold">{selectedPostData.seller.name}</p>
                        {selectedPostData.seller.verified ? (
                          <CheckCircle className="h-3.5 w-3.5 text-primary" />
                        ) : (
                          <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                        )}
                      </div>
                      {selectedPostData.seller.city && (
                        <p className="text-xs text-muted-foreground">{selectedPostData.seller.city}</p>
                      )}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-bold">
                    {selectedPostData.priceXAF.toLocaleString()} XAF
                  </Badge>
                </div>

                <p className="text-sm text-muted-foreground">{selectedPostData.caption}</p>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare(selectedPostData)}
                    className="flex-1"
                  >
                    <Share2 className="mr-1 h-4 w-4" />
                    Share
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleSaved(selectedPostData.id)}
                    className="flex-1"
                  >
                    <Bookmark className={cn("mr-1 h-4 w-4", savedListings.includes(selectedPostData.id) && "fill-current")} />
                    {savedListings.includes(selectedPostData.id) ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReport}
                    className="flex-1"
                  >
                    <ShieldAlert className="mr-1 h-4 w-4" />
                    Report
                  </Button>
                </div>

                <Button
                  className="w-full"
                  onClick={() => {
                    setSelectedPost(null);
                    handleStartDeal(selectedPostData);
                  }}
                >
                  <Handshake className="mr-2 h-4 w-4" />
                  Start Deal
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <ShareFallbackDialog
        open={fallbackOpen}
        onOpenChange={(open) => {
          setFallbackOpen(open);
          if (!open && fallbackImageUrl) {
            URL.revokeObjectURL(fallbackImageUrl);
            setFallbackImageUrl(null);
          }
        }}
        imageUrl={fallbackImageUrl}
        caption={fallbackCaption}
      />

      <AppBottomNav />
    </div>
  );
}
