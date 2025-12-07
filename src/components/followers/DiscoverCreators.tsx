import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Bell } from 'lucide-react';
import { getAllCreators, isFollowing, followCreator, unfollowCreator, rankCreators } from '@/lib/followersData';
import { NotifySheet } from './NotifySheet';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

export const DiscoverCreators = () => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [creators] = useState(() => rankCreators(getAllCreators()));
  const [following, setFollowing] = useState<Set<string>>(
    () => new Set(creators.filter(c => isFollowing(c.id)).map(c => c.id))
  );
  const [notifySheetCreatorId, setNotifySheetCreatorId] = useState<string | null>(null);

  const handleFollow = (creatorId: string, creatorName: string) => {
    if (following.has(creatorId)) {
      unfollowCreator(creatorId);
      setFollowing(prev => {
        const next = new Set(prev);
        next.delete(creatorId);
        return next;
      });
      toast({ description: t('following.unfollowed', { name: creatorName }) });
      trackEvent('unfollow_creator', { creatorId });
    } else {
      followCreator(creatorId);
      setFollowing(prev => new Set(prev).add(creatorId));
      toast({ description: t('following.nowFollowing', { name: creatorName }) });
      trackEvent('follow_creator', { creatorId });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-1 gap-3">
        {creators.map(creator => (
          <div
            key={creator.id}
            className="bg-card rounded-2xl p-3 shadow-sm border border-border/50 flex flex-col gap-2"
          >
            <div className="flex items-start gap-2">
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={creator.avatar} alt={creator.name} />
                <AvatarFallback className="text-xs bg-primary/10 text-primary font-medium">
                  {getInitials(creator.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <Link to={`/creator/${creator.id}`} className="text-sm font-medium truncate hover:text-primary">
                    {creator.name}
                  </Link>
                  {creator.verified && (
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {creator.followersCount} {t('following.followers')}
                </p>
              </div>
            </div>

            <div className="space-y-1 text-xs text-muted-foreground">
              <p>{creator.closedDeals60d} {t('following.closedDeals')}</p>
              <div className="flex flex-wrap gap-1">
                {creator.lanes.slice(0, 2).map((lane, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs px-1.5 py-0">
                    {lane}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-2 mt-1">
              <Button
                asChild
                size="sm"
                variant="outline"
                className="flex-1 h-8 text-xs"
              >
                <Link to={`/creator/${creator.id}`} className="w-full text-center">
                  {t('following.viewProfile')}
                </Link>
              </Button>
              <Button
                size="sm"
                variant={following.has(creator.id) ? 'secondary' : 'default'}
                className="flex-1 h-8 text-xs"
                onClick={() => handleFollow(creator.id, creator.name)}
              >
                {following.has(creator.id) ? t('following.following') : t('following.follow')}
              </Button>
              {following.has(creator.id) && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0"
                  onClick={() => setNotifySheetCreatorId(creator.id)}
                >
                  <Bell className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {notifySheetCreatorId && (
        <NotifySheet
          creatorId={notifySheetCreatorId}
          onClose={() => setNotifySheetCreatorId(null)}
        />
      )}
    </div>
  );
};
