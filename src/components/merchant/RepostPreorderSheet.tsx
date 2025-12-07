import { Clock, Star, Shield } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { trackEvent } from '@/lib/analytics';
import { toast } from '@/hooks/use-toast';
import type { PreorderCatalogItem } from '@/lib/merchantData';

type RepostPreorderSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: PreorderCatalogItem | null;
  onConfirm?: (item: PreorderCatalogItem) => void;
};

export const RepostPreorderSheet = ({ open, onOpenChange, item, onConfirm }: RepostPreorderSheetProps) => {
  const { t } = useI18n();

  if (!item) return null;

  const handleConfirmRepost = () => {
    trackEvent('merchant_preorder_confirm_repost', { itemId: item.id });

    toast({
      title: t('merchant.preorderRepostSuccess'),
      description: t('merchant.preorderRepostSuccessDesc'),
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
    return `${rule.value.toLocaleString()} F`;
  };

  const getTimeToLock = (lockAt: string) => {
    const now = new Date();
    const lockTime = new Date(lockAt);
    const diffMs = lockTime.getTime() - now.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    return `${t('merchant.lockingSoon')}`;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-6 pb-8">
        <SheetHeader className="pb-6">
          <SheetTitle>{t('merchant.repostPreorder')}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6">
          {/* Item Preview */}
          <div className="rounded-2xl border border-border/60 bg-card p-4 space-y-4">
            <div className="flex gap-4">
              <div className="h-20 w-20 rounded-xl bg-muted/40 flex items-center justify-center overflow-hidden">
                <img 
                  src={item.images[0]} 
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-foreground leading-tight">{item.title}</h3>
                  <Badge variant="outline" className="flex items-center gap-1 text-xs">
                    <Clock className="h-3 w-3" />
                    {getTimeToLock(item.lockAt)}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-2xl font-bold text-foreground">{item.priceXAF.toLocaleString()} F</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{item.importer.name}</span>
                  {item.importer.verified && (
                    <Badge variant="secondary" className="text-xs px-2 py-0.5">
                      <Star className="h-3 w-3 mr-1" />
                      {t('common.verified')}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">MOQ {item.moq.committed}/{item.moq.target}</span>
                <span className="text-primary font-medium">
                  {t('merchant.commission')}: {formatCommission(item.commissionRule)}
                </span>
              </div>
              <Progress 
                value={(item.moq.committed / item.moq.target) * 100} 
                className="h-2"
              />
            </div>
            
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                ETA {item.lane.medianDays}d
              </Badge>
              <span>{item.lane.onTimePct * 100}% on-time</span>
              <span>{item.lane.code}</span>
            </div>
          </div>

          {/* Trust Strip */}
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 text-sm text-primary font-medium mb-2">
              <Shield className="h-4 w-4" />
              <span>{t('merchant.preorderProtection')}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('merchant.sharedPoolNote')}
            </p>
          </div>

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
              onClick={handleConfirmRepost}
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