import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import {
  getAuctionById,
  loadWatchlist,
  isDemoWatchlistSeed,
  formatTimeLeft,
} from '@/lib/auctionData';
import type { AuctionListing, WatchlistItem } from '@/types/auctions';
import { AppNav } from '@/components/navigation/AppNav';

const PREVIEW_BADGE_VISIBLE = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

const lookupAuction = (item: WatchlistItem): AuctionListing | null => {
  const auction = getAuctionById(item.auctionId);
  if (auction) return auction;
  return null;
};

const ProfileWatchlist = () => {
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  const watchlist = useMemo(() => loadWatchlist(), []);
  const usingDemoData = useMemo(() => isDemoWatchlistSeed(), []);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const handleBack = () => navigate(-1);

  const handleViewAuction = (auctionId: string) => {
    trackEvent('profile_watchlist_auction_open', { auctionId });
    navigate(`/auction/${auctionId}`);
  };

  const handleViewSeller = (sellerId?: string) => {
    if (!sellerId) return;
    trackEvent('profile_watchlist_seller_open', { sellerId });
    navigate(`/seller/${sellerId}`);
  };

  return (
    <main className="min-h-dvh bg-muted/30">
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pb-16 pt-6 sm:px-6">
        <header className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-full"
              onClick={handleBack}
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="sr-only">{t('common.back')}</span>
            </Button>
            <div className="flex flex-1 flex-col items-center gap-1 text-center">
              <h1 className="text-lg font-semibold text-foreground">{t('profile.watchlist.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('profile.watchlist.subtitle')}</p>
            </div>
            {PREVIEW_BADGE_VISIBLE ? (
              <Badge variant="outline" className="rounded-full border-dashed px-2.5 py-0.5 text-[11px] text-muted-foreground">
                {t('common.preview')}
              </Badge>
            ) : (
              <div className="w-10" aria-hidden />
            )}
          </div>
          <AppNav className="justify-center" />
        </header>

        {usingDemoData && (
          <Badge variant="outline" className="mx-auto rounded-full border-dashed border-border/60 bg-card px-3 py-1 text-[11px] font-medium text-muted-foreground">
            {t('home.demoData')}
          </Badge>
        )}

        <div className="space-y-4">
          {watchlist.map(item => {
            const auction = lookupAuction(item);
            const seller = auction?.seller;
            const hasEnded = (auction?.timeLeftSec ?? 0) <= 0;
            const timeRemaining = auction ? formatTimeLeft(auction.timeLeftSec, locale) : null;

            return (
              <article
                key={`${item.auctionId}-${item.addedAt}`}
                className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-soft"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {auction?.title ?? t('profile.watchlist.fallbackTitle')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.watchlist.addedOn', { date: new Date(item.addedAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') })}
                    </p>
                  </div>
                  <Badge variant="secondary" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    <Eye className="h-4 w-4" />
                    {auction?.watchers ?? 0}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('profile.watchlist.currentBid')}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {auction ? currencyFormatter.format(auction.currentBidXAF) : '—'}
                    </p>
                    {auction && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {hasEnded
                          ? t('profile.watchlist.ended')
                          : t('profile.watchlist.timeLeft', { value: timeRemaining })}
                      </p>
                    )}
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('profile.watchlist.sellerLabel')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {seller?.name ?? t('profile.watchlist.sellerFallback')}
                    </p>
                    {seller?.city && (
                      <p className="text-xs text-muted-foreground">{seller.city}</p>
                    )}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button onClick={() => handleViewAuction(item.auctionId)} className="rounded-full">
                    {t('profile.watchlist.viewAuction')}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleViewSeller(seller?.id)}
                    disabled={!seller?.id}
                  >
                    {t('profile.watchlist.viewSeller')}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
};

export default ProfileWatchlist;
