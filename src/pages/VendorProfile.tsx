import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Star, TrendingUp, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useI18n } from '@/context/I18nContext';
import { trackEvent } from '@/lib/analytics';
import { AuctionCard } from '@/components/auctions/AuctionCard';
import { ListingCard } from '@/components/home/ListingCard';
import { AUCTION_LISTINGS } from '@/lib/auctionData';
import { DEMO_LISTINGS } from '@/lib/demoMode';
import type { AuctionListing } from '@/types/auctions';
import type { ListingSummary } from '@/types';

// Mock vendor data
const VENDOR_DATA = {
  'usr_imp_1': {
    id: 'usr_imp_1',
    name: 'TechHub Pro Imports',
    verified: true,
    city: 'Douala',
    avatar: null,
    onTimePercent: 93,
    disputePercent: 2,
    categories: ['Electronics', 'Mobile Phones', 'Accessories'],
    joinedAt: '2024-03-15T10:00:00Z'
  },
  'usr_imp_2': {
    id: 'usr_imp_2',
    name: 'Digital Imports CM',
    verified: true,
    city: 'Yaoundé',
    avatar: null,
    onTimePercent: 88,
    disputePercent: 1,
    categories: ['Electronics', 'Computers', 'Audio'],
    joinedAt: '2024-05-20T14:30:00Z'
  },
  'usr_imp_3': {
    id: 'usr_imp_3',
    name: 'AudioMax Traders',
    verified: false,
    city: 'Douala',
    avatar: null,
    onTimePercent: 78,
    disputePercent: 5,
    categories: ['Audio', 'Electronics'],
    joinedAt: '2024-08-10T08:15:00Z'
  }
};

const VendorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  
  const [vendor, setVendor] = useState<any>(null);
  const [recentAuctions, setRecentAuctions] = useState<AuctionListing[]>([]);
  const [recentListings, setRecentListings] = useState<ListingSummary[]>([]);

  useEffect(() => {
    if (!id) {
      navigate('/');
      return;
    }

    const vendorData = VENDOR_DATA[id as keyof typeof VENDOR_DATA];
    if (!vendorData) {
      navigate('/');
      return;
    }

    setVendor(vendorData);
    
    // Get vendor's auctions
    const vendorAuctions = AUCTION_LISTINGS.filter(auction => auction.seller.id === id);
    setRecentAuctions(vendorAuctions);
    
    // Get vendor's regular listings
    const vendorListings = DEMO_LISTINGS.filter(listing => listing.importer.id === id);
    setRecentListings(vendorListings);
    
    trackEvent('vendor_profile_view', { vendorId: id });
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

  const initials = vendor.name
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
          
          <div className="w-10" /> {/* Spacer */}
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
                  {vendor.name}
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