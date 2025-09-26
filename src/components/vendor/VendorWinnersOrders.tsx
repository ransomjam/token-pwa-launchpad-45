import { useState } from 'react';
import { Users, MessageCircle, Eye, AlertTriangle } from 'lucide-react';
import { useI18n } from '@/context/I18nContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { trackEvent } from '@/lib/analytics';

type WinnerOrder = {
  id: string;
  type: 'auction_winner' | 'direct_order';
  itemTitle: string;
  buyerName: string;
  finalAmount: number;
  status: 'payment_pending' | 'escrow_held' | 'arrived' | 'collected' | 'refunded';
  pickupHub: string;
  createdAt: string;
};

// Demo data - in real app would come from API/demo service
const DEMO_WINNERS_ORDERS: WinnerOrder[] = [
  {
    id: 'wo_001',
    type: 'auction_winner',
    itemTitle: 'Professional DSLR Camera Kit',
    buyerName: 'Jean-Pierre K.',
    finalAmount: 450000,
    status: 'escrow_held',
    pickupHub: 'Akwa Pickup Hub',
    createdAt: '2024-09-24T14:30:00Z',
  },
  {
    id: 'wo_002',
    type: 'direct_order',
    itemTitle: 'Wireless Bluetooth Headphones',
    buyerName: 'Marie N.',
    finalAmount: 45000,
    status: 'arrived',
    pickupHub: 'Biyem-Assi Point',
    createdAt: '2024-09-23T09:15:00Z',
  },
  {
    id: 'wo_003',
    type: 'auction_winner',
    itemTitle: 'Gaming Laptop i7 16GB',
    buyerName: 'Paul M.',
    finalAmount: 890000,
    status: 'collected',
    pickupHub: 'Akwa Pickup Hub',
    createdAt: '2024-09-22T16:45:00Z',
  },
];

export const VendorWinnersOrders = () => {
  const { t } = useI18n();
  const [orders] = useState<WinnerOrder[]>(DEMO_WINNERS_ORDERS);

  const getStatusBadge = (status: WinnerOrder['status']) => {
    const variants = {
      payment_pending: { label: 'Payment pending', variant: 'outline' as const },
      escrow_held: { label: 'Escrow held', variant: 'secondary' as const },
      arrived: { label: 'Arrived', variant: 'default' as const },
      collected: { label: 'Collected', variant: 'default' as const },
      refunded: { label: 'Refunded', variant: 'destructive' as const },
    };
    
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getTypeLabel = (type: WinnerOrder['type']) => {
    return type === 'auction_winner' ? 'Auction Win' : 'Direct Order';
  };

  const handleAction = (action: string, orderId: string) => {
    trackEvent(`vendor_${action}` as any, { orderId });
    // Implementation for each action would go here
  };

  const currencyFormatter = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted/50">
          <Users className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">{t('vendor.emptyWinnersTitle')}</h3>
        <p className="text-sm text-muted-foreground">{t('vendor.emptyWinnersSubtitle')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-2xl border border-border/60 bg-white p-4 shadow-soft transition-all hover:shadow-card"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {getTypeLabel(order.type)}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(order.createdAt)}
                  </span>
                  {getStatusBadge(order.status)}
                </div>
                
                <h3 className="font-medium text-foreground line-clamp-1">
                  {order.itemTitle}
                </h3>
                
                <div className="flex items-center justify-between text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">
                      Buyer: <span className="font-medium">{order.buyerName}</span>
                    </p>
                    <p className="text-muted-foreground">
                      Pickup: <span className="font-medium">{order.pickupHub}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">
                      {currencyFormatter.format(order.finalAmount)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('remind', order.id)}
                className="flex-1"
              >
                <MessageCircle className="mr-1 h-3 w-3" />
                Remind
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAction('view_order', order.id)}
                className="flex-1"
              >
                <Eye className="mr-1 h-3 w-3" />
                View order
              </Button>
              {(order.status === 'payment_pending' || order.status === 'escrow_held') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAction('dispute', order.id)}
                >
                  <AlertTriangle className="h-3 w-3" />
                </Button>
              )}
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