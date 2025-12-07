import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, Mail, MessageSquare, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useI18n } from '@/context/I18nContext';
import {
  getNotificationSettings,
  saveNotificationSettings,
  type NotificationSettings as Settings,
  type NotificationChannel
} from '@/lib/notificationsData';
import { trackEvent } from '@/lib/analytics';
import { toast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const NotificationSettings = () => {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [settings, setSettings] = useState<Settings>(getNotificationSettings());

  const updateSettings = (updates: Partial<Settings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    saveNotificationSettings(newSettings);
  };

  const toggleChannel = (channel: NotificationChannel) => {
    updateSettings({
      channels: {
        ...settings.channels,
        [channel]: !settings.channels[channel]
      }
    });
    trackEvent('notification_channel_toggle', { channel, enabled: !settings.channels[channel] });
    toast({ title: t('notifications.settings.channelUpdated') });
  };

  const toggleQuietHours = () => {
    updateSettings({
      quietHours: {
        ...settings.quietHours,
        enabled: !settings.quietHours.enabled
      }
    });
    trackEvent('notification_quiet_hours_toggle', { enabled: !settings.quietHours.enabled });
  };

  const updateDigest = (digest: Settings['digest']) => {
    updateSettings({ digest });
    trackEvent('notification_digest_update', { digest });
    toast({ title: t('notifications.settings.digestUpdated') });
  };

  const channels: Array<{
    key: NotificationChannel;
    label: string;
    description: string;
    icon: any;
    isPreview?: boolean;
  }> = [
    {
      key: 'inapp',
      label: t('notifications.channels.inapp'),
      description: t('notifications.channels.inappDesc'),
      icon: Bell
    },
    {
      key: 'push',
      label: t('notifications.channels.push'),
      description: t('notifications.channels.pushDesc'),
      icon: Smartphone,
      isPreview: true
    },
    {
      key: 'whatsapp',
      label: t('notifications.channels.whatsapp'),
      description: t('notifications.channels.whatsappDesc'),
      icon: MessageSquare,
      isPreview: true
    },
    {
      key: 'sms',
      label: t('notifications.channels.sms'),
      description: t('notifications.channels.smsDesc'),
      icon: MessageSquare,
      isPreview: true
    },
    {
      key: 'email',
      label: t('notifications.channels.email'),
      description: t('notifications.channels.emailDesc'),
      icon: Mail,
      isPreview: true
    }
  ];

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
          <h1 className="text-lg font-semibold">{t('notifications.settings.title')}</h1>
        </div>
      </header>

      <div className="space-y-6 p-4">
        {/* Channels */}
        <section>
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('notifications.settings.channelsTitle')}
          </h2>
          <div className="space-y-4">
            {channels.map(channel => {
              const Icon = channel.icon;
              return (
                <div key={channel.key} className="rounded-2xl border bg-card p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Label htmlFor={`channel-${channel.key}`} className="font-semibold">
                          {channel.label}
                        </Label>
                        {channel.isPreview && (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium">
                            {t('notifications.settings.preview')}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {channel.description}
                      </p>
                      <Switch
                        id={`channel-${channel.key}`}
                        checked={settings.channels[channel.key]}
                        onCheckedChange={() => toggleChannel(channel.key)}
                        disabled={channel.key === 'inapp'}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <Separator />

        {/* Quiet Hours */}
        <section>
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('notifications.settings.quietHoursTitle')}
          </h2>
          <div className="rounded-2xl border bg-card p-4">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex-1">
                <Label htmlFor="quiet-hours" className="font-semibold">
                  {t('notifications.settings.quietHoursLabel')}
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('notifications.settings.quietHoursDesc')}
                </p>
              </div>
              <Switch
                id="quiet-hours"
                checked={settings.quietHours.enabled}
                onCheckedChange={toggleQuietHours}
              />
            </div>
            {settings.quietHours.enabled && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{settings.quietHours.start}</span>
                <span>—</span>
                <span>{settings.quietHours.end}</span>
              </div>
            )}
          </div>
        </section>

        <Separator />

        {/* Digest */}
        <section>
          <h2 className="mb-4 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            {t('notifications.settings.digestTitle')}
          </h2>
          <div className="rounded-2xl border bg-card p-4">
            <Label htmlFor="digest" className="font-semibold mb-2 block">
              {t('notifications.settings.digestLabel')}
            </Label>
            <p className="text-xs text-muted-foreground mb-4">
              {t('notifications.settings.digestDesc')}
            </p>
            <Select value={settings.digest} onValueChange={updateDigest}>
              <SelectTrigger id="digest">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="off">{t('notifications.settings.digestOff')}</SelectItem>
                <SelectItem value="daily">
                  {t('notifications.settings.digestDaily')} ({settings.digestTime})
                </SelectItem>
                <SelectItem value="weekly">
                  {t('notifications.settings.digestWeekly')} ({settings.digestTime})
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </section>
      </div>
    </div>
  );
};

export default NotificationSettings;
