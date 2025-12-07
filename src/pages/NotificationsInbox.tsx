import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Trash2, MoreVertical, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  clearAll,
  filterByCategory,
  formatRelativeTime,
  type Notification,
  type NotificationCategory,
  subscribeToNotificationUpdates
} from '@/lib/notificationsData';
import { trackEvent } from '@/lib/analytics';
import { toast } from '@/hooks/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

type TabType = 'all' | NotificationCategory;

const NotificationsInbox = () => {
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  const loadNotifications = useCallback(() => {
    const filtered = filterByCategory(activeTab);
    setNotifications(filtered);
  }, [activeTab]);

  useEffect(() => {
    loadNotifications();
    trackEvent('view_notifications_inbox', { tab: activeTab });

    const unsubscribe = subscribeToNotificationUpdates(loadNotifications);
    const handleStorage = () => loadNotifications();
    window.addEventListener('storage', handleStorage);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorage);
    };
  }, [activeTab, loadNotifications]);

  const handleMarkAllRead = () => {
    markAllAsRead();
    loadNotifications();
    toast({ title: t('notifications.markedAllRead') });
    trackEvent('notifications_mark_all_read');
  };

  const handleClearAll = () => {
    clearAll();
    loadNotifications();
    toast({ title: t('notifications.clearedAll') });
    trackEvent('notifications_clear_all');
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
      loadNotifications();
    }
    
    if (notification.ctaLink) {
      navigate(notification.ctaLink);
      trackEvent('notification_cta_click', { 
        event: notification.event,
        category: notification.category 
      });
    }
  };

  const tabs: Array<{ key: TabType; label: string }> = [
    { key: 'all', label: t('notifications.tabs.all') },
    { key: 'buying', label: t('notifications.tabs.buying') },
    { key: 'preorder', label: t('notifications.tabs.preorder') },
    { key: 'selling', label: t('notifications.tabs.selling') },
    { key: 'merchant', label: t('notifications.tabs.merchant') },
    { key: 'follows', label: t('notifications.tabs.follows') },
    { key: 'system', label: t('notifications.tabs.system') }
  ];

  const visibleTabs = tabs.filter(tab => {
    if (tab.key === 'all') return true;
    const allNotifications = getNotifications();
    return allNotifications.some(n => n.category === tab.key);
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            aria-label={t('common.back')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">{t('notifications.title')}</h1>
            {unreadCount > 0 && (
              <p className="text-xs text-muted-foreground">
                {unreadCount} {t('notifications.unread')}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            className="hidden rounded-full px-3 text-sm font-semibold sm:inline-flex"
            onClick={() => navigate('/settings/notifications')}
          >
            <Settings className="mr-2 h-4 w-4" />
            {t('notifications.settingsButton', { defaultValue: 'Settings' })}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleMarkAllRead}>
                <Check className="mr-2 h-4 w-4" />
                {t('notifications.markAllRead')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleClearAll} className="text-destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                {t('notifications.clearAll')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Tabs */}
        <div className="overflow-x-auto px-4 pb-2">
          <div className="flex gap-2">
            {visibleTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={cn(
                  'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-foreground text-background'
                    : 'bg-muted/60 text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="p-4">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
              <Check className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="mb-2 text-lg font-semibold">{t('notifications.empty.title')}</h2>
            <p className="mb-6 text-sm text-muted-foreground">
              {t('notifications.empty.description')}
            </p>
            <Button onClick={() => navigate('/')}>
              {t('notifications.empty.cta')}
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={cn(
                  'w-full rounded-2xl border p-4 text-left transition-all hover:shadow-md',
                  notification.read
                    ? 'bg-background border-border'
                    : 'bg-primary/5 border-primary/20'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'mt-0.5 h-2 w-2 shrink-0 rounded-full',
                    notification.read ? 'bg-muted' : 'bg-primary'
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="font-semibold text-sm line-clamp-1">
                        {notification.title}
                      </h3>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatRelativeTime(notification.timestamp, locale)}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {notification.body}
                    </p>
                    {notification.ctaLabel && (
                      <span className="text-xs font-medium text-primary">
                        {notification.ctaLabel} →
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsInbox;
