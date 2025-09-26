import { useMemo, useState } from 'react';
import { Package, Share2, Edit, Pause, Eye } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent, type AppEvent } from '@/lib/analytics';

type VendorListing = {
  id: string;
  title: string;
  image: string;
  priceXAF: number;
  stock: number;
  status: 'draft' | 'live' | 'sold_out' | 'paused';
};

// Demo data - in real app would come from API/demo service
const DEMO_LISTINGS: VendorListing[] = [
  {
    id: 'vlst_001',
    title: 'Wireless Bluetooth Headphones',
    image: '/demo/download-5.jfif',
    priceXAF: 45000,
    stock: 24,
    status: 'live',
  },
  {
    id: 'vlst_002',
    title: 'Smart Fitness Watch',
    image: '/demo/download-6.jfif',
    priceXAF: 85000,
    stock: 0,
    status: 'sold_out',
  },
  {
    id: 'vlst_003',
    title: 'Portable Phone Charger 10000mAh',
    image: '/demo/maono-podcast-mic.jfif',
    priceXAF: 18500,
    stock: 56,
    status: 'live',
  },
  {
    id: 'vlst_004',
    title: 'LED Desk Lamp with USB Port',
    image: '/demo/wireless-lavalier-kit.jfif',
    priceXAF: 32000,
    stock: 12,
    status: 'paused',
  },
];

export const VendorListings = () => {
  const { t, locale } = useI18n();
  const [listings] = useState<VendorListing[]>(DEMO_LISTINGS);

  const localeTag = locale === 'fr' ? 'fr-FR' : 'en-US';

  const getStatusBadge = (status: VendorListing['status']) => {
    const variants = {
      draft: { label: t('vendor.listingStatusDraft'), variant: 'secondary' as const },
      live: { label: t('vendor.listingStatusLive'), variant: 'default' as const },
      sold_out: { label: t('vendor.listingStatusSoldOut'), variant: 'destructive' as const },
      paused: { label: t('vendor.listingStatusPaused'), variant: 'outline' as const },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStockStatus = (stock: number) => {
    if (stock === 0) {
      return { label: t('vendor.outOfStock'), className: 'text-destructive' };
    }
    return { label: t('vendor.inStock'), className: 'text-primary' };
  };

  type ListingAction = 'share' | 'edit' | 'pause' | 'view_orders';
  const actionEvents: Record<ListingAction, AppEvent> = {
    share: 'vendor_listing_share',
    edit: 'vendor_listing_edit',
    pause: 'vendor_listing_pause',
    view_orders: 'vendor_listing_view_orders',
  };

  const handleAction = (action: ListingAction, listingId: string) => {
    trackEvent(actionEvents[action], { listingId });
    // Implementation for each action would go here
  };

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat(localeTag, {
        style: 'currency',
        currency: 'XAF',
        minimumFractionDigits: 0,
      }),
    [localeTag],
  );

  if (listings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <Package className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{t('vendor.emptyListingsTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('vendor.emptyListingsSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        {listings.map(listing => {
          const stockStatus = getStockStatus(listing.stock);

          return (
            <div
              key={listing.id}
              className="group overflow-hidden rounded-2xl border border-border/60 bg-white shadow-soft transition-all hover:shadow-card"
            >
              <div className="aspect-[4/3] overflow-hidden bg-muted">
                <img
                  src={listing.image}
                  alt={listing.title}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              </div>

              <div className="space-y-3 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="line-clamp-2 font-medium text-foreground">{listing.title}</h3>
                  {getStatusBadge(listing.status)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('vendor.priceLabel')}</span>
                    <span className="font-semibold text-foreground">
                      {currencyFormatter.format(listing.priceXAF)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{t('vendor.stock')}</span>
                    <span className={`text-sm font-medium ${stockStatus.className}`}>
                      {listing.stock > 0 ? `${listing.stock} ${stockStatus.label}` : stockStatus.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('share', listing.id)}
                    className="flex-1"
                  >
                    <Share2 className="mr-1 h-3 w-3" />
                    {t('vendor.actionShare')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAction('edit', listing.id)}
                    className="flex-1"
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    {t('vendor.actionEdit')}
                  </Button>
                  {listing.status === 'live' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction('pause', listing.id)}
                    >
                      <Pause className="h-3 w-3" />
                      <span className="sr-only">{t('vendor.actionPause')}</span>
                    </Button>
                  )}
                  {(listing.status === 'live' || listing.status === 'sold_out') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAction('view_orders', listing.id)}
                    >
                      <Eye className="h-3 w-3" />
                      <span className="sr-only">{t('vendor.actionViewOrders')}</span>
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
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
