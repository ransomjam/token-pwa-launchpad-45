import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';

import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { Creator } from '@/lib/followersData';

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(part => part[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);

type MerchantFollowUpdatesProps = {
  creators: Creator[];
};

export const MerchantFollowUpdates = ({ creators }: MerchantFollowUpdatesProps) => {
  const { t } = useI18n();

  if (creators.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-dashed border-border/60 bg-muted/30 p-10 text-center shadow-soft">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Sparkles className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{t('merchant.noFollowUpdatesTitle')}</h3>
          <p className="text-sm text-muted-foreground">{t('merchant.noFollowUpdatesSubtitle')}</p>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/buyer/following">{t('merchant.manageFollows')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">{t('merchant.newFromFollows')}</h2>
            <p className="text-sm text-muted-foreground">{t('merchant.fromFollows')}</p>
          </div>
        </div>
        <Button asChild className="rounded-full">
          <Link to="/buyer/following">{t('merchant.manageFollows')}</Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {creators.map(creator => (
          <Link
            key={creator.id}
            to={`/creator/${creator.id}`}
            className="group flex flex-col gap-4 rounded-2xl border border-border/60 bg-background/80 p-5 text-left shadow-soft transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            aria-label={t('merchant.followCardAria', {
              name: creator.name,
            })}
          >
            <div className="flex items-start gap-3">
              <Avatar className="h-12 w-12">
                <AvatarImage src={creator.avatar} alt={creator.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {getInitials(creator.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-foreground transition-colors group-hover:text-primary">
                    {creator.name}
                  </span>
                  {creator.verified && (
                    <Badge variant="secondary" className="rounded-full px-2 py-0.5 text-[10px] uppercase">
                      {t('common.verified')}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {creator.followersCount.toLocaleString()} {t('following.followers')} · {creator.closedDeals60d}{' '}
                  {t('following.closedDeals')}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2">
                {creator.newAuctions && (
                  <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 text-xs">
                    {t('following.newAuctions')}
                  </Badge>
                )}
                {creator.newPreorders && (
                  <Badge variant="outline" className="rounded-full px-2.5 py-0.5 text-xs">
                    {t('following.newPreorders')}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid gap-3 text-xs text-muted-foreground sm:grid-cols-3">
              <div>
                <p className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                  {t('following.closedDealsWindow')}
                </p>
                <p className="text-sm font-semibold text-foreground">{creator.closedDeals60d}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                  {t('following.responseTime')}
                </p>
                <p className="text-sm font-semibold text-foreground">{creator.responseTime}</p>
              </div>
              <div>
                <p className="uppercase tracking-wide text-[10px] text-muted-foreground/80">
                  {t('merchant.onTimePercent')}
                </p>
                <p className="text-sm font-semibold text-foreground">{creator.onTimePct}%</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
              {creator.lanes.map((lane, index) => (
                <Badge key={`${creator.id}-lane-${index}`} variant="outline" className="rounded-full px-2.5 py-0.5">
                  {lane}
                </Badge>
              ))}
            </div>

            {creator.categories.length > 0 && (
              <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                {creator.categories.map((category, index) => (
                  <Badge
                    key={`${creator.id}-category-${index}`}
                    variant="secondary"
                    className="rounded-full bg-muted/60 px-2.5 py-0.5"
                  >
                    {category}
                  </Badge>
                ))}
              </div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default MerchantFollowUpdates;
