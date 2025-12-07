import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '@/context/I18nContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CheckCircle2, MoreVertical, Bell, BellOff, Share2, UserX, Flag } from 'lucide-react';
import { getFollowedCreators, getFollowState, updateNotifyState, unfollowCreator, blockCreator, type NotifyState } from '@/lib/followersData';
import { NotifySheet } from './NotifySheet';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

type MyFollowsProps = {
  onShowDiscover?: () => void;
};

export const MyFollows = ({ onShowDiscover }: MyFollowsProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const [creators, setCreators] = useState(() => getFollowedCreators());
  const [notifySheetCreatorId, setNotifySheetCreatorId] = useState<string | null>(null);

  const handleUnfollow = (creatorId: string, creatorName: string) => {
    unfollowCreator(creatorId);
    setCreators(prev => prev.filter(c => c.id !== creatorId));
    toast({ description: t('following.unfollowed', { name: creatorName }) });
    trackEvent('unfollow_creator', { creatorId });
  };

  const handleBlock = (creatorId: string, creatorName: string) => {
    blockCreator(creatorId);
    setCreators(prev => prev.filter(c => c.id !== creatorId));
    toast({ description: t('following.blocked', { name: creatorName }) });
    trackEvent('block_creator', { creatorId });
  };

  const handleReport = (creatorId: string) => {
    toast({ description: t('following.reported') });
    trackEvent('report_creator', { creatorId });
  };

  const toggleNotify = (creatorId: string, type: 'auctions' | 'preorders') => {
    const state = getFollowState(creatorId);
    if (!state) return;

    const current = type === 'auctions' ? state.auctionsNotify : state.preordersNotify;
    const next: NotifyState = current === 'on' ? 'off' : 'on';
    
    updateNotifyState(creatorId, type, next);
    setCreators([...creators]); // force re-render
    toast({ description: t('following.notificationsUpdated') });
    trackEvent('toggle_notify', { creatorId, type, state: next });
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getNotifyIcon = (state: NotifyState) => {
    if (state === 'on') return <Bell className="h-4 w-4 text-primary" />;
    if (state === 'pending') return <Bell className="h-4 w-4 text-amber-500" />;
    return <BellOff className="h-4 w-4 text-muted-foreground" />;
  };

  if (creators.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <p className="text-muted-foreground mb-4">{t('following.emptyFollows')}</p>
        <Button variant="default" size="sm" onClick={onShowDiscover}>
          {t('following.discover')}
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-2">
      {creators.map(creator => {
        const state = getFollowState(creator.id);
        if (!state) return null;

        return (
          <div
            key={creator.id}
            className="bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3"
          >
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
              <div className="flex gap-2 mt-1">
                <button
                  onClick={() => toggleNotify(creator.id, 'auctions')}
                  className="flex items-center gap-1 text-xs"
                >
                  {getNotifyIcon(state.auctionsNotify)}
                  <span className="text-muted-foreground">{t('following.auctions')}</span>
                </button>
                <button
                  onClick={() => toggleNotify(creator.id, 'preorders')}
                  className="flex items-center gap-1 text-xs"
                >
                  {getNotifyIcon(state.preordersNotify)}
                  <span className="text-muted-foreground">{t('following.preorders')}</span>
                </button>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => setNotifySheetCreatorId(creator.id)}>
                  <Bell className="h-4 w-4 mr-2" />
                  {t('following.manageNotifications')}
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Share2 className="h-4 w-4 mr-2" />
                  {t('following.shareProfile')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleUnfollow(creator.id, creator.name)}>
                  <UserX className="h-4 w-4 mr-2" />
                  {t('following.unfollow')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBlock(creator.id, creator.name)}>
                  <UserX className="h-4 w-4 mr-2" />
                  {t('following.block')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleReport(creator.id)}>
                  <Flag className="h-4 w-4 mr-2" />
                  {t('following.report')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        );
      })}

      {notifySheetCreatorId && (
        <NotifySheet
          creatorId={notifySheetCreatorId}
          onClose={() => setNotifySheetCreatorId(null)}
        />
      )}
    </div>
  );
};
