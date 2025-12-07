import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BellOff,
  Calendar,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  followCreator,
  unfollowCreator,
  isFollowing,
  getFollowState,
  updateNotifyState,
} from '@/lib/followersData';
import { NotifySheet } from '@/components/followers/NotifySheet';
import { AuctionCard } from '@/components/auctions/AuctionCard';
import { ListingCard } from '@/components/home/ListingCard';
import { AUCTION_LISTINGS, formatTimeLeft } from '@/lib/auctionData';
import {
  getCreatorProfileData,
  type CreatorAuctionCard,
  type CreatorListingCard,
  type CreatorPreorderCard,
} from '@/lib/creatorProfileData';
import type { AuctionListing } from '@/types/auctions';
import type { ListingSummary } from '@/types';
import { PREORDER_CATALOG } from '@/lib/merchantData';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const TAB_KEYS = ['auctions', 'listings', 'preorders'] as const;
type TabKey = (typeof TAB_KEYS)[number];

type NotifySnapshot = {
  auctions: 'on' | 'off' | 'pending';
  preorders: 'on' | 'off' | 'pending';
};

const getInitials = (value: string) =>
  value
    .split(' ')
    .map(segment => segment[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

const formatCurrency = (locale: 'en' | 'fr') =>
  new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  });

const formatDecimal = (locale: 'en' | 'fr') =>
  new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'decimal',
    maximumFractionDigits: 0,
  });

const gridClassName =
  'grid auto-rows-fr gap-4 sm:gap-5 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]';

const CreatorProfilePage = () => {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const { toast } = useToast();

  const profile = useMemo(() => getCreatorProfileData(id), [id]);
  const { creator, copy, auctions, listings, preorders } = profile;

  const followState = useMemo(() => (creator ? getFollowState(creator.id) : null), [creator?.id]);
  const [following, setFollowing] = useState(() => (creator ? isFollowing(creator.id) : false));
  const [notifyState, setNotifyState] = useState<NotifySnapshot>(() => ({
    auctions: followState?.auctionsNotify ?? 'off',
    preorders: followState?.preordersNotify ?? 'off',
  }));
  const [notifySheetOpen, setNotifySheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('auctions');

  const tabs = useMemo(
    () => [
      { key: 'auctions' as TabKey, label: t('creator.tabs.auctions') },
      { key: 'listings' as TabKey, label: t('creator.tabs.listings') },
      { key: 'preorders' as TabKey, label: t('creator.tabs.preorders') },
    ],
    [t],
  );

  useEffect(() => {
    if (auctions.length > 0) {
      setActiveTab('auctions');
      return;
    }
    if (listings.length > 0) {
      setActiveTab('listings');
      return;
    }
    setActiveTab('preorders');
  }, [auctions.length, creator.id, listings.length, preorders.length]);

  useEffect(() => {
    setFollowing(creator ? isFollowing(creator.id) : false);
    setNotifyState({
      auctions: followState?.auctionsNotify ?? 'off',
      preorders: followState?.preordersNotify ?? 'off',
    });
  }, [creator?.id, followState?.auctionsNotify, followState?.preordersNotify]);

  const currencyFormatter = useMemo(() => formatCurrency(locale), [locale]);
  const decimalFormatter = useMemo(() => formatDecimal(locale), [locale]);
  const formatPrice = useCallback(
    (value: number) => {
      const formatted = decimalFormatter.format(value).replace(/\u00A0/g, '\u202F');
      return `XAF ${formatted}`;
    },
    [decimalFormatter],
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
  const demoAuctionIds = useMemo(
    () => new Set(auctions.filter(card => card.demo).map(card => card.id)),
    [auctions],
  );
  const demoPreorderIds = useMemo(
    () => new Set(preorders.filter(card => card.demo).map(card => card.id)),
    [preorders],
  );
  const auctionSourceMap = useMemo(
    () => new Map(AUCTION_LISTINGS.map(item => [item.id, item] as const)),
    [],
  );
  const preorderSourceMap = useMemo(
    () => new Map(PREORDER_CATALOG.map(item => [item.id, item] as const)),
    [],
  );
  const auctionsForDisplay = useMemo<AuctionListing[]>(
    () =>
      auctions.map(card => {
        const matched = auctionSourceMap.get(card.id);
        if (matched) {
          return matched;
        }
        return {
          id: card.id,
          title: card.title,
          images: [card.image],
          currentBidXAF: card.currentBidXAF,
          minIncrementXAF: Math.max(1000, Math.round((card.currentBidXAF * 0.05) / 1000) * 1000),
          timeLeftSec: card.timeLeftSec,
          watchers: card.watchers ?? 0,
          seller: {
            id: creator.id,
            name: creator.name,
            verified: creator.verified,
            city: creator.city,
          },
          lane: undefined,
          category: 'general',
          createdAt: new Date().toISOString(),
        } satisfies AuctionListing;
      }),
    [auctionSourceMap, auctions, creator.city, creator.id, creator.name, creator.verified],
  );
  const preordersForDisplay = useMemo<ListingSummary[]>(
    () =>
      preorders.map(card => {
        const matched = preorderSourceMap.get(card.id);
        const laneMedian = Math.round((card.etaDays.min + card.etaDays.max) / 2);
        const baseImporter = matched?.importer ?? { id: creator.id, displayName: creator.name, verified: creator.verified };
        return {
          id: card.id,
          title: card.title,
          priceXAF: card.priceXAF,
          images: matched?.images ?? [card.image],
          etaDays: card.etaDays,
          lane: matched?.lane ?? {
            code: matched?.lane.code ?? 'GEN',
            onTimePct: matched?.lane.onTimePct ?? 0.9,
            medianDays: matched?.lane.medianDays ?? laneMedian,
          },
          moq: { target: card.moq.target, committed: card.moq.committed, lockAt: card.lockAt },
          importer: 'displayName' in baseImporter ? baseImporter : { ...baseImporter, displayName: 'name' in baseImporter ? baseImporter.name : '' },
          buyerProtection: { escrow: true, autoRefundOnLate: true },
          category: 'preorder',
          specs: matched?.commissionRule
            ? [`Commission ${matched.commissionRule.value}${matched.commissionRule.type === 'percent' ? '%' : ' XAF'}`]
            : [],
          createdAt: matched?.lockAt ?? card.lockAt,
        } satisfies ListingSummary;
      }),
    [creator.id, creator.name, creator.verified, preorders, preorderSourceMap],
  );

  const handleFollowToggle = () => {
    if (!creator) return;
    if (following) {
      unfollowCreator(creator.id);
      setFollowing(false);
      setNotifyState({ auctions: 'off', preorders: 'off' });
      toast({ description: t('following.unfollowed', { name: creator.name }) });
    } else {
      followCreator(creator.id);
      setFollowing(true);
      setNotifyState({ auctions: 'off', preorders: 'off' });
      toast({ description: t('following.nowFollowing', { name: creator.name }) });
    }
  };

  const handleNotifyQuickToggle = () => {
    if (!creator) return;
    const enabled = notifyState.auctions === 'on' && notifyState.preorders === 'on';
    const nextState = enabled ? 'off' : 'on';
    updateNotifyState(creator.id, 'auctions', nextState);
    updateNotifyState(creator.id, 'preorders', nextState);
    setNotifyState({ auctions: nextState, preorders: nextState });
    toast({ description: t('following.notificationsUpdated') });
  };

  const handleAuctionCta = (card: CreatorAuctionCard) => {
    if (card.demo) {
      toast({ description: t('creator.demoCta') });
      return;
    }
    navigate(`/auction/${card.id}`);
  };

  const handleListingCta = (card: CreatorListingCard) => {
    if (card.demo) {
      toast({ description: t('creator.demoCta') });
      return;
    }
    navigate(`/listings/${card.id}`);
  };

  const handlePreorderCta = (card: CreatorPreorderCard) => {
    toast({ description: t('creator.preorderCta') });
    if (!card.demo) {
      navigate('/merchant/preorder');
    }
  };

  const handleAuctionViewDetails = useCallback(
    (auction: AuctionListing) => {
      if (demoAuctionIds.has(auction.id)) {
        toast({ description: t('creator.demoCta') });
        return;
      }
      navigate(`/auction/${auction.id}`);
    },
    [demoAuctionIds, navigate, t, toast],
  );

  const handleAuctionSellerView = useCallback(
    (sellerId: string) => {
      if (sellerId === creator.id) {
        return;
      }
      navigate(`/creator/${sellerId}`);
    },
    [creator.id, navigate],
  );

  const handleAuctionBid = useCallback(
    (auction: AuctionListing) => {
      handleAuctionViewDetails(auction);
    },
    [handleAuctionViewDetails],
  );

  const handlePreorderOpen = useCallback(
    (listing: ListingSummary) => {
      if (demoPreorderIds.has(listing.id)) {
        toast({ description: t('creator.demoCta') });
        return;
      }
      navigate(`/listings/${listing.id}`);
    },
    [demoPreorderIds, navigate, t, toast],
  );

  const handlePreorderAction = useCallback(
    (listing: ListingSummary) => {
      if (demoPreorderIds.has(listing.id)) {
        toast({ description: t('creator.demoCta') });
        return;
      }
      navigate(`/listings/${listing.id}?action=preorder`);
    },
    [demoPreorderIds, navigate, t, toast],
  );

  const handlePreorderShare = useCallback(
    async (listing: ListingSummary) => {
      if (demoPreorderIds.has(listing.id)) {
        toast({ description: t('creator.demoCta') });
        return;
      }
      if (typeof window === 'undefined' || typeof navigator === 'undefined') {
        return;
      }
      const shareUrl = `${window.location.origin}/listings/${listing.id}`;
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
    },
    [demoPreorderIds, formatPrice, t, toast],
  );

  const handlePreorderView = useCallback((_id: string) => {
    // no-op placeholder to satisfy ListingCard contract
  }, []);

  const renderDemoBadge = (isDemo?: boolean) =>
    isDemo ? (
      <Badge variant="outline" className="absolute right-3 top-3 rounded-full border-dashed px-2.5 py-0.5 text-[10px] uppercase">
        {t('common.demoData', { defaultValue: 'Demo data' })}
      </Badge>
    ) : null;

  const renderCompactAuctionCard = (card: CreatorAuctionCard) => {
    const timeLabel = formatTimeLeft(card.timeLeftSec, locale);
    return (
      <article
        key={`auction-${card.id}`}
        className="group relative flex h-full flex-col rounded-2xl border border-white/60 bg-white/90 p-3 shadow-soft transition-all duration-150 hover:-translate-y-1 hover:shadow-card focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/40"
      >
        {renderDemoBadge(card.demo)}
        <div className="overflow-hidden rounded-xl bg-muted/30">
          <img
            src={card.image}
            alt={card.title}
            loading="lazy"
            className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="mt-3 flex flex-1 flex-col gap-2">
          <p className="truncate text-sm font-semibold text-foreground" title={card.title}>
            {card.title}
          </p>
          <p className="text-lg font-semibold text-foreground">{currencyFormatter.format(card.currentBidXAF)}</p>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              {timeLabel}
            </Badge>
            {typeof card.watchers === 'number' && card.watchers > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px]">
                <span aria-hidden>👀</span>
                {t('creator.watchers', { count: card.watchers })}
              </span>
            ) : null}
          </div>
          <Button
            type="button"
            className="mt-auto h-11 rounded-full text-sm font-semibold"
            onClick={() => handleAuctionCta(card)}
            disabled={card.demo}
          >
            {t('creator.actions.placeBid')}
          </Button>
        </div>
      </article>
    );
  };

  const renderListingCard = (card: CreatorListingCard) => (
    <article
      key={`listing-${card.id}`}
      className="group relative flex h-full flex-col rounded-2xl border border-white/60 bg-white/90 p-3 shadow-soft transition-all duration-150 hover:-translate-y-1 hover:shadow-card focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/40"
    >
      {renderDemoBadge(card.demo)}
      <div className="overflow-hidden rounded-xl bg-muted/30">
        <img
          src={card.image}
          alt={card.title}
          loading="lazy"
          className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>
      <div className="mt-3 flex flex-1 flex-col gap-2">
        <p className="truncate text-sm font-semibold text-foreground" title={card.title}>
          {card.title}
        </p>
        <p className="text-lg font-semibold text-foreground">{currencyFormatter.format(card.priceXAF)}</p>
        <p className="text-xs text-muted-foreground">
          {t('creator.listingEta', { min: card.etaDays.min, max: card.etaDays.max })}
        </p>
        <Button
          type="button"
          className="mt-auto h-11 rounded-full text-sm font-semibold"
          onClick={() => handleListingCta(card)}
          disabled={card.demo}
        >
          {t('creator.actions.viewListing')}
        </Button>
      </div>
    </article>
  );

  const renderCompactPreorderCard = (card: CreatorPreorderCard) => {
    const progress = card.moq.target > 0 ? Math.min((card.moq.committed / card.moq.target) * 100, 100) : 0;
    const lockDate = new Date(card.lockAt);
    return (
      <article
        key={`preorder-${card.id}`}
        className="group relative flex h-full flex-col rounded-2xl border border-white/60 bg-white/90 p-3 shadow-soft transition-all duration-150 hover:-translate-y-1 hover:shadow-card focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/40"
      >
        {renderDemoBadge(card.demo)}
        <div className="overflow-hidden rounded-xl bg-muted/30">
          <img
            src={card.image}
            alt={card.title}
            loading="lazy"
            className="aspect-square h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="mt-3 flex flex-1 flex-col gap-2">
          <p className="truncate text-sm font-semibold text-foreground" title={card.title}>
            {card.title}
          </p>
          <p className="text-lg font-semibold text-foreground">{currencyFormatter.format(card.priceXAF)}</p>
          <div className="mt-2 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{t('creator.preorderMoq')}</span>
              <span className="font-semibold text-foreground">
                {card.moq.committed}/{card.moq.target}
              </span>
            </div>
            <Progress value={progress} className="h-2 rounded-full bg-muted" />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
            <Badge variant="secondary" className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
              {t('creator.preorderLockIn')}
            </Badge>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px]">
              <Calendar className="h-3.5 w-3.5" />
              {t('creator.preorderLockDate', {
                date: lockDate.toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                  month: 'short',
                  day: 'numeric',
                }),
              })}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[11px]">
              <Clock className="h-3.5 w-3.5" />
              {t('creator.preorderEta', { min: card.etaDays.min, max: card.etaDays.max })}
            </span>
          </div>
          <Button
            type="button"
            className="mt-auto h-11 rounded-full text-sm font-semibold"
            onClick={() => handlePreorderCta(card)}
          >
            {t('creator.actions.preOrder')}
          </Button>
        </div>
      </article>
    );
  };

  return (
    <main className="min-h-dvh bg-gradient-to-b from-slate-50 via-white to-white text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/10 via-white/60 to-transparent" />
      <div className="relative mx-auto w-full max-w-6xl px-4 pb-16 pt-[calc(env(safe-area-inset-top)+1.5rem)] sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3">
          <Button
            type="button"
            variant="ghost"
            className="flex h-11 items-center gap-2 rounded-full px-4"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('common.back', { defaultValue: 'Back' })}
          </Button>
          <Badge variant="outline" className="rounded-full border-dashed px-3 py-1 text-xs">
            {t('common.demoData', { defaultValue: 'Demo data' })}
          </Badge>
        </div>

        <section className="mt-6 rounded-3xl border border-white/70 bg-white/90 p-6 shadow-[0_22px_55px_rgba(14,116,144,0.08)] backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center">
              <Avatar className="h-20 w-20 text-lg">
                <AvatarImage src={creator.avatar} alt={creator.name} />
                <AvatarFallback className="bg-primary/10 text-xl font-semibold text-primary">
                  {getInitials(creator.name)}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">{creator.name}</h1>
                  {creator.verified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                      <CheckCircle2 className="h-4 w-4" />
                      {t('creator.verified')}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>{creator.city}</span>
                  <span aria-hidden>•</span>
                  <span>{t(copy.taglineKey)}</span>
                </div>
                <p className="text-sm font-medium text-primary">{t('creator.trustline')}</p>
              </div>
            </div>
            <div className="flex flex-shrink-0 flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={following ? 'secondary' : 'default'}
                className="h-11 rounded-full px-5 text-sm font-semibold"
                onClick={handleFollowToggle}
              >
                {following ? t('following.following') : t('following.follow')}
              </Button>
              <Button
                type="button"
                variant="outline"
                className="h-11 rounded-full px-5 text-sm font-semibold"
                onClick={() => setNotifySheetOpen(true)}
                disabled={!following}
              >
                <Bell className="mr-2 h-4 w-4" />
                {t('following.requestNotifications')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="h-11 rounded-full px-5 text-sm font-semibold"
                onClick={handleNotifyQuickToggle}
                disabled={!following}
              >
                {notifyState.auctions === 'on' && notifyState.preorders === 'on' ? (
                  <BellOff className="mr-2 h-4 w-4" />
                ) : (
                  <Bell className="mr-2 h-4 w-4" />
                )}
                {notifyState.auctions === 'on' && notifyState.preorders === 'on'
                  ? t('following.notifyOff')
                  : t('following.notifyOn')}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
            <div className="group rounded-2xl border border-white/70 bg-white/90 p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                {t('creator.metrics.onTime')}
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">{creator.onTimePct}%</p>
              <p className="text-xs text-muted-foreground">{t('creator.metrics.onTimeHint')}</p>
            </div>
            <div className="group rounded-2xl border border-white/70 bg-white/90 p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-amber-500" />
                {t('creator.metrics.disputeRate')}
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">{creator.disputeRatePct}%</p>
              <p className="text-xs text-muted-foreground">{t('creator.metrics.disputeHint')}</p>
            </div>
            <div className="group rounded-2xl border border-white/70 bg-white/90 p-3 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                <Sparkles className="h-4 w-4 text-violet-500" />
                {t('creator.metrics.closedDeals')}
              </div>
              <p className="mt-2 text-xl font-semibold text-foreground">{creator.closedDeals60d}</p>
              <p className="text-xs text-muted-foreground">{t('creator.metrics.closedHint')}</p>
            </div>
          </div>
        </section>
      </div>

      <nav
        className="sticky z-40 border-y border-white/70 bg-white/85 backdrop-blur"
        style={{ top: 'calc(env(safe-area-inset-top) + 72px)' }}
      >
        <div className="mx-auto flex w-full max-w-6xl gap-2 overflow-x-auto px-4 py-3 sm:px-6 lg:px-8">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                'inline-flex min-w-[120px] items-center justify-center rounded-full px-4 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                activeTab === tab.key
                  ? 'bg-primary/10 text-primary shadow-inner'
                  : 'bg-transparent text-muted-foreground hover:bg-muted/60',
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </nav>

      <section className="mx-auto w-full max-w-6xl px-4 pb-24 pt-8 sm:px-6 lg:px-8">
        {activeTab === 'auctions' && (
          <div className="space-y-4">
            {auctionsForDisplay.map(auction => (
              <AuctionCard
                key={auction.id}
                auction={auction}
                onViewDetails={handleAuctionViewDetails}
                onViewSeller={handleAuctionSellerView}
                onPlaceBid={handleAuctionBid}
              />
            ))}
          </div>
        )}
        {activeTab === 'listings' && (
          <div className={gridClassName}>{listings.map(renderListingCard)}</div>
        )}
        {activeTab === 'preorders' && (
          <div className="space-y-4">
            {preordersForDisplay.map((listing, index) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                position={index}
                formattedPrice={formatPrice(listing.priceXAF)}
                lockCountdown={formatLockCountdown(listing.moq.lockAt)}
                onOpen={handlePreorderOpen}
                onPreOrder={handlePreorderAction}
                onShare={handlePreorderShare}
                onView={handlePreorderView}
              />
            ))}
          </div>
        )}
      </section>

      {notifySheetOpen && creator && (
        <NotifySheet
          creatorId={creator.id}
          onClose={() => {
            setNotifySheetOpen(false);
            const refreshed = getFollowState(creator.id);
            setNotifyState({
              auctions: refreshed?.auctionsNotify ?? 'off',
              preorders: refreshed?.preordersNotify ?? 'off',
            });
          }}
        />
      )}

    </main>
  );
};

export default CreatorProfilePage;
