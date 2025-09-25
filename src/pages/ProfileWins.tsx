import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import {
  getAuctionById,
  loadWins,
  isDemoWinsSeed,
} from '@/lib/auctionData';
import type { AuctionListing, AuctionWin } from '@/types/auctions';
import { AppNav } from '@/components/navigation/AppNav';

const PREVIEW_BADGE_VISIBLE = import.meta.env.MODE !== 'production' || import.meta.env.DEV;

const resolveAuction = (win: AuctionWin): AuctionListing | null => {
  const auction = getAuctionById(win.auctionId);
  if (auction) return auction;
  return null;
};

const ProfileWins = () => {
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  const wins = useMemo(() => loadWins(), []);
  const usingDemoData = useMemo(() => isDemoWinsSeed(), []);

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
        style: 'currency',
        currency: 'XAF',
        maximumFractionDigits: 0,
      }),
    [locale]
  );

  const statusStyles: Record<AuctionWin['status'], string> = {
    pending_payment: 'bg-amber-100 text-amber-800 border-amber-200',
    paid: 'bg-primary/15 text-primary border-primary/30',
    completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  };

  const handleBack = () => navigate(-1);

  const handleViewAuction = (auctionId: string) => {
    trackEvent('profile_wins_auction_open', { auctionId });
    navigate(`/auction/${auctionId}`);
  };

  const handleViewSeller = (sellerId?: string) => {
    if (!sellerId) return;
    trackEvent('profile_wins_seller_open', { sellerId });
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
              <h1 className="text-lg font-semibold text-foreground">{t('profile.wins.title')}</h1>
              <p className="text-sm text-muted-foreground">{t('profile.wins.subtitle')}</p>
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
          {wins.map(win => {
            const auction = resolveAuction(win);
            const seller = auction?.seller;
            const statusLabel = t(`profile.wins.status.${win.status}`);

            return (
              <article
                key={win.id}
                className="rounded-3xl border border-border/60 bg-card/90 p-5 shadow-soft"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <h2 className="text-base font-semibold text-foreground">
                      {auction?.title ?? t('profile.wins.fallbackTitle')}
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      {t('profile.wins.wonAt', { date: new Date(win.wonAt).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US') })}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${statusStyles[win.status]}`}
                  >
                    <Trophy className="h-4 w-4" />
                    {statusLabel}
                  </Badge>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('profile.wins.finalBid')}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground">
                      {currencyFormatter.format(win.finalBidXAF)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-background/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      {t('profile.wins.sellerLabel')}
                    </p>
                    <p className="mt-1 text-sm font-medium text-foreground">
                      {seller?.name ?? t('profile.wins.sellerFallback')}
                    </p>
                    {seller?.city && <p className="text-xs text-muted-foreground">{seller.city}</p>}
                  </div>
                </div>

                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  <Button onClick={() => handleViewAuction(win.auctionId)} className="rounded-full">
                    {t('profile.wins.viewAuction')}
                  </Button>
                  <Button
                    variant="outline"
                    className="rounded-full"
                    onClick={() => handleViewSeller(seller?.id)}
                    disabled={!seller?.id}
                  >
                    {t('profile.wins.viewSeller')}
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

export default ProfileWins;
