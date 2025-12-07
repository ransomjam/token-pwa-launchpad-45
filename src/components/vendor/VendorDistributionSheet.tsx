import { useEffect, useMemo, useState } from 'react';
import { Loader2 } from 'lucide-react';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/context/I18nContext';
import { DistributionCard, type DistributionOptionValue } from '@/components/distribution/DistributionCard';
import { toast } from '@/components/ui/sonner';

type VendorDistributionSheetProps = {
  open: boolean;
  type: 'auction' | 'listing' | null;
  onOpenChange: (open: boolean) => void;
};

export const VendorDistributionSheet = ({ open, type, onOpenChange }: VendorDistributionSheetProps) => {
  const { t } = useI18n();
  const [choice, setChoice] = useState<DistributionOptionValue>('publish');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!open) {
      setChoice('publish');
      setSuccess(false);
      setSaving(false);
    }
  }, [open]);

  const options = useMemo(() => {
    if (!type) return [];

    const base = [
      {
        value: 'publish' as DistributionOptionValue,
        label: t('distribution.publishOnly'),
        description: t('distribution.publishOnlyDesc'),
      },
      type === 'auction'
        ? {
            value: 'offer' as DistributionOptionValue,
            label: t('distribution.offerMerchant'),
            description: t('distribution.offerMerchantDesc'),
          }
        : {
            value: 'offer' as DistributionOptionValue,
            label: t('distribution.offerMerchant'),
            description: t('distribution.offerAuctionsOnly'),
            disabled: true,
            badge: t('distribution.auctionsOnlyBadge'),
          },
      {
        value: 'publish_offer' as DistributionOptionValue,
        label: t('distribution.publishOffer'),
        description: t('distribution.publishOfferDesc'),
      },
    ];

    return base;
  }, [t, type]);

  if (!type) {
    return null;
  }

  const commissionSummary =
    type === 'auction'
      ? t('distribution.vendorCommissionAuction', { percent: 15 })
      : t('distribution.vendorCommissionListing', { amount: '₣3,000' });

  const handlePublish = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 600));
    setSaving(false);
    setSuccess(choice !== 'publish');
    if (choice !== 'publish') {
      toast.success(t('distribution.successAdded'));
    } else {
      toast.success(t('distribution.publishConfirmed'));
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-6 pb-8">
        <SheetHeader className="pb-6 text-left">
          <SheetTitle>
            {type === 'auction'
              ? t('vendor.createAuction')
              : t('vendor.createListing')}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6">
          <DistributionCard
            title={t('distribution.title')}
            subtitle={t('distribution.vendorSubtitle')}
            options={options}
            value={choice}
            onChange={value => {
              setChoice(value);
              setSuccess(false);
            }}
            commissionLabel={t('distribution.vendorCommissionLabel')}
            commissionValue={commissionSummary}
            successMessage={t('distribution.successAdded')}
            showSuccess={success}
          />

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="flex-1 rounded-full"
              onClick={() => onOpenChange(false)}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="flex-1 rounded-full"
              onClick={handlePublish}
              disabled={saving}
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('merchant.confirmPublish')}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default VendorDistributionSheet;
