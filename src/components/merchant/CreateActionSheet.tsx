import { useCallback } from 'react';
import { Package, ShoppingBag, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

export type CreateActionSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export const CreateActionSheet = ({ open, onOpenChange }: CreateActionSheetProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();

  const handleNavigate = useCallback(
    (path: string) => {
      onOpenChange(false);
      navigate(path);
    },
    [navigate, onOpenChange],
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="px-6 pb-8">
        <SheetHeader className="pb-6">
          <SheetTitle className="text-center">{t('merchant.createAction')}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleNavigate('/merchant/listings')}
            className="flex h-16 w-full items-center justify-start gap-4 rounded-2xl bg-white text-left shadow-soft hover:shadow-card"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <ShoppingBag className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">
                {t('merchant.createFromListings')}
              </span>
              <span className="block text-sm text-muted-foreground">
                {t('merchant.createFromListingsSubtitle')}
              </span>
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleNavigate('/merchant/preorder')}
            className="flex h-16 w-full items-center justify-start gap-4 rounded-2xl bg-white text-left shadow-soft hover:shadow-card"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">
                {t('merchant.createFromPreorders')}
              </span>
              <span className="block text-sm text-muted-foreground">
                {t('merchant.createFromPreordersSubtitle')}
              </span>
            </span>
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={() => handleNavigate('/merchant/listings/mine')}
            className="flex h-16 w-full items-center justify-start gap-4 rounded-2xl bg-white text-left shadow-soft hover:shadow-card"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles className="h-6 w-6" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-semibold text-foreground">
                {t('merchant.manageReposts')}
              </span>
              <span className="block text-sm text-muted-foreground">
                {t('merchant.manageRepostsSubtitle')}
              </span>
            </span>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
