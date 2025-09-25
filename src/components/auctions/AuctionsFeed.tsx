import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuctionCard } from './AuctionCard';
import { PlaceBidSheet } from './PlaceBidSheet';
import { AUCTION_LISTINGS, isDemoAuctionsSeed } from '@/lib/auctionData';
import { trackEvent } from '@/lib/analytics';
import type { AuctionListing } from '@/types/auctions';
import type { Session } from '@/types';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/context/I18nContext';
import { AccountSheet } from '@/components/shell/AccountControls';
import { Logo } from '@/components/Logo';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

type AuctionsFeedProps = {
  variant?: 'embedded' | 'page';
  session?: Session;
};

const PREVIEW_BADGE_VISIBLE = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

export const AuctionsFeed = ({ variant = 'embedded', session }: AuctionsFeedProps) => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [selectedAuction, setSelectedAuction] = useState<AuctionListing | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const headerRef = useRef<HTMLElement | null>(null);

  const auctions = useMemo(() => (AUCTION_LISTINGS.length > 0 ? AUCTION_LISTINGS : []), []);
  const usingDemoData = useMemo(() => isDemoAuctionsSeed(auctions), [auctions]);
  const isPage = variant === 'page';

  useEffect(() => {
    if (!isPage) return;
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
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [isPage]);

  useEffect(() => {
    if (auctions.length === 0) return;
    trackEvent('auction_feed_view', { count: auctions.length });
  }, [auctions.length]);

  const handleViewDetails = (auction: AuctionListing) => {
    navigate(`/auction/${auction.id}`);
  };

  const handleViewSeller = (sellerId: string) => {
    navigate(`/seller/${sellerId}`);
  };

  const handlePlaceBid = (auction: AuctionListing) => {
    setSelectedAuction(auction);
  };

  const filteredAuctions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return auctions;
    return auctions.filter(auction => {
      const haystack = [auction.title, auction.category, auction.seller?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [auctions, searchTerm]);

  const handleCloseBidSheet = () => {
    setSelectedAuction(null);
  };

  return (
    <div className={isPage ? 'relative min-h-dvh overflow-x-hidden' : undefined}>
      {isPage && (
        <>
          <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
          <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-white/80 via-white/30 to-transparent" />
        </>
      )}

      <div className={isPage ? 'relative z-10 flex min-h-dvh flex-col' : undefined}>
        {isPage && (
          <>
            <header
              ref={headerRef}
              className="fixed inset-x-0 top-0 z-50 border-b border-border/40 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/80"
            >
              <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 pb-4 pt-[calc(env(safe-area-inset-top)+1rem)]">
                <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                  <div className="order-1 flex items-center gap-3">
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-teal/5 to-blue/10 shadow-soft">
                      <Logo className="h-8 w-auto" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-foreground">ProList</span>
                    {PREVIEW_BADGE_VISIBLE && (
                      <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-muted-foreground">
                        {t('common.preview')}
                      </Badge>
                    )}
                  </div>
                  <div className="order-2 ml-auto flex items-center gap-2 sm:order-3 sm:ml-0 sm:gap-3">
                    {session && <AccountSheet session={session} />}
                  </div>
                </div>
                <div className="relative mt-1">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={event => setSearchTerm(event.target.value)}
                    placeholder={t('auctions.searchPlaceholder')}
                    className="h-12 rounded-full border border-border/60 bg-white/90 pl-11 pr-4 text-sm shadow-soft focus-visible:border-primary focus-visible:ring-0"
                    aria-label={t('auctions.searchPlaceholder')}
                  />
                </div>
              </div>
            </header>
            <div aria-hidden className="shrink-0" style={{ height: headerHeight }} />
          </>
        )}

        <div className={isPage ? 'flex-1 px-5 pb-28 pt-4' : 'px-6 py-6'}>
          <div className={`mx-auto w-full ${isPage ? 'max-w-6xl' : ''}`}>
            {usingDemoData && (
              <Badge variant="outline" className="mb-4 inline-flex items-center gap-1 rounded-full border-dashed border-border/70 bg-card/80 px-3 py-1 text-[11px] font-medium text-muted-foreground">
                {t('home.demoData')}
              </Badge>
            )}
            {filteredAuctions.length > 0 ? (
              <div className="grid gap-4">
                {filteredAuctions.map(auction => (
                  <AuctionCard
                    key={auction.id}
                    auction={auction}
                    onViewDetails={handleViewDetails}
                    onViewSeller={handleViewSeller}
                    onPlaceBid={handlePlaceBid}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2 rounded-3xl border border-border/60 bg-card/80 px-6 py-12 text-center shadow-soft">
                <Badge variant="secondary" className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t('home.searchNoResults')}
                </Badge>
                <p className="text-sm text-muted-foreground">{t('auctions.searchEmpty')}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedAuction && <PlaceBidSheet auction={selectedAuction} open={true} onClose={handleCloseBidSheet} />}
    </div>
  );
};
