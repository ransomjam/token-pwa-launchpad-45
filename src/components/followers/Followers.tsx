import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBuyerFollowers, type BuyerFollower } from '@/lib/followersData';

const getInitials = (name: string) =>
  name
    .split(' ')
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

export const Followers = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const followers = useMemo(() => getBuyerFollowers(), []);

  const handleMakeDeal = (follower: BuyerFollower) => {
    navigate('/buyers/deals', {
      state: {
        newDealBuyer: {
          id: follower.buyerId,
          name: follower.name,
          email: follower.email,
          phone: follower.phone,
        },
      },
    });
  };

  return (
    <div className="space-y-3 p-4">
      {followers.map(follower => (
        <div
          key={follower.id}
          className="rounded-2xl border border-border/60 bg-card/90 p-4 shadow-soft"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={follower.avatar} alt={follower.name} />
              <AvatarFallback>{getInitials(follower.name)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{follower.name}</p>
              <p className="text-xs text-muted-foreground">{follower.location}</p>
            </div>
            <Badge variant="outline" className="rounded-full text-xs font-medium">
              {t('following.followingSince', { value: follower.followingSince })}
            </Badge>
          </div>

          <div className="mt-4 grid gap-3 text-sm">
            <div className="flex flex-wrap gap-3 text-muted-foreground">
              <span className="rounded-full bg-muted/60 px-3 py-1 text-xs font-medium text-muted-foreground">
                {t('following.spendLast90d')}: {follower.spendLast90d}
              </span>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {t('following.lastOrder')}: {follower.lastOrder}
              </span>
            </div>
            <div className="grid gap-1 text-muted-foreground">
              <p className="font-medium text-foreground">{t('following.focusAreas')}</p>
              <p className="text-sm">{follower.focusAreas.join(' • ')}</p>
            </div>
            <div className="grid gap-1 text-muted-foreground">
              <p className="font-medium text-foreground">{t('following.emailLabel')}</p>
              <p>{follower.email}</p>
            </div>
            <div className="grid gap-1 text-muted-foreground">
              <p className="font-medium text-foreground">{t('following.phoneLabel')}</p>
              <p>{follower.phone}</p>
            </div>
            {follower.notes && (
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3 text-xs text-primary">
                {follower.notes}
              </div>
            )}
          </div>

          <Button className="mt-4 w-full rounded-full sm:w-auto" onClick={() => handleMakeDeal(follower)}>
            {t('following.makeDeal')}
          </Button>
        </div>
      ))}
    </div>
  );
};
