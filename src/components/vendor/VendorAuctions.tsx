import { useState } from 'react';
import { Eye, Share2, Edit, StopCircle, Users } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/analytics';

type VendorAuction = {
  id: string;
  title: string;
  image: string;
  currentBidXAF: number;
  timeLeftSec: number;
  watchers: number;
  status: 'draft' | 'live' | 'ending_soon' | 'ended';
};

// Demo data - in real app would come from API/demo service
const DEMO_AUCTIONS: VendorAuction[] = [
  {
    id: 'vauct_001',
    title: 'Professional DSLR Camera Kit',
    image: '/demo/download-2.jfif',
    currentBidXAF: 450000,
    timeLeftSec: 3600 * 2, // 2 hours
    watchers: 12,
    status: 'live',
  },
  {
    id: 'vauct_002',
    title: 'Gaming Laptop i7 16GB',
    image: '/demo/download-3.jfif',
    currentBidXAF: 890000,
    timeLeftSec: 3600 * 6, // 6 hours
    watchers: 8,
    status: 'live',
  },
  {
    id: 'vauct_003',
    title: 'Vintage Leather Jacket',
    image: '/demo/download-4.jfif',
    currentBidXAF: 120000,
    timeLeftSec: 3600 * 0.5, // 30 minutes
    watchers: 15,
    status: 'ending_soon',
  },
];

export const VendorAuctions = () => {
  const { t } = useI18n();
  const [auctions] = useState<VendorAuction[]>(DEMO_AUCTIONS);

  const formatTimeLeft = (seconds: number): string => {
    if (seconds <= 0) return t('vendor.auctionStatusEnded');
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusBadge = (status: VendorAuction['status']) => {
    const variants = {
      draft: { label: t('vendor.auctionStatusDraft'), variant: 'secondary' as const },
      live: { label: t('vendor.auctionStatusLive'), variant: 'default' as const },
      ending_soon: { label: t('vendor.auctionStatusEndingSoon'), variant: 'destructive' as const },
      ended: { label: t('vendor.auctionStatusEnded'), variant: 'outline' as const },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleAction = (action: string, auctionId: string) => {
    trackEvent(`vendor_auction_${action}` as any, { auctionId });
    // Implementation for each action would go here
  };

  const currencyFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  });

  if (auctions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <Eye className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{t('vendor.emptyAuctionsTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('vendor.emptyAuctionsSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {auctions.map((auction) => (
          <div
            key={auction.id}
            className="group overflow-hidden rounded-2xl border border-border/60 bg-white shadow-soft transition-all hover:shadow-card"
          >
            <div className="aspect-[4/3] overflow-hidden bg-muted">
              <img
                src={auction.image}
                alt={auction.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
            
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 font-medium text-foreground">{auction.title}</h3>
                {getStatusBadge(auction.status)}
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('vendor.currentBid')}</span>
                  <span className="font-semibold text-foreground">
                    {currencyFormatter.format(auction.currentBidXAF)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{t('vendor.timeLeft')}</span>
                  <span className="text-sm font-medium text-foreground">
                    {formatTimeLeft(auction.timeLeftSec)}
                  </span>
                </div>
                
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="h-3 w-3" />
                  {t('vendor.watchers', { count: auction.watchers })}
                </div>
              </div>
              
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('share', auction.id)}
                  className="flex-1"
                >
                  <Share2 className="mr-1 h-3 w-3" />
                  {t('vendor.actionShare')}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('edit', auction.id)}
                  className="flex-1"
                >
                  <Edit className="mr-1 h-3 w-3" />
                  {t('vendor.actionEdit')}
                </Button>
                {auction.status === 'live' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('end', auction.id)}
                  >
                    <StopCircle className="h-3 w-3" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Demo data indicator */}
      <div className="flex justify-center pt-4">
        <Badge variant="outline" className="text-xs text-muted-foreground">
          {t('vendor.demoDataChip')}
        </Badge>
      </div>
    </div>
  );
};