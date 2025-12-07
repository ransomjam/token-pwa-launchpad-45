import { useState } from 'react';
import { Calendar, DollarSign } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/analytics';
import { toast } from '@/hooks/use-toast';
import type { ListingCatalogItem } from '@/lib/merchantData';

type RepostListingSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: ListingCatalogItem | null;
  onConfirm?: (item: ListingCatalogItem) => void;
};

export const RepostListingSheet = ({ open, onOpenChange, item, onConfirm }: RepostListingSheetProps) => {
  const { t } = useI18n();
  const [minimumBid, setMinimumBid] = useState('');
  const [endTime, setEndTime] = useState('');

  if (!item) return null;

  const handleSubmit = () => {
    if (item.type === 'auction') {
      const bidAmount = parseInt(minimumBid);
      if (!bidAmount || bidAmount < item.ownerMinXAF) {
        toast({
          variant: "destructive",
          title: t('merchant.invalidBid'),
          description: t('merchant.bidMustBeHigher', { min: item.ownerMinXAF.toLocaleString() }),
        });
        return;
      }
      if (!endTime) {
        toast({
          variant: "destructive",
          title: t('merchant.endTimeRequired'),
        });
        return;
      }
    }

    trackEvent('merchant_listing_repost', {
      itemId: item.id,
      type: item.type,
      minimumBid: item.type === 'auction' ? minimumBid : undefined
    });

    toast({
      title: t('merchant.repostSuccess'),
      description: t('merchant.repostSuccessDesc'),
    });

    if (onConfirm) {
      onConfirm(item);
    }

    onOpenChange(false);
  };

  const formatCommission = (rule: any) => {
    if (rule.type === 'percent') {
      return `${rule.value}%`;
    }
    return `+${rule.value.toLocaleString()} F`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-6 pb-8">
        <SheetHeader className="pb-6">
          <SheetTitle>{item.type === 'auction' ? t('merchant.repostAuction') : t('merchant.repostListing')}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Item Preview */}
          <div className="flex gap-4 rounded-2xl border border-border/60 bg-muted/20 p-4">
            <div className="h-16 w-16 rounded-xl bg-muted/40 flex items-center justify-center overflow-hidden">
              <img 
                src={item.image} 
                alt={item.title}
                className="h-full w-full object-contain"
              />
            </div>
            <div className="flex-1 space-y-1">
              <h3 className="font-semibold text-foreground leading-tight">{item.title}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{item.owner.name}</span>
                {item.owner.verified && (
                  <Badge variant="secondary" className="text-xs">
                    {t('common.verified')}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm">
                <span className="font-medium">
                  {item.type === 'auction' 
                    ? `${t('merchant.ownerMinimum')}: ${item.ownerMinXAF?.toLocaleString()} F`
                    : `${item.priceXAF.toLocaleString()} F`
                  }
                </span>
                <span className="text-primary font-medium">
                  {t('merchant.commission')}: {formatCommission(item.commissionRule)}
                </span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          {item.type === 'auction' ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="minimumBid" className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  {t('merchant.minimumBid')}
                </Label>
                <Input
                  id="minimumBid"
                  type="number"
                  value={minimumBid}
                  onChange={(e) => setMinimumBid(e.target.value)}
                  placeholder={`${t('merchant.minimum')} ${item.ownerMinXAF.toLocaleString()} F`}
                  className="rounded-xl"
                />
                <p className="text-xs text-muted-foreground">
                  {t('merchant.mustBeAtLeast')} {item.ownerMinXAF.toLocaleString()} F
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t('merchant.endTime')}
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="rounded-xl"
                />
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
              <h4 className="font-semibold text-primary mb-2">{t('merchant.readyToPublish')}</h4>
              <p className="text-sm text-muted-foreground">
                {t('merchant.directListingReady')}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-full"
            >
              {t('common.cancel')}
            </Button>
            <Button
              onClick={handleSubmit}
              className="flex-1 rounded-full"
            >
              {t('merchant.confirmPublish')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};