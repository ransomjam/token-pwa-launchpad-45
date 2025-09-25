import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useI18n } from '@/context/I18nContext';
import { useToast } from '@/components/ui/use-toast';
import { trackEvent } from '@/lib/analytics';
import { addBid } from '@/lib/auctionData';
import type { AuctionListing } from '@/types/auctions';
import { ShieldCheck } from 'lucide-react';

type PlaceBidSheetProps = {
  auction: AuctionListing;
  open: boolean;
  onClose: () => void;
};

export const PlaceBidSheet = ({ auction, open, onClose }: PlaceBidSheetProps) => {
  const { t, locale } = useI18n();
  const { toast } = useToast();
  const [bidAmount, setBidAmount] = useState(auction.currentBidXAF + auction.minIncrementXAF);

  const currencyFormatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: 'XAF',
    maximumFractionDigits: 0,
  });

  const handleBidSubmit = () => {
    if (bidAmount <= auction.currentBidXAF) {
      toast({
        variant: "destructive",
        title: t('auctions.bidTooLow'),
        description: t('auctions.bidMustExceed', { 
          amount: currencyFormatter.format(auction.currentBidXAF) 
        }),
      });
      return;
    }

    if (bidAmount < auction.currentBidXAF + auction.minIncrementXAF) {
      toast({
        variant: "destructive", 
        title: t('auctions.bidTooLow'),
        description: t('auctions.minimumIncrement', { 
          amount: currencyFormatter.format(auction.minIncrementXAF) 
        }),
      });
      return;
    }

    // Add bid to demo data
    addBid(auction.id, bidAmount);
    
    trackEvent('auction_bid_place', { 
      auctionId: auction.id, 
      bidAmount,
      previousBid: auction.currentBidXAF 
    });

    toast({
      title: t('auctions.bidPlaced'),
      description: t('auctions.bidPlacedDescription', { 
        amount: currencyFormatter.format(bidAmount),
        title: auction.title 
      }),
    });

    onClose();
  };

  const minBid = auction.currentBidXAF + auction.minIncrementXAF;

  return (
    <Drawer open={open} onOpenChange={onClose}>
      <DrawerContent className="px-6 pb-6">
        <DrawerHeader className="text-left px-0">
          <DrawerTitle className="text-lg font-semibold">
            {t('auctions.placeBid')}
          </DrawerTitle>
          <DrawerDescription className="text-sm text-muted-foreground">
            {auction.title}
          </DrawerDescription>
        </DrawerHeader>

        <div className="space-y-6">
          {/* Current bid info */}
          <div className="rounded-2xl border border-border/70 bg-card/50 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                {t('auctions.currentBid')}
              </span>
              <span className="text-lg font-bold text-foreground">
                {currencyFormatter.format(auction.currentBidXAF)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                {t('auctions.minimumBid')}
              </span>
              <span className="text-sm font-semibold text-primary">
                {currencyFormatter.format(minBid)}
              </span>
            </div>
          </div>

          {/* Bid input */}
          <div className="space-y-2">
            <Label htmlFor="bid-amount" className="text-sm font-semibold">
              {t('auctions.yourBid')}
            </Label>
            <Input
              id="bid-amount"
              type="number"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              min={minBid}
              step={auction.minIncrementXAF}
              className="text-lg font-semibold"
              placeholder={currencyFormatter.format(minBid)}
            />
            <p className="text-xs text-muted-foreground">
              {t('auctions.minimumIncrement')}: {currencyFormatter.format(auction.minIncrementXAF)}
            </p>
          </div>

          {/* Trust line */}
          <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium text-primary">
              {t('auctions.escrowProtection')}
            </span>
          </div>
        </div>

        <DrawerFooter className="flex-row gap-3 px-0 pt-6">
          <DrawerClose asChild>
            <Button variant="outline" className="flex-1">
              {t('common.cancel')}
            </Button>
          </DrawerClose>
          <Button 
            onClick={handleBidSubmit} 
            className="flex-1"
            disabled={bidAmount < minBid}
          >
            {t('auctions.confirmBid')} {currencyFormatter.format(bidAmount)}
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};