import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Eye, Star, Shield, Share2, Edit, MoreHorizontal, Sparkles } from 'lucide-react';

import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LISTINGS_CATALOG,
  MY_REPOSTS_LISTINGS,
  type ListingCatalogItem,
  type MyRepostListing,
} from '@/lib/merchantData';
import { RepostListingSheet } from './RepostListingSheet';
import { trackEvent } from '@/lib/analytics';
import { loadWithFallback, saveValue } from '@/lib/storageHelpers';
import { isFollowing } from '@/lib/followersData';

const CATALOG_STORAGE_KEY = 'pl.merchant.listings.catalog.v1';
const REPOSTS_STORAGE_KEY = 'pl.merchant.listings.reposts.v1';

type MerchantListingsProps = {
  view: 'catalog' | 'reposts';
};

const createRepostFromCatalog = (item: ListingCatalogItem): MyRepostListing => {
  const baseId = item.id.replace(/^cat_/, '');
  const defaultResultId = item.type === 'auction' ? 'res_lst_rgb-led-strip' : 'res_lst_wireless-clippers';

  if (item.type === 'auction') {
    return {
      id: `rep_${baseId}`,
      title: item.title,
      image: item.image,
      type: 'auction',
      status: 'Live',
      resultId: defaultResultId,
      currentBidXAF: item.ownerMinXAF ?? 0,
      timeLeftSec: item.timeLeftSec ?? 172800,
      watchers: 0,
    } as const;
  }

  return {
    id: `rep_${baseId}`,
    title: item.title,
    image: item.image,
    type: 'direct',
    status: 'Live',
    resultId: defaultResultId,
    priceXAF: item.priceXAF ?? 0,
  } as const;
};

export const MerchantListings = ({ view }: MerchantListingsProps) => {
  const { t } = useI18n();
  const catalogSeed = useMemo(
    () => loadWithFallback<ListingCatalogItem[]>(CATALOG_STORAGE_KEY, LISTINGS_CATALOG),
    [],
  );
  const repostSeed = useMemo(
    () => loadWithFallback<MyRepostListing[]>(REPOSTS_STORAGE_KEY, MY_REPOSTS_LISTINGS),
    [],
  );

  const [catalog, setCatalog] = useState<ListingCatalogItem[]>(catalogSeed.data);
  const [myReposts, setMyReposts] = useState<MyRepostListing[]>(repostSeed.data);
  const [fromFollowedOnly, setFromFollowedOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ListingCatalogItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const usingDemoCatalog = catalogSeed.seeded;
  const usingDemoReposts = repostSeed.seeded;

  const filteredCatalog = useMemo(() => {
    if (!fromFollowedOnly) return catalog;
    return catalog.filter(item => isFollowing(item.owner.id));
  }, [catalog, fromFollowedOnly]);

  const ribbonCount = useMemo(
    () =>
      filteredCatalog.filter(
        item => item.newFromFollows && isFollowing(item.owner.id),
      ).length,
    [filteredCatalog],
  );

  const handleClaimRepost = (item: ListingCatalogItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
    trackEvent('merchant_listing_claim', { itemId: item.id, type: item.type });
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedItem(null);
    }
  };

  const handleRepostConfirmed = (item: ListingCatalogItem) => {
    setCatalog(prev => {
      const next = prev.map(entry =>
        entry.id === item.id ? { ...entry, claimedState: 'claimedByYou' as const } : entry,
      );
      saveValue(CATALOG_STORAGE_KEY, next);
      return next;
    });

    setMyReposts(prev => {
      const newEntry = createRepostFromCatalog(item);
      if (prev.some(entry => entry.id === newEntry.id)) {
        return prev;
      }

      const next = [...prev, newEntry];
      saveValue(REPOSTS_STORAGE_KEY, next);
      return next;
    });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h`;
    return `${hours}h`;
  };

  const formatCommission = (rule: ListingCatalogItem['commissionRule']) => {
    if (rule.type === 'percent') {
      return `${rule.value}%`;
    }
    return `+${rule.value.toLocaleString()} F`;
  };

  return (
    <>
      {view === 'catalog' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button
                variant={fromFollowedOnly ? 'default' : 'outline'}
                size="sm"
                className="rounded-full"
                onClick={() => setFromFollowedOnly(prev => !prev)}
              >
                {t('merchant.fromFollows')}
              </Button>
              {usingDemoCatalog && (
                <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
                  {t('common.demoData')}
                </Badge>
              )}
            </div>
          </div>

          {ribbonCount > 0 && (
            <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
              <Sparkles className="h-4 w-4" />
              <span>
                {t('merchant.newFromFollows')} ({ribbonCount})
              </span>
            </div>
          )}

          {filteredCatalog.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground">
              {t('merchant.catalogEmptyFiltered')}
            </div>
          ) : (
            filteredCatalog.map(item => (
              <div key={item.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                <div className="flex gap-4">
                  <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                    <img src={item.image} alt={item.title} className="h-full w-full object-contain" />
                  </div>

                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="line-clamp-1 font-semibold text-foreground">{item.title}</h3>
                        <Link
                          to={`/creator/${item.owner.id}`}
                          className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground hover:text-primary"
                        >
                          <span className="font-medium text-foreground">{item.owner.name}</span>
                          {item.owner.verified && (
                            <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                              <Star className="mr-1 h-3 w-3" />
                              {t('common.verified')}
                            </Badge>
                          )}
                        </Link>
                      </div>
                      {item.type === 'auction' && item.timeLeftSec && (
                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {formatTime(item.timeLeftSec)}
                        </Badge>
                      )}
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex flex-col gap-1 text-sm sm:flex-row sm:items-center sm:gap-3">
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            {item.type === 'auction' ? t('merchant.ownerMinimum') : t('merchant.minimum')}
                          </span>
                          <span className="text-lg font-semibold text-foreground">
                            {item.type === 'auction'
                              ? `${item.ownerMinXAF?.toLocaleString()} F`
                              : `${item.priceXAF?.toLocaleString()} F`}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-primary">
                          {t('merchant.commission')}: {formatCommission(item.commissionRule)}
                        </span>
                      </div>

                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <Badge variant="outline" className="w-fit text-xs uppercase tracking-wide">
                          {item.type === 'auction'
                            ? t('home.modes.auctions')
                            : t('vendor.directListingsTab')}
                        </Badge>

                        {item.claimedState === 'available' ? (
                          <Button onClick={() => handleClaimRepost(item)} size="sm" className="rounded-full">
                            {t('merchant.claimRepost')}
                          </Button>
                        ) : item.claimedState === 'claimedByYou' ? (
                          <Badge variant="secondary">{t('merchant.claimedByYou')}</Badge>
                        ) : (
                          <Badge variant="outline">{t('merchant.claimedByOther')}</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>{t('merchant.escrowProtection')}</span>
            {usingDemoReposts && (
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
                {t('common.demoData')}
              </Badge>
            )}
          </div>

          {myReposts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {t('merchant.repostsEmpty')}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myReposts.map(item => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                        <img src={item.image} alt={item.title} className="h-full w-full object-contain" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="line-clamp-2 font-semibold text-foreground">{item.title}</h3>
                        {item.type === 'auction' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold text-foreground">
                              {item.currentBidXAF?.toLocaleString()} F
                            </span>
                            {item.timeLeftSec && (
                              <Badge variant="outline" className="text-xs">
                                {formatTime(item.timeLeftSec)}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className="text-lg font-bold text-foreground">
                            {item.priceXAF?.toLocaleString()} F
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        {item.watchers !== undefined && (
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{item.watchers}</span>
                          </div>
                        )}
                        {item.status && (
                          <Badge
                            variant={item.status === 'Live' ? 'default' : 'secondary'}
                            className="text-xs"
                          >
                            {item.status}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-primary">
                      <Link
                        to={`/merchant/results/${item.resultId ?? item.id}`}
                        className="font-semibold hover:underline"
                      >
                        {t('merchant.viewResults')}
                      </Link>
                      <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                        {item.type === 'auction'
                          ? t('home.modes.auctions')
                          : t('vendor.directListingsTab')}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <RepostListingSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        item={selectedItem}
        onConfirm={handleRepostConfirmed}
      />
    </>
  );
};

export default MerchantListings;
