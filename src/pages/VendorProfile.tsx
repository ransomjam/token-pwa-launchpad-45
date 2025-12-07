import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowLeftRight, MapPin, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import { AuctionCard } from '@/components/auctions/AuctionCard';
import { AUCTION_LISTINGS } from '@/lib/auctionData';
import { DEMO_LISTINGS } from '@/lib/demoMode';
import type { AuctionListing } from '@/types/auctions';
import type { ListingSummary } from '@/types';

type VendorProfileData = {
  id: string;
  storeName: string;
  verified: boolean;
  city: string;
  avatar?: string | null;
  onTimePercent: number;
  disputePercent: number;
  categories: string[];
  joinedAt: string;
};

const VENDOR_DATA: Record<string, VendorProfileData> = {
  'creator-techplus': {
    id: 'creator-techplus',
    storeName: 'TechPlus Import',
    verified: true,
    city: 'Yaoundé',
    avatar: null,
    onTimePercent: 93,
    disputePercent: 2,
    categories: ['Electronics', 'Audio', 'Accessories'],
    joinedAt: '2024-03-15T10:00:00Z',
  },
  'creator-nelly': {
    id: 'creator-nelly',
    storeName: 'Nelly Stores',
    verified: true,
    city: 'Douala',
    avatar: null,
    onTimePercent: 94,
    disputePercent: 1,
    categories: ['Electronics', 'Computers', 'Accessories'],
    joinedAt: '2023-11-02T09:00:00Z',
  },
  'creator-home': {
    id: 'creator-home',
    storeName: 'Home Essentials',
    verified: false,
    city: 'Douala',
    avatar: null,
    onTimePercent: 82,
    disputePercent: 3,
    categories: ['Home & Living', 'Appliances', 'Kitchen'],
    joinedAt: '2024-01-18T15:30:00Z',
  },
  'creator-beauty': {
    id: 'creator-beauty',
    storeName: 'Beauty Hub CM',
    verified: true,
    city: 'Douala',
    avatar: null,
    onTimePercent: 90,
    disputePercent: 2,
    categories: ['Beauty', 'Cosmetics'],
    joinedAt: '2024-02-22T12:15:00Z',
  },
  'creator-fashion': {
    id: 'creator-fashion',
    storeName: 'Fashion Forward',
    verified: true,
    city: 'Yaoundé',
    avatar: null,
    onTimePercent: 89,
    disputePercent: 2,
    categories: ['Fashion', 'Accessories'],
    joinedAt: '2024-04-05T17:45:00Z',
  },
};

const VENDOR_ALIASES: Record<string, string> = {
  'demo-importer': 'creator-nelly',
};

const VendorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();

  const [vendor, setVendor] = useState<VendorProfileData | null>(null);
  const [recentAuctions, setRecentAuctions] = useState<AuctionListing[]>([]);
  const [recentListings, setRecentListings] = useState<ListingSummary[]>([]);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const canonicalId = VENDOR_ALIASES[id] ?? id;
    const vendorData = VENDOR_DATA[canonicalId as keyof typeof VENDOR_DATA];
    if (!vendorData) {
      navigate('/');
      return;
    }

    const relatedIds = new Set<string>([canonicalId, id]);
    Object.entries(VENDOR_ALIASES).forEach(([alias, canonical]) => {
      if (canonical === canonicalId) {
        relatedIds.add(alias);
      }
    });

    setVendor({ ...vendorData, id });

    // Get vendor's auctions
    const vendorAuctions = AUCTION_LISTINGS.filter(auction => relatedIds.has(auction.seller.id));
    setRecentAuctions(vendorAuctions);

    // Get vendor's regular listings
    const vendorListings = DEMO_LISTINGS.filter(listing => relatedIds.has(listing.importer.id));
    setRecentListings(vendorListings);

    trackEvent('vendor_profile_view', { vendorId: canonicalId });
  }, [id, navigate]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleViewAuction = (auction: AuctionListing) => {
    navigate(`/auction/${auction.id}`);
  };

  const handleViewListing = (listing: ListingSummary) => {
    navigate(`/listings/${listing.id}`);
  };

  const handlePlaceBid = (auction: AuctionListing) => {
    // This would open the bid sheet - for now just navigate to auction detail
    navigate(`/auction/${auction.id}`);
  };

  const handleViewSellerForAuction = (sellerId: string) => {
    if (sellerId !== id) {
      navigate(`/seller/${sellerId}`);
    }
  };

  if (!vendor) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="mx-auto max-w-lg">
          <Skeleton className="h-48 w-full" />
          <div className="p-6 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <div className="grid grid-cols-3 gap-4">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const initials = vendor.storeName
    .split(' ')
    .map((part: string) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="sticky top-0 z-20 flex items-center justify-between bg-background/95 backdrop-blur-sm px-6 py-4 border-b border-border/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="h-10 w-10 rounded-full p-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <h1 className="text-lg font-semibold text-foreground">
            {t('vendor.profile')}
          </h1>

          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full border border-border/70 text-muted-foreground transition hover:border-primary/60 hover:text-primary"
            onClick={() => navigate('/account/switch-role')}
          >
            <ArrowLeftRight className="h-5 w-5" />
            <span className="sr-only">{t('roles.switchTitle')}</span>
          </Button>
        </header>

        {/* Vendor Header */}
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
              <span className="text-xl font-bold text-primary">
                {initials}
              </span>
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-foreground">
                  {vendor.storeName}
                </h2>
                {vendor.verified && (
                  <Badge variant="default" className="rounded-full">
                    <span className="text-xs">✓ {t('vendor.verified')}</span>
                  </Badge>
                )}
              </div>
              
              {vendor.city && (
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{vendor.city}</span>
                </div>
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-2xl font-bold text-emerald-600">
                  {vendor.onTimePercent}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('vendor.onTimeDelivery')}
              </p>
            </div>
            
            <div className="rounded-2xl border border-border/70 bg-card p-4 text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-2xl font-bold text-amber-600">
                  {vendor.disputePercent}%
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('vendor.disputeRate')}
              </p>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <p className="text-sm font-semibold text-foreground">
              {t('vendor.categories')}
            </p>
            <div className="flex flex-wrap gap-2">
              {vendor.categories.map((category: string) => (
                <Badge key={category} variant="secondary" className="rounded-full">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-6">
          <Tabs defaultValue="auctions" className="w-full">
            <TabsList className="grid w-full grid-cols-2 rounded-2xl">
              <TabsTrigger value="auctions" className="rounded-xl">
                {t('vendor.recentAuctions')}
              </TabsTrigger>
              <TabsTrigger value="listings" className="rounded-xl">
                {t('vendor.recentListings')}
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="auctions" className="mt-6">
              {recentAuctions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {t('vendor.noAuctions')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('vendor.checkBackLater')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  {recentAuctions.map((auction) => (
                    <AuctionCard
                      key={auction.id}
                      auction={auction}
                      onViewDetails={handleViewAuction}
                      onViewSeller={handleViewSellerForAuction}
                      onPlaceBid={handlePlaceBid}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="listings" className="mt-6">
              {recentListings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                  <p className="text-sm font-semibold text-foreground">
                    {t('vendor.noListings')}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t('vendor.checkBackLater')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentListings.map((listing) => {
                    const formatter = new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
                      style: 'currency',
                      currency: 'XAF',
                      maximumFractionDigits: 0,
                    });
                    return (
                      <div key={listing.id} className="rounded-2xl border border-border/70 bg-card p-4">
                        <h4 className="font-semibold text-foreground">{listing.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatter.format(listing.priceXAF)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <div className="h-20" /> {/* Bottom spacing */}
      </div>
    </div>
  );
};

export default VendorProfile;