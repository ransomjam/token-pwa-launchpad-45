import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Package, ArrowRight } from 'lucide-react';

import { useSession } from '@/context/SessionContext';
import { BuyersWorkspaceHeader } from '@/components/buyers/BuyersWorkspaceHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { listDemoOrders, type DemoOrderRecord } from '@/lib/demoOrderStorage';
import type { OrderStatus } from '@/types';

const useHeaderHeight = (ref: React.RefObject<HTMLElement>) => {
  const [height, setHeight] = useState(0);
  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const update = () => setHeight(node.getBoundingClientRect().height);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [ref]);
  return height;
};

const fallbackOrders: Array<Pick<DemoOrderRecord, 'id' | 'createdAt' | 'status' | 'invoiceNo'> & { title: string }> = [
  {
    id: 'demo-order-1',
    title: 'Mi Band 8 (Global)',
    createdAt: new Date('2025-07-12T10:00:00Z').toISOString(),
    status: 'FULFILLING',
    invoiceNo: 'INV-PRE-001',
  },
  {
    id: 'demo-order-2',
    title: 'Wireless Gaming Mouse Bundle',
    createdAt: new Date('2025-07-15T08:30:00Z').toISOString(),
    status: 'ESCROW_HELD',
    invoiceNo: 'INV-DEAL-002',
  },
];

const statusLabel: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  PENDING_PAYMENT: 'Pending payment',
  ESCROW_HELD: 'Escrow held',
  POOL_LOCKED: 'Pool locked',
  FULFILLING: 'In transit',
  ARRIVED: 'Arrived',
  COLLECTED: 'Collected',
  ESCROW_RELEASED: 'Escrow released',
  CLOSED: 'Closed',
  REFUNDED: 'Refunded',
  LATE: 'Late',
};

const BuyerOrders = () => {
  const headerRef = useRef<HTMLElement | null>(null);
  const height = useHeaderHeight(headerRef);
  const { session } = useSession();
  const storedOrders = useMemo(() => listDemoOrders(), []);
  const orders = storedOrders.length ? storedOrders : fallbackOrders;

  if (!session) return null;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <BuyersWorkspaceHeader ref={headerRef} session={session} showSearch={false} />
        <div aria-hidden className="shrink-0" style={{ height }} />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20">
          <Tabs defaultValue="orders" className="mb-6">
            <TabsList className="h-12 w-full justify-start rounded-full bg-muted/40 p-1">
              <TabsTrigger value="orders" className="flex-1 rounded-full" asChild>
                <Link to="/buyers/profile/orders">Orders</Link>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex-1 rounded-full" asChild>
                <Link to="/buyers/profile/invoices">Invoices</Link>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="orders" className="mt-4 space-y-3">
              {orders.map(order => (
                <Card key={order.id}>
                  <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <CardTitle className="text-base font-semibold text-foreground">{order.title}</CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">Order {order.id}</CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="rounded-full bg-primary/10 text-primary">
                        <Package className="mr-1 h-4 w-4" />
                        {statusLabel[order.status as OrderStatus] ?? 'Processing'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-muted-foreground">
                      <p>Placed {new Date(order.createdAt ?? Date.now()).toLocaleString()}</p>
                      <p>Invoice {order.invoiceNo ?? '—'}</p>
                    </div>
                    <Button asChild variant="outline" className="rounded-full">
                      <Link to={`/invoice/${order.invoiceNo ?? 'INV-DEMO'}`}>
                        View invoice
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
              {orders.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-sm text-muted-foreground">No demo orders yet.</CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default BuyerOrders;

