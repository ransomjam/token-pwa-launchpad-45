import { Gavel, Package } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { trackEvent } from '@/lib/analytics';

type CreateActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateActionSheet = ({ open, onOpenChange }: CreateActionSheetProps) => {
  const { t } = useI18n();

  const handleCreateAuction = () => {
    trackEvent('vendor_auction_create');
    onOpenChange(false);
    // Navigate to auction creation wizard
    console.log('Create auction - wizard would open');
  };

  const handleCreateListing = () => {
    trackEvent('vendor_listing_create');
    onOpenChange(false);
    // Navigate to listing creation wizard
    console.log('Create listing - wizard would open');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-6 pb-8">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-center">{t('vendor.createAction')}</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-4">
          <Button
            onClick={handleCreateAuction}
            className="flex h-16 w-full items-center justify-start gap-4 rounded-2xl bg-white text-left shadow-soft hover:shadow-card"
            variant="outline"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Gavel className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">{t('vendor.createAuction')}</h3>
              <p className="text-sm text-muted-foreground">{t('vendor.createAuctionSubtitle')}</p>
            </div>
          </Button>

          <Button
            onClick={handleCreateListing}
            className="flex h-16 w-full items-center justify-start gap-4 rounded-2xl bg-white text-left shadow-soft hover:shadow-card"
            variant="outline"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-foreground">{t('vendor.createListing')}</h3>
              <p className="text-sm text-muted-foreground">{t('vendor.createListingSubtitle')}</p>
            </div>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
