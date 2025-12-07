import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  getNotificationCounts,
  subscribeToNotificationUpdates,
} from '@/lib/notificationsData';

type NotificationBadgeState = {
  unread: number;
  total: number;
  realTotal: number;
};

const getBadgeState = (): NotificationBadgeState => {
  return getNotificationCounts();
};

export const NotificationBell = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [badgeState, setBadgeState] = useState<NotificationBadgeState>(() => getBadgeState());

  useEffect(() => {
    const update = () => setBadgeState(getBadgeState());

    update();

    const unsubscribe = subscribeToNotificationUpdates(update);
    const handleStorage = () => update();

    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    setBadgeState(getBadgeState());
  }, [location.pathname]);

  const ariaLabel = useMemo(() => {
    if (badgeState.unread > 0) {
      return `Notifications (${badgeState.unread} unread)`;
    }

    return 'Notifications';
  }, [badgeState.unread]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className="relative h-11 w-11 rounded-2xl border border-border/80 bg-card/80 text-foreground shadow-soft transition hover:border-primary/50 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
      onClick={() => navigate('/notifications')}
      aria-label={ariaLabel}
    >
      <Bell className="h-5 w-5" />
      {badgeState.unread > 0 ? (
        <span
          className="absolute -top-0.5 -right-0.5 flex min-h-[20px] min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground shadow-[0_0_0_2px_rgba(255,255,255,0.9)]"
        >
          {badgeState.unread > 99 ? '99+' : badgeState.unread}
        </span>
      ) : badgeState.realTotal === 0 ? (
        <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(255,255,255,0.9)]" />
      ) : null}
    </Button>
  );
};
