import { useState } from 'react';
import { useI18n } from '@/context/I18nContext';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { getFollowState, updateNotifyState, type NotifyState } from '@/lib/followersData';
import { useToast } from '@/hooks/use-toast';
import { trackEvent } from '@/lib/analytics';

type NotifySheetProps = {
  creatorId: string;
  onClose: () => void;
};

export const NotifySheet = ({ creatorId, onClose }: NotifySheetProps) => {
  const { t } = useI18n();
  const { toast } = useToast();
  const followState = getFollowState(creatorId);
  
  const [auctionsNotify, setAuctionsNotify] = useState<NotifyState>(
    followState?.auctionsNotify || 'off'
  );
  const [preordersNotify, setPreordersNotify] = useState<NotifyState>(
    followState?.preordersNotify || 'off'
  );

  const handleSave = () => {
    updateNotifyState(creatorId, 'auctions', auctionsNotify);
    updateNotifyState(creatorId, 'preorders', preordersNotify);
    toast({ description: t('following.notificationsUpdated') });
    trackEvent('update_notifications', { creatorId, auctionsNotify, preordersNotify });
    onClose();
  };

  return (
    <Sheet open onOpenChange={onClose}>
      <SheetContent side="bottom" className="rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>{t('following.requestNotifications')}</SheetTitle>
          <SheetDescription>{t('following.notifyReassurance')}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('following.newAuctions')}</Label>
            <RadioGroup value={auctionsNotify} onValueChange={(v) => setAuctionsNotify(v as NotifyState)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="on" id="auctions-on" />
                <Label htmlFor="auctions-on" className="text-sm font-normal">
                  {t('following.notifyOn')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending" id="auctions-pending" />
                <Label htmlFor="auctions-pending" className="text-sm font-normal">
                  {t('following.notifyPending')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="off" id="auctions-off" />
                <Label htmlFor="auctions-off" className="text-sm font-normal">
                  {t('following.notifyOff')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-medium">{t('following.newPreorders')}</Label>
            <RadioGroup value={preordersNotify} onValueChange={(v) => setPreordersNotify(v as NotifyState)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="on" id="preorders-on" />
                <Label htmlFor="preorders-on" className="text-sm font-normal">
                  {t('following.notifyOn')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pending" id="preorders-pending" />
                <Label htmlFor="preorders-pending" className="text-sm font-normal">
                  {t('following.notifyPending')}
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="off" id="preorders-off" />
                <Label htmlFor="preorders-off" className="text-sm font-normal">
                  {t('following.notifyOff')}
                </Label>
              </div>
            </RadioGroup>
          </div>

          <Button onClick={handleSave} className="w-full">
            {t('common.save')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
