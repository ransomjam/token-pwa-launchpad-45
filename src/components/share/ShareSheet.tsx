import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Copy, MoreHorizontal, WifiOff, ShieldCheck } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useI18n } from '@/context/I18nContext';
import { useNetworkStatus } from '@/hooks/use-network-status';
import {
  buildListingShareMessage,
  buildListingSharePreview,
  buildStoreShareMessage,
  buildStoreSharePreview,
  isBoosterEligible,
  type ListingShareContent,
  type ListingShareTemplate,
  type ShareChannel,
  type StoreShareContent,
} from '@/lib/share';
import { trackEvent } from '@/lib/analytics';

type ListingSheetProps = {
  context: 'listing';
  data: ListingShareContent | null;
};

type StoreSheetProps = {
  context: 'store';
  data: StoreShareContent | null;
};

type ShareSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
} & (ListingSheetProps | StoreSheetProps);

const triggerHaptic = () => {
  try {
    window.navigator?.vibrate?.(10);
  } catch {
    // ignore
  }
};

const copyToClipboard = async (value: string) => {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    // fall through to manual copy
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = value;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const succeeded = document.execCommand('copy');
    document.body.removeChild(textarea);
    return succeeded;
  } catch {
    return false;
  }
};

const usePriceLabel = (locale: 'en' | 'fr', value: number) =>
  useMemo(() => {
    const formatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: 'XAF',
      maximumFractionDigits: 0,
    });
    return formatter.format(value).replace(/\u00A0/g, '\u202F');
  }, [locale, value]);

const usePercentLabel = (value: number) =>
  useMemo(() => `${Math.round(value)}%`, [value]);

const cardShadow = 'shadow-[0px_8px_24px_rgba(15,23,42,0.08)]';

const ShareSheet = ({ open, onOpenChange, ...rest }: ShareSheetProps) => {
  const props = rest as ListingSheetProps | StoreSheetProps;
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const isOnline = useNetworkStatus();
  const [useShortLink, setUseShortLink] = useState(true);
  const [template, setTemplate] = useState<ListingShareTemplate>('standard');
  const lastTemplateRef = useRef<Record<string, ListingShareTemplate>>({});
  const previousOpenRef = useRef(false);
  const autoCopiedRef = useRef(false);
  const shareLogRef = useRef<number[]>([]);
  const rateHintShownRef = useRef(false);

  const listingData = props.context === 'listing' ? props.data : null;
  const storeData = props.context === 'store' ? props.data : null;

  useEffect(() => {
    if (open && !previousOpenRef.current) {
      const id = props.data?.id;
      if (id) {
        trackEvent('share_sheet_open', { context: props.context, id });
      }
    }
    previousOpenRef.current = open;
    if (!open) {
      autoCopiedRef.current = false;
      shareLogRef.current = [];
      rateHintShownRef.current = false;
      setUseShortLink(true);
    }
  }, [open, props.context, props.data?.id]);

  useEffect(() => {
    if (!open || props.context !== 'listing' || !listingData) return;
    if (!isBoosterEligible(listingData)) {
      setTemplate('standard');
      lastTemplateRef.current[listingData.id] = 'standard';
      return;
    }
    const previous = lastTemplateRef.current[listingData.id];
    const next: ListingShareTemplate = previous === 'booster' ? 'standard' : 'booster';
    setTemplate(next);
    lastTemplateRef.current[listingData.id] = next;
  }, [open, listingData, props.context]);

  const preview = useMemo(() => {
    if (!props.data) return { text: '', link: '' };
    if (props.context === 'listing') {
      return buildListingSharePreview(props.data, locale, template, useShortLink);
    }
    return buildStoreSharePreview(props.data, locale, useShortLink);
  }, [locale, props.context, props.data, template, useShortLink]);

  useEffect(() => {
    if (!open || isOnline || autoCopiedRef.current || !props.data) return;
    const channel: ShareChannel = 'copy';
    const sharePayload = props.context === 'listing'
      ? buildListingShareMessage(props.data, locale, template, channel, useShortLink)
      : buildStoreShareMessage(props.data, locale, channel, useShortLink);
    copyToClipboard(sharePayload.text).then(succeeded => {
      autoCopiedRef.current = succeeded;
      if (succeeded) {
        toast({ description: t('share.offlineToast') });
        trackEvent('share_offline_copy', { context: props.context, id: props.data?.id });
      } else {
        toast({ description: t('share.copyError'), variant: 'destructive' });
      }
    });
  }, [locale, open, isOnline, props.context, props.data, template, toast, t, useShortLink]);

  const priceLabel = usePriceLabel(locale, listingData?.priceXAF ?? 0);
  const onTimeLabel = usePercentLabel(listingData?.onTimePct ?? 0);

  const logShareAttempt = () => {
    const now = Date.now();
    shareLogRef.current = shareLogRef.current.filter(ts => now - ts < 60_000);
    shareLogRef.current.push(now);
    if (shareLogRef.current.length >= 3 && !rateHintShownRef.current) {
      rateHintShownRef.current = true;
      toast({ description: t('share.rateLimitHint') });
      if (props.data?.id) {
        trackEvent('share_rate_limit_hint_shown', { context: props.context, id: props.data.id });
      }
    }
  };

  const handleChannelShare = async (channel: ShareChannel) => {
    if (!props.data) return;
    triggerHaptic();
    const payload = props.context === 'listing'
      ? buildListingShareMessage(props.data, locale, template, channel, useShortLink)
      : buildStoreShareMessage(props.data, locale, channel, useShortLink);
    const maybeTrackBooster = () => {
      if (props.context === 'listing' && template === 'booster') {
        trackEvent('share_booster_used', { listingId: props.data?.id });
      }
    };
    if (channel === 'whatsapp') {
      const waUrl = `https://wa.me/?text=${encodeURIComponent(payload.text)}`;
      const opened = window.open(waUrl, '_blank', 'noopener,noreferrer');
      if (opened) {
        toast({ description: t('share.toast.whatsapp') });
        trackEvent('share_click', {
          channel: 'whatsapp',
          context: props.context,
          id: props.data.id,
          short: useShortLink,
          template: props.context === 'listing' ? template : undefined,
        });
        maybeTrackBooster();
        logShareAttempt();
        return;
      }
      const copied = await copyToClipboard(payload.text);
      toast({ description: copied ? t('share.toast.whatsappFallback') : t('share.copyError'), variant: copied ? undefined : 'destructive' });
      if (copied) {
        trackEvent('share_click', {
          channel: 'whatsapp',
          context: props.context,
          id: props.data.id,
          short: useShortLink,
          template: props.context === 'listing' ? template : undefined,
          fallback: 'copy',
        });
        maybeTrackBooster();
        logShareAttempt();
      }
      return;
    }

    if (channel === 'copy') {
      const copied = await copyToClipboard(payload.text);
      toast({ description: copied ? t('share.toast.copied') : t('share.copyError'), variant: copied ? undefined : 'destructive' });
      if (copied) {
        trackEvent('share_click', {
          channel: 'copy',
          context: props.context,
          id: props.data.id,
          short: useShortLink,
          template: props.context === 'listing' ? template : undefined,
        });
        maybeTrackBooster();
        logShareAttempt();
      }
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: props.context === 'listing' ? props.data.title : storeData?.storeName,
          text: payload.text,
          url: payload.link,
        });
        toast({ description: t('share.toast.shared') });
        trackEvent('share_click', {
          channel: 'system',
          context: props.context,
          id: props.data.id,
          short: useShortLink,
          template: props.context === 'listing' ? template : undefined,
        });
        maybeTrackBooster();
        logShareAttempt();
        return;
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') {
          return;
        }
      }
    }

    const copied = await copyToClipboard(payload.text);
    toast({ description: copied ? t('share.toast.sharedFallback') : t('share.copyError'), variant: copied ? undefined : 'destructive' });
    if (copied) {
      trackEvent('share_click', {
        channel: 'system',
        context: props.context,
        id: props.data.id,
        short: useShortLink,
        template: props.context === 'listing' ? template : undefined,
        fallback: 'copy',
      });
      maybeTrackBooster();
      logShareAttempt();
    }
  };

  const handleShortLinkToggle = (checked: boolean) => {
    setUseShortLink(checked);
    if (props.data?.id) {
      trackEvent('share_shortlink_toggle', {
        context: props.context,
        id: props.data.id,
        state: checked ? 'on' : 'off',
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[80vh] overflow-y-auto rounded-t-3xl px-6 pb-8 pt-6">
        <div className="mx-auto flex w-full max-w-xl flex-col gap-5">
          <SheetHeader className="items-start text-left">
            <SheetTitle className="text-lg font-semibold text-foreground">
              {props.context === 'listing' ? t('share.sheetTitleListing') : t('share.sheetTitleStore')}
            </SheetTitle>
            <SheetDescription className="text-sm text-muted-foreground">
              {t('share.sheetSubtitle')}
            </SheetDescription>
          </SheetHeader>

          {props.data ? (
            <div className={cn('flex items-start gap-3 rounded-2xl border border-border/70 bg-background/90 p-3', cardShadow)}>
              {props.context === 'listing' ? (
                <div className="h-14 w-14 overflow-hidden rounded-xl border border-border/70 bg-muted">
                  <img
                    src={listingData?.image}
                    alt={listingData?.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <Avatar className="h-14 w-14 rounded-xl border border-border/70">
                  {storeData?.avatarUrl ? (
                    <AvatarImage src={storeData.avatarUrl} alt={storeData.storeName} />
                  ) : (
                    <AvatarFallback className="rounded-xl bg-primary/10 text-base font-semibold text-primary">
                      {storeData?.avatarInitials?.slice(0, 2)}
                    </AvatarFallback>
                  )}
                </Avatar>
              )}
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">
                    {props.context === 'listing' ? listingData?.title : storeData?.storeName}
                  </p>
                  {props.data?.isDemo ? (
                    <Badge variant="outline" className="rounded-full border-dashed px-2 py-0.5 text-xs">
                      {t('share.demoBadge')}
                    </Badge>
                  ) : null}
                </div>
                {props.context === 'listing' ? (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <span className="font-medium text-primary/80">{priceLabel}</span>
                    <Badge variant="outline" className="rounded-full border px-2 py-0.5 text-[11px]">
                      {t('share.etaChip', { min: listingData?.etaMin, max: listingData?.etaMax })}
                    </Badge>
                    <Badge variant="outline" className="rounded-full border px-2 py-0.5 text-[11px]">
                      {t('share.laneChip', { lane: listingData?.laneCode, pct: onTimeLabel })}
                    </Badge>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="rounded-full border px-2 py-0.5 text-[11px]">
                      {t('share.storePerformance', {
                        onTime: Math.round(storeData?.onTimePct ?? 0),
                        disputes: Math.round(storeData?.disputePct ?? 0),
                      })}
                    </Badge>
                  </div>
                )}
                <div className="inline-flex items-center gap-2 text-xs text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" aria-hidden />
                  <span>{t('share.trustLine')}</span>
                </div>
              </div>
            </div>
          ) : null}

          {!isOnline ? (
            <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              <WifiOff className="h-4 w-4" aria-hidden />
              <span>{t('share.offlineBanner')}</span>
            </div>
          ) : null}

          <div className="flex items-center justify-between rounded-2xl border border-border/70 bg-muted/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-foreground">{t('share.shortLinkLabel')}</p>
              <p className="text-xs text-muted-foreground">{t('share.shortLinkHint')}</p>
            </div>
            <Switch checked={useShortLink} onCheckedChange={handleShortLinkToggle} aria-label={t('share.shortLinkAria')} />
          </div>

          <div className="rounded-2xl border border-border/60 bg-background/95 p-4">
            <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">
              {preview.text || t('share.previewPlaceholder')}
            </pre>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Button
              type="button"
              className="h-12 rounded-full bg-[#25D366] text-white shadow-sm transition-colors hover:bg-[#1ebe5d]"
              aria-label={t('share.whatsappAria')}
              onClick={() => handleChannelShare('whatsapp')}
              disabled={!props.data || !isOnline}
            >
              <MessageCircle className="mr-2 h-4 w-4" aria-hidden />
              {t('share.whatsappLabel')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full"
              aria-label={t('share.copyAria')}
              onClick={() => handleChannelShare('copy')}
              disabled={!props.data}
            >
              <Copy className="mr-2 h-4 w-4" aria-hidden />
              {t('share.copyLabel')}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-full"
              aria-label={t('share.moreAria')}
              onClick={() => handleChannelShare('system')}
              disabled={!props.data || !isOnline}
            >
              <MoreHorizontal className="mr-2 h-4 w-4" aria-hidden />
              {t('share.moreLabel')}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">{t('share.footnote')}</p>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default ShareSheet;
