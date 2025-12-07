import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Star, Shield, Share2, ExternalLink, MoreHorizontal, TrendingUp, Sparkles } from 'lucide-react';

import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  PREORDER_CATALOG,
  MY_REPOSTS_PREORDERS,
  type PreorderCatalogItem,
  type MyRepostPreorder,
} from '@/lib/merchantData';
import { RepostPreorderSheet } from './RepostPreorderSheet';
import { trackEvent } from '@/lib/analytics';
import { loadWithFallback, saveValue } from '@/lib/storageHelpers';
import { isFollowing } from '@/lib/followersData';

const CATALOG_STORAGE_KEY = 'pl.merchant.preorders.catalog.v1';
const REPOSTS_STORAGE_KEY = 'pl.merchant.preorders.reposts.v1';

type MerchantPreordersProps = {
  view: 'catalog' | 'reposts';
};

const createRepostFromCatalog = (item: PreorderCatalogItem): MyRepostPreorder => ({
  id: `rep_${item.id}`,
  poolId: item.id,
  title: item.title,
  images: item.images,
  priceXAF: item.priceXAF,
  sharedMoq: item.moq,
  lockAt: item.lockAt,
  ordersViaMe: 0,
  commissionToDateXAF: 0,
  importerId: item.importer.id,
});

export const MerchantPreorders = ({ view }: MerchantPreordersProps) => {
  const { t } = useI18n();
  const catalogSeed = useMemo(
    () => loadWithFallback<PreorderCatalogItem[]>(CATALOG_STORAGE_KEY, PREORDER_CATALOG),
    [],
  );
  const repostSeed = useMemo(
    () => loadWithFallback<MyRepostPreorder[]>(REPOSTS_STORAGE_KEY, MY_REPOSTS_PREORDERS),
    [],
  );

  const [catalog, setCatalog] = useState<PreorderCatalogItem[]>(catalogSeed.data);
  const [myReposts, setMyReposts] = useState<MyRepostPreorder[]>(repostSeed.data);
  const [fromFollowedOnly, setFromFollowedOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PreorderCatalogItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const usingDemoCatalog = catalogSeed.seeded;
  const usingDemoReposts = repostSeed.seeded;

  const filteredCatalog = useMemo(() => {
    if (!fromFollowedOnly) return catalog;
    return catalog.filter(item => isFollowing(item.importer.id));
  }, [catalog, fromFollowedOnly]);

  const ribbonCount = useMemo(
    () =>
      filteredCatalog.filter(
        item => item.newFromFollows && isFollowing(item.importer.id),
      ).length,
    [filteredCatalog],
  );

  const handleRepostPreorder = (item: PreorderCatalogItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
    trackEvent('merchant_preorder_repost', { itemId: item.id });
  };

  const handleSheetOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setSelectedItem(null);
    }
  };

  const handleRepostConfirmed = (item: PreorderCatalogItem) => {
    setMyReposts(prev => {
      if (prev.some(entry => entry.poolId === item.id)) {
        return prev;
      }
      const next = [...prev, createRepostFromCatalog(item)];
      saveValue(REPOSTS_STORAGE_KEY, next);
      return next;
    });
  };

  const formatCommission = (rule: PreorderCatalogItem['commissionRule']) => {
    if (rule.type === 'percent') {
      return `${rule.value}%`;
    }
    return `${rule.value.toLocaleString()} F`;
  };

  const getTimeToLock = (lockAt: string) => {
    const now = new Date();
    const lockTime = new Date(lockAt);
    const diffMs = lockTime.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    return `${t('merchant.lockingSoon')}`;
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
              {t('merchant.preorderEmptyFiltered')}
            </div>
          ) : (
            filteredCatalog.map(item => {
              const onTimePercent = Math.round(item.lane.onTimePct * 100);

              return (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                  <div className="flex gap-4">
                    <div className="flex w-24 flex-col items-start gap-2">
                      <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                        <img
                          src={item.images[0]}
                          alt={item.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="w-full space-y-2 text-sm">
                        <div className="space-y-0.5">
                          <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t('merchant.unitPrice')}
                          </span>
                          <span className="block text-base font-semibold text-foreground">
                            {item.priceXAF.toLocaleString()} F
                          </span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                            {t('merchant.commission')}
                          </span>
                          <span className="block text-xs font-semibold text-primary">
                            {formatCommission(item.commissionRule)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-2">
                          <h3 className="font-semibold text-foreground leading-tight line-clamp-1">{item.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                            <Link
                              to={`/creator/${item.importer.id}`}
                              className="font-medium text-foreground hover:text-primary"
                            >
                              {item.importer.name}
                            </Link>
                            {item.importer.verified && (
                              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                                <Star className="h-3 w-3 mr-1" />
                                {t('common.verified')}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Badge variant="outline" className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3" />
                          {getTimeToLock(item.lockAt)}
                        </Badge>
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                            <span>MOQ {item.moq.committed}/{item.moq.target}</span>
                            <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide">
                              <Badge variant="outline" className="text-xs">
                                ETA {item.lane.medianDays}d
                              </Badge>
                              <span className="text-muted-foreground normal-case">
                                {onTimePercent}% on-time
                              </span>
                            </div>
                          </div>
                          <Progress
                            value={(item.moq.committed / item.moq.target) * 100}
                            className="h-2"
                          />
                        </div>

                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <Badge variant="outline" className="w-fit text-xs uppercase tracking-wide">
                            {t('home.modes.preorder')}
                          </Badge>

                          <Button
                            onClick={() => handleRepostPreorder(item)}
                            size="sm"
                            className="rounded-full"
                          >
                            {t('merchant.repostPreorder')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-primary" />
            <span>{t('merchant.preorderProtection')}</span>
            {usingDemoReposts && (
              <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
                {t('common.demoData')}
              </Badge>
            )}
          </div>

          {myReposts.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/30 p-6 text-center text-sm text-muted-foreground">
              {t('merchant.preorderRepostsEmpty')}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {myReposts.map(item => (
                <div key={item.id} className="rounded-2xl border border-border/60 bg-card p-4 shadow-soft">
                  <div className="space-y-3">
                    <div className="flex gap-3">
                      <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-muted/40">
                        <img src={item.images[0]} alt={item.title} className="h-full w-full object-cover" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <h3 className="line-clamp-2 font-semibold text-foreground">{item.title}</h3>
                        <span className="text-lg font-bold text-foreground">
                          {item.priceXAF.toLocaleString()} F
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {t('merchant.sharedMOQ')}: {item.sharedMoq.committed}/{item.sharedMoq.target}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {getTimeToLock(item.lockAt)}
                        </Badge>
                      </div>
                      <Progress
                        value={(item.sharedMoq.committed / item.sharedMoq.target) * 100}
                        className="h-2"
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-1 text-primary font-medium">
                          <TrendingUp className="h-3 w-3" />
                          <span>{item.ordersViaMe} {t('merchant.ordersViaMe')}</span>
                        </div>
                        <div className="text-muted-foreground">
                          {t('merchant.commissionToDate')}: {item.commissionToDateXAF.toLocaleString()} F
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <Share2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <RepostPreorderSheet
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
        item={selectedItem}
        onConfirm={handleRepostConfirmed}
      />
    </>
  );
};

export default MerchantPreorders;
