import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Copy, Download, FileText, Filter } from 'lucide-react';

import { useSession } from '@/context/SessionContext';
import { BuyersWorkspaceHeader } from '@/components/buyers/BuyersWorkspaceHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import InvoiceDocument from '@/invoices/InvoiceDocument';
import { DEMO_INVOICE, listStoredInvoices, INVOICE_UPDATED_EVENT } from '@/invoices/demoInvoice';
import { DEMO_PREORDER_ORDER, applyPreorderToInvoice } from '@/invoices/preorderApply';
import { buildPickupQrPayload } from '@/lib/invoice';
import { useDealsStore } from '@/lib/dealsStore';
import { buildDealInvoiceDocument } from '@/lib/dealsDocument';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(value);

const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

type InvoiceSource = 'auctions' | 'preorder' | 'deals';

type InvoiceSummary = {
  id: string;
  source: InvoiceSource;
  title: string;
  subtitle: string;
  invoiceNo: string;
  totalXAF: number;
  createdAt: number;
  status: 'PAID' | 'PENDING';
  payload: any;
};

const SOURCE_LABEL: Record<InvoiceSource, string> = {
  auctions: 'Auctions',
  preorder: 'Preorder',
  deals: 'Deals',
};

const SOURCE_BADGE: Record<InvoiceSource, string> = {
  auctions: 'bg-sky-500/10 text-sky-700',
  preorder: 'bg-amber-500/10 text-amber-700',
  deals: 'bg-teal-500/10 text-teal-700',
};

const statusBadge = (status: 'PAID' | 'PENDING') =>
  status === 'PAID' ? 'bg-emerald-500/10 text-emerald-700' : 'bg-orange-500/10 text-orange-700';

const cloneInvoice = (invoice: any) => JSON.parse(JSON.stringify(invoice));

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

const buildAuctionInvoices = (version: number): InvoiceSummary[] => {
  const stored = listStoredInvoices();
  const base = [DEMO_INVOICE, ...stored];
  return base.map((invoice, index) => {
    const payload = cloneInvoice(invoice);
    const createdAt = new Date(payload.createdAt ?? Date.now()).getTime();
    return {
      id: `auction-${payload.invoiceNo ?? index}-${version}`,
      source: 'auctions' as const,
      title: payload.item?.title ?? 'Auction purchase',
      subtitle: payload.seller?.storeName ?? 'Auction seller',
      invoiceNo: payload.invoiceNo ?? `INV-AUC-${index}`,
      totalXAF: payload.pricing?.totalXAF ?? 0,
      createdAt,
      status: payload.paymentStatus === 'PENDING' ? 'PENDING' : 'PAID',
      payload,
    } satisfies InvoiceSummary;
  });
};

const buildPreorderInvoice = (): InvoiceSummary => {
  const base = applyPreorderToInvoice(DEMO_PREORDER_ORDER, cloneInvoice(DEMO_INVOICE));
  base.invoiceNo = base.invoiceNo?.startsWith('INV-') ? base.invoiceNo.replace('INV-', 'INV-PRE-') : base.invoiceNo ?? 'INV-PRE-001';
  const createdAt = new Date(base.createdAt ?? Date.now()).getTime();
  return {
    id: `preorder-${base.invoiceNo}`,
    source: 'preorder',
    title: base.item?.title ?? 'Preorder invoice',
    subtitle: base.seller?.storeName ?? 'Importer',
    invoiceNo: base.invoiceNo,
    totalXAF: base.pricing?.totalXAF ?? 0,
    createdAt,
    status: base.paymentStatus === 'PENDING' ? 'PENDING' : 'PAID',
    payload: base,
  } satisfies InvoiceSummary;
};

const BuyerInvoices = () => {
  const headerRef = useRef<HTMLElement | null>(null);
  const height = useHeaderHeight(headerRef);
  const { session } = useSession();
  const { toast } = useToast();
  const { deals, invoices: dealInvoices } = useDealsStore();
  const [invoiceVersion, setInvoiceVersion] = useState(0);
  const [filter, setFilter] = useState<'all' | InvoiceSource>('all');
  const [search, setSearch] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerInvoice, setViewerInvoice] = useState<InvoiceSummary | null>(null);

  useEffect(() => {
    const handle = () => setInvoiceVersion(prev => prev + 1);
    window.addEventListener(INVOICE_UPDATED_EVENT, handle);
    window.addEventListener('storage', handle);
    return () => {
      window.removeEventListener(INVOICE_UPDATED_EVENT, handle);
      window.removeEventListener('storage', handle);
    };
  }, []);

  useEffect(() => {
    if (viewerOpen) {
      const previous = document.title;
      const prefix = viewerInvoice?.source === 'deals' ? 'Deals' : viewerInvoice?.source === 'preorder' ? 'Preorder' : 'Auctions';
      document.title = `ProList | ${prefix} — Invoice`;
      return () => {
        document.title = previous;
      };
    }
  }, [viewerOpen, viewerInvoice]);

  const auctionInvoices = useMemo(() => buildAuctionInvoices(invoiceVersion), [invoiceVersion]);
  const preorderInvoice = useMemo(() => buildPreorderInvoice(), []);
  const dealsSummaries = useMemo<InvoiceSummary[]>(() => {
    return dealInvoices
      .map(record => {
        const deal = deals.find(item => item.id === record.dealId);
        if (!deal) return null;
        return {
          id: `deal-${record.invoiceNo}`,
          source: 'deals' as const,
          title: deal.title,
          subtitle: deal.buyerName,
          invoiceNo: record.invoiceNo,
          totalXAF: record.totalXAF,
          createdAt: record.createdAt,
          status: record.status === 'ESCROW_HELD' || record.status === 'RELEASED' ? 'PAID' : 'PENDING',
          payload: buildDealInvoiceDocument(deal),
        } satisfies InvoiceSummary;
      })
      .filter((item): item is typeof item & InvoiceSummary => Boolean(item));
  }, [dealInvoices, deals]);

  const allInvoices = useMemo<InvoiceSummary[]>(() => {
    return [preorderInvoice, ...auctionInvoices, ...dealsSummaries].sort((a, b) => b.createdAt - a.createdAt);
  }, [auctionInvoices, dealsSummaries, preorderInvoice]);

  const filtered = useMemo(() => {
    return allInvoices.filter(item => {
      if (filter !== 'all' && item.source !== filter) return false;
      if (!search) return true;
      const target = `${item.title} ${item.invoiceNo} ${item.subtitle}`.toLowerCase();
      return target.includes(search.toLowerCase());
    });
  }, [allInvoices, filter, search]);

  if (!session) return null;

  return (
    <div className="relative min-h-dvh overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />
      <div className="relative z-10 flex min-h-dvh flex-col">
        <BuyersWorkspaceHeader ref={headerRef} session={session} showSearch={false} />
        <div aria-hidden className="shrink-0" style={{ height }} />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-20">
          <Tabs defaultValue="invoices" className="mb-6">
            <TabsList className="h-12 w-full justify-start rounded-full bg-muted/40 p-1">
              <TabsTrigger value="orders" className="flex-1 rounded-full" asChild>
                <Link to="/buyers/profile/orders">Orders</Link>
              </TabsTrigger>
              <TabsTrigger value="invoices" className="flex-1 rounded-full" asChild>
                <Link to="/buyers/profile/invoices">Invoices</Link>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="invoices" className="mt-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant={filter === 'all' ? 'default' : 'outline'} className="rounded-full" onClick={() => setFilter('all')}>
                    All
                  </Button>
                  <Button size="sm" variant={filter === 'deals' ? 'default' : 'outline'} className="rounded-full" onClick={() => setFilter('deals')}>
                    Deals
                  </Button>
                  <Button size="sm" variant={filter === 'auctions' ? 'default' : 'outline'} className="rounded-full" onClick={() => setFilter('auctions')}>
                    Auctions
                  </Button>
                  <Button size="sm" variant={filter === 'preorder' ? 'default' : 'outline'} className="rounded-full" onClick={() => setFilter('preorder')}>
                    Preorder
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={event => setSearch(event.target.value)}
                    placeholder="Search invoice or seller"
                    className="w-full rounded-full sm:w-64"
                  />
                </div>
              </div>

              <div className="mt-4 space-y-3">
                {filtered.map(item => (
                  <Card key={item.id}>
                    <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-base font-semibold text-foreground">{item.title}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">{item.subtitle}</CardDescription>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span>Invoice {item.invoiceNo}</span>
                          <span>•</span>
                          <span>{formatDateTime(item.createdAt)}</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-start gap-2 sm:items-end">
                        <div className="flex items-center gap-2">
                          <Badge className={`rounded-full text-xs ${SOURCE_BADGE[item.source]}`}>{SOURCE_LABEL[item.source]}</Badge>
                          <Badge className={`rounded-full text-xs ${statusBadge(item.status)}`}>{item.status}</Badge>
                        </div>
                        <p className="text-lg font-semibold text-foreground">{formatCurrency(item.totalXAF)}</p>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          setViewerInvoice(item);
                          setViewerOpen(true);
                        }}
                      >
                        <FileText className="mr-2 h-4 w-4" /> View
                      </Button>
                      <Button
                        variant="outline"
                        className="rounded-full"
                        onClick={() => {
                          toast({ description: 'Download started (demo)' });
                        }}
                      >
                        <Download className="mr-2 h-4 w-4" /> Download
                      </Button>
                      <Button
                        className="rounded-full"
                        onClick={() => {
                          navigator.clipboard?.writeText(`${window.location.origin}/invoice/${item.invoiceNo}`);
                          toast({ description: 'Invoice link copied' });
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy Link
                      </Button>
                    </CardContent>
                  </Card>
                ))}
                {filtered.length === 0 && (
                  <Card>
                    <CardContent className="py-12 text-center text-sm text-muted-foreground">No invoices match the current filters.</CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={viewerOpen && Boolean(viewerInvoice)} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-3xl rounded-[28px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Invoice {viewerInvoice?.invoiceNo}</DialogTitle>
          </DialogHeader>
          {viewerInvoice && (
            <div className="max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
              <InvoiceDocument
                invoice={viewerInvoice.payload}
                formatCurrency={formatCurrency}
                formatDateTime={value => formatDateTime(new Date(value).getTime())}
                pickupPayload={(() => {
                  const payload = viewerInvoice.payload?.qrCodePayload;
                  if (payload?.orderId && payload?.invoiceNo && payload?.pickupCode && payload?.hubId) {
                    return buildPickupQrPayload(payload);
                  }
                  if (viewerInvoice.source === 'deals') {
                    const dealPayload = viewerInvoice.payload;
                    return buildPickupQrPayload({
                      orderId: dealPayload.orderId,
                      invoiceNo: dealPayload.invoiceNo,
                      pickupCode: dealPayload.pickup?.pickupCode,
                      hubId: dealPayload.pickup?.hubId,
                    });
                  }
                  return null;
                })()}
                shareMessage={`Invoice ${viewerInvoice.invoiceNo}`}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BuyerInvoices;

