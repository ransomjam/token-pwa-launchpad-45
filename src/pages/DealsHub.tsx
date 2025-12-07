import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Mail,
  MoreHorizontal,
  Phone,
  PlusCircle,
  X as XIcon,
  RotateCcw,
  Send,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { BuyersWorkspaceHeader } from '@/components/buyers/BuyersWorkspaceHeader';
import { useDealsStore, type Deal, type DealStatus } from '@/lib/dealsStore';
import { buildDealInvoiceDocument } from '@/lib/dealsDocument';
import { cn } from '@/lib/utils';
import InvoiceDocument from '@/invoices/InvoiceDocument';
import { buildPickupQrPayload } from '@/lib/invoice';
import type { Session } from '@/types';
import { useSession } from '@/context/SessionContext';
import { VerificationDialog, type VerificationPayload } from '@/components/verification/VerificationDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const PICKUP_CENTRES = [
  { id: 'hub-akwa', name: 'Akwa Pickup Hub', address: 'Commercial Avenue, Douala', hours: 'Mon–Sat 9:00–18:00' },
  { id: 'hub-biyem', name: 'Biyem-Assi Hub', address: 'Rue des Palmiers, Yaoundé', hours: 'Mon–Sat 8:30–17:30' },
  { id: 'hub-bamenda', name: 'Bamenda Centre', address: 'Commercial Avenue, Bamenda', hours: 'Mon–Fri 9:00–17:00' },
];

const STATUS_COLORS: Record<DealStatus, string> = {
  DRAFT: 'bg-slate-500/10 text-slate-700',
  SENT: 'bg-blue-500/10 text-blue-700',
  PAID: 'bg-emerald-500/10 text-emerald-700',
  ESCROW_HELD: 'bg-teal-500/10 text-teal-700',
  READY: 'bg-primary/10 text-primary',
  RELEASED: 'bg-green-600/10 text-green-700',
  REFUNDED: 'bg-orange-500/10 text-orange-700',
  CANCELLED: 'bg-red-500/10 text-red-700',
  EXPIRED: 'bg-gray-500/10 text-gray-700',
};

type DealsHubProps = {
  session: Session;
};

type DealsTab = 'dealer' | 'overview' | 'past' | 'buyer' | 'agent' | 'users';

type DealsLocationState = {
  newDealBuyer?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
};

type DraftFormState = {
  title: string;
  priceXAF: string;
  qty: string;
  buyerId: string;
  buyerName: string;
  buyerPhone: string;
  buyerEmail: string;
  handover: 'CENTRE' | 'DELIVERY';
  pickupCenterId?: string;
  notes?: string;
  imageUrls: string[];
};

const DEFAULT_FORM: DraftFormState = {
  title: '',
  priceXAF: '',
  qty: '1',
  buyerId: '',
  buyerName: '',
  buyerPhone: '',
  buyerEmail: '',
  handover: 'CENTRE',
  pickupCenterId: undefined,
  notes: '',
  imageUrls: [''],
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(value);

const formatDateTime = (value: number) =>
  new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const formatStatusLabel = (status: DealStatus) =>
  status
    .toLowerCase()
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

const statusOrder: DealStatus[] = ['DRAFT', 'SENT', 'PAID', 'ESCROW_HELD', 'READY', 'RELEASED'];

export const DealsHub = ({ session }: DealsHubProps) => {
  const headerRef = useRef<HTMLElement | null>(null);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [activeTab, setActiveTab] = useState<DealsTab>('dealer');
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<DraftFormState>(DEFAULT_FORM);
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [quotationOpen, setQuotationOpen] = useState(false);
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [invoiceDealId, setInvoiceDealId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [otp, setOtp] = useState('');
  const [verificationOpen, setVerificationOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'new-deal' | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { updateSession } = useSession();

  const {
    deals,
    demoUsers,
    createDraft,
    generateQuotation,
    sendToDemoBuyer,
    confirmByBuyer,
    payDemoFail,
    payDemoSuccess,
    confirmHandover,
    markReleased,
    resetDemo,
  } = useDealsStore();
  const { toast } = useToast();

  const handleVerificationComplete = (payload: VerificationPayload) => {
    updateSession(current => ({
      ...current,
      businessName: payload.businessName,
      isVerified: true,
      verification: {
        status: 'verified',
        ...payload,
      },
    }));
    const action = pendingAction;
    setPendingAction(null);
    if (action === 'new-deal') {
      setFormOpen(true);
    }
  };

  const handleStartNewDeal = () => {
    if (!session.isVerified) {
      setPendingAction('new-deal');
      setVerificationOpen(true);
      return;
    }
    setFormOpen(true);
  };

  useEffect(() => {
    const state = (location.state ?? null) as DealsLocationState | null;
    const newDealBuyer = state?.newDealBuyer;
    if (!newDealBuyer) return;

    setActiveTab('dealer');
    setForm({
      ...DEFAULT_FORM,
      imageUrls: [''],
      buyerId: newDealBuyer.id ?? '',
      buyerName: newDealBuyer.name ?? '',
      buyerEmail: newDealBuyer.email ?? '',
      buyerPhone: newDealBuyer.phone ?? '',
    });
    if (session.isVerified) {
      setFormOpen(true);
    } else {
      setPendingAction('new-deal');
      setVerificationOpen(true);
    }
    navigate(`${location.pathname}${location.search}`, { replace: true, state: null });
  }, [location.pathname, location.search, location.state, navigate, session.isVerified, setActiveTab, setForm]);

  useEffect(() => {
    const node = headerRef.current;
    if (!node) return;
    const update = () => {
      setHeaderHeight(node.getBoundingClientRect().height);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const selectedDeal = useMemo(() => deals.find(deal => deal.id === selectedDealId) ?? deals[0] ?? null, [deals, selectedDealId]);
  const selectedBuyer = useMemo(
    () => demoUsers.buyersList.find(buyer => buyer.id === form.buyerId) ?? null,
    [demoUsers.buyersList, form.buyerId],
  );
  const previewImages = useMemo(() => form.imageUrls.map(url => url.trim()).filter(Boolean), [form.imageUrls]);

  useEffect(() => {
    if (!selectedDealId && deals.length > 0) {
      setSelectedDealId(deals[0].id);
    }
  }, [deals, selectedDealId]);

  useEffect(() => {
    if (quotationOpen) {
      const previous = document.title;
      document.title = 'ProList | Deals — Quotation';
      return () => {
        document.title = previous;
      };
    }
  }, [quotationOpen]);

  useEffect(() => {
    if (invoiceOpen) {
      const previous = document.title;
      document.title = 'ProList | Deals — Invoice';
      return () => {
        document.title = previous;
      };
    }
  }, [invoiceOpen]);

  const handleFormChange = (key: keyof DraftFormState, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setForm(DEFAULT_FORM);

  const validateForm = () => {
    const imageUrls = form.imageUrls.map(url => url.trim()).filter(Boolean);
    if (!form.title || !form.priceXAF || !form.qty || !form.buyerId || !form.buyerName || !form.buyerPhone || !form.buyerEmail) {
      toast({ description: 'Please fill all required fields', variant: 'destructive' });
      return false;
    }
    if (imageUrls.length === 0) {
      toast({ description: 'Add at least one product image', variant: 'destructive' });
      return false;
    }
    if (form.handover === 'CENTRE' && !form.pickupCenterId) {
      toast({ description: 'Select a pickup centre for centre handover', variant: 'destructive' });
      return false;
    }
    return true;
  };

  const handleBuyerSelect = (buyerId: string) => {
    const buyer = demoUsers.buyersList.find(item => item.id === buyerId);
    setForm(prev => ({
      ...prev,
      buyerId,
      buyerName: buyer?.name ?? '',
      buyerPhone: buyer?.phone ?? '',
      buyerEmail: buyer?.email ?? '',
    }));
  };

  const handleImageChange = (index: number, value: string) => {
    setForm(prev => {
      const imageUrls = [...prev.imageUrls];
      imageUrls[index] = value;
      return { ...prev, imageUrls };
    });
  };

  const addImageField = () => {
    setForm(prev => ({ ...prev, imageUrls: [...prev.imageUrls, ''] }));
  };

  const removeImageField = (index: number) => {
    setForm(prev => {
      const imageUrls = prev.imageUrls.filter((_, idx) => idx !== index);
      return { ...prev, imageUrls: imageUrls.length > 0 ? imageUrls : [''] };
    });
  };

  const upsertDeal = (action: (dealId: string) => Deal | null, successMessage: string) => {
    if (!selectedDeal) return;
    const updated = action(selectedDeal.id);
    if (updated) {
      setSelectedDealId(updated.id);
      toast({ description: successMessage });
    }
  };

  const handleSaveDraft = () => {
    if (!validateForm()) return;
    const centre = PICKUP_CENTRES.find(item => item.id === form.pickupCenterId);
    const imageUrls = form.imageUrls.map(url => url.trim()).filter(Boolean);
    const deal = createDraft({
      title: form.title,
      priceXAF: Number(form.priceXAF),
      qty: Number(form.qty),
      buyerName: form.buyerName,
      buyerPhone: form.buyerPhone,
      buyerEmail: form.buyerEmail,
      handover: form.handover,
      pickupCenterId: centre?.id,
      pickupCenterName: centre?.name,
      pickupCenterAddress: centre?.address,
      notes: form.notes,
      imageUrls,
    });
    setSelectedDealId(deal.id);
    resetForm();
    setFormOpen(false);
    toast({ description: 'Draft saved' });
  };

  const handleGenerateQuotation = () => {
    if (!validateForm()) return;
    const centre = PICKUP_CENTRES.find(item => item.id === form.pickupCenterId);
    const imageUrls = form.imageUrls.map(url => url.trim()).filter(Boolean);
    const deal = createDraft({
      title: form.title,
      priceXAF: Number(form.priceXAF),
      qty: Number(form.qty),
      buyerName: form.buyerName,
      buyerPhone: form.buyerPhone,
      buyerEmail: form.buyerEmail,
      handover: form.handover,
      pickupCenterId: centre?.id,
      pickupCenterName: centre?.name,
      pickupCenterAddress: centre?.address,
      notes: form.notes,
      imageUrls,
    });
    generateQuotation(deal.id);
    setSelectedDealId(deal.id);
    resetForm();
    setFormOpen(false);
    setQuotationOpen(true);
  };

  const quotationDeal = quotationOpen ? selectedDeal : null;
  const invoiceDeal = invoiceOpen && invoiceDealId ? deals.find(deal => deal.id === invoiceDealId) ?? null : null;

  const filteredDeals = useMemo(() => {
    const base = deals.filter(deal => {
      if (!search) return true;
      const target = `${deal.title} ${deal.buyerName} ${deal.id}`.toLowerCase();
      return target.includes(search.toLowerCase());
    });
    if (filter === 'active') {
      return base.filter(deal => !['RELEASED', 'REFUNDED', 'CANCELLED', 'EXPIRED'].includes(deal.status));
    }
    if (filter === 'completed') {
      return base.filter(deal => ['RELEASED', 'REFUNDED', 'CANCELLED', 'EXPIRED'].includes(deal.status));
    }
    return base;
  }, [deals, filter, search]);

  const statusBadge = (deal: Deal, status: DealStatus) => (
    <Badge
      key={status}
      className={cn(
        'rounded-full border border-white/40 bg-gradient-to-br from-white/90 via-white/60 to-white/30 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm shadow-sky-900/5 transition-colors',
        statusOrder.indexOf(status) <= statusOrder.indexOf(deal.status)
          ? STATUS_COLORS[status]
          : 'border-transparent bg-white/70 text-slate-400 shadow-none',
      )}
    >
      {formatStatusLabel(status)}
    </Badge>
  );

  const isDemoTab = activeTab === 'buyer' || activeTab === 'agent' || activeTab === 'users';

  return (
    <>
      <div className="relative min-h-dvh overflow-x-hidden">
        <div className="pointer-events-none absolute inset-0 bg-app-gradient" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-60 bg-gradient-to-b from-white/70 via-white/40 to-transparent" />
        <div className="relative z-10 flex min-h-dvh flex-col">
          <BuyersWorkspaceHeader ref={headerRef} session={session} />
          <div aria-hidden className="shrink-0" style={{ height: headerHeight }} />
          <div className="flex-1 px-4 pb-28 pt-4">
            <div className="mx-auto w-full max-w-6xl">
              <Alert className="mb-4 rounded-2xl border-primary/40 bg-primary/5">
                <AlertCircle className="h-4 w-4 text-primary" />
                <AlertDescription className="text-sm text-foreground">Demo mode — no real payments • Explore the Dealer → Buyer → Agent flow</AlertDescription>
              </Alert>
              <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-[0_22px_55px_rgba(14,116,144,0.08)] backdrop-blur">
                <Tabs value={activeTab} onValueChange={value => setActiveTab(value as DealsTab)}>
                <TabsList className="flex flex-wrap items-center gap-2 rounded-2xl bg-muted/40 p-1">
                  <TabsTrigger value="dealer" className="rounded-2xl">Dealer</TabsTrigger>
                  <TabsTrigger value="overview" className="rounded-2xl">Overview</TabsTrigger>
                  <TabsTrigger value="past" className="rounded-2xl">Past Deals</TabsTrigger>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          'ml-auto h-8 w-8 rounded-2xl border border-transparent bg-white/0 text-muted-foreground hover:bg-muted/60',
                          isDemoTab && 'border-primary/40 bg-primary/10 text-primary shadow-soft',
                        )}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-2xl">
                      <DropdownMenuItem onSelect={() => setActiveTab('buyer')} className="rounded-xl">
                        Demo Buyer
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setActiveTab('agent')} className="rounded-xl">
                        Agent Mode
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => setActiveTab('users')} className="rounded-xl">
                        Demo Users
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <TabsTrigger value="buyer" className="hidden" aria-hidden />
                  <TabsTrigger value="agent" className="hidden" aria-hidden />
                  <TabsTrigger value="users" className="hidden" aria-hidden />
                </TabsList>

                <TabsContent value="dealer" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Start New Deal</CardTitle>
                      <CardDescription>Launch a quotation with real demo buyers and compelling product visuals.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {!formOpen ? (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 px-6 py-10 text-center">
                          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <PlusCircle className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-base font-semibold text-foreground">Launch a new quotation</p>
                            <p className="text-sm text-muted-foreground">Select a demo buyer, attach a few product images, and share the quotation instantly.</p>
                          </div>
                          <Button className="rounded-full" onClick={handleStartNewDeal}>
                            <PlusCircle className="mr-2 h-5 w-5" /> Start a new deal
                          </Button>
                        </div>
                      ) : (
                        <>
                          <div className="flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-full"
                              onClick={() => {
                                resetForm();
                                setFormOpen(false);
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deal-title">Item title *</Label>
                            <Input
                              id="deal-title"
                              value={form.title}
                              placeholder="Wireless Gaming Mouse"
                              onChange={event => handleFormChange('title', event.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Buyer *</Label>
                            <Select value={form.buyerId} onValueChange={handleBuyerSelect}>
                              <SelectTrigger className="rounded-2xl">
                                <SelectValue placeholder="Choose a demo buyer" />
                              </SelectTrigger>
                              <SelectContent>
                                {demoUsers.buyersList.map(buyer => (
                                  <SelectItem key={buyer.id} value={buyer.id} className="flex items-center gap-3">
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-8 w-8">
                                        <AvatarImage src={buyer.avatarUrl} alt={buyer.name} />
                                        <AvatarFallback>{buyer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                      </Avatar>
                                      <div className="space-y-[2px]">
                                        <p className="text-sm font-medium text-foreground">{buyer.name}</p>
                                        <p className="text-xs text-muted-foreground">{buyer.email}</p>
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          {selectedBuyer && (
                            <div className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-4">
                              <Avatar className="h-12 w-12">
                                <AvatarImage src={selectedBuyer.avatarUrl} alt={selectedBuyer.name} />
                                <AvatarFallback>{selectedBuyer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                              </Avatar>
                              <div className="space-y-1 text-sm">
                                <p className="font-semibold text-foreground">{selectedBuyer.name}</p>
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="h-4 w-4" />
                                  {form.buyerEmail}
                                </p>
                                <p className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="h-4 w-4" />
                                  {form.buyerPhone}
                                </p>
                              </div>
                            </div>
                          )}
                          <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                              <Label htmlFor="deal-price">Price (XAF) *</Label>
                              <Input
                                id="deal-price"
                                type="number"
                                min={0}
                                value={form.priceXAF}
                                onChange={event => handleFormChange('priceXAF', event.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="deal-qty">Quantity *</Label>
                              <Input
                                id="deal-qty"
                                type="number"
                                min={1}
                                value={form.qty}
                                onChange={event => handleFormChange('qty', event.target.value)}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Handover *</Label>
                            <Select value={form.handover} onValueChange={value => handleFormChange('handover', value as DraftFormState['handover'])}>
                              <SelectTrigger className="rounded-2xl">
                                <SelectValue placeholder="Choose handover" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="CENTRE">Centre pickup</SelectItem>
                                <SelectItem value="DELIVERY">Delivery</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          {form.handover === 'CENTRE' && (
                            <div className="space-y-2">
                              <Label>Pickup centre *</Label>
                              <Select value={form.pickupCenterId} onValueChange={value => handleFormChange('pickupCenterId', value)}>
                                <SelectTrigger className="rounded-2xl">
                                  <SelectValue placeholder="Select a hub" />
                                </SelectTrigger>
                                <SelectContent>
                                  {PICKUP_CENTRES.map(centre => (
                                    <SelectItem key={centre.id} value={centre.id}>
                                      {centre.name} — {centre.address}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          )}
                          <div className="space-y-3">
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                              <Label>Product images *</Label>
                              <Button variant="outline" size="sm" className="w-full rounded-full sm:w-auto" onClick={addImageField}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add image
                              </Button>
                            </div>
                            <div className="space-y-2">
                              {form.imageUrls.map((imageUrl, index) => (
                                <div key={`image-${index}`} className="flex items-center gap-2">
                                  <Input
                                    value={imageUrl}
                                    onChange={event => handleImageChange(index, event.target.value)}
                                    placeholder="https://images.unsplash.com/..."
                                  />
                                  {form.imageUrls.length > 1 && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="rounded-full"
                                      onClick={() => removeImageField(index)}
                                    >
                                      <XIcon className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              ))}
                            </div>
                            {previewImages.length > 0 && (
                              <div className="grid gap-3 sm:grid-cols-3">
                                {previewImages.map((url, index) => (
                                  <div
                                    key={`${url}-${index}`}
                                    className="relative overflow-hidden rounded-2xl border border-border/60 bg-muted/20"
                                  >
                                    <img src={url} alt={`Product image ${index + 1}`} className="h-32 w-full object-cover" />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="deal-notes">Notes (optional)</Label>
                            <Textarea
                              id="deal-notes"
                              value={form.notes}
                              onChange={event => handleFormChange('notes', event.target.value)}
                              placeholder="Add delivery or inspection notes"
                              rows={3}
                            />
                          </div>
                        </>
                      )}
                    </CardContent>
                    {formOpen && (
                      <CardFooter className="flex flex-col gap-2 sm:flex-row">
                        <Button variant="outline" className="w-full rounded-full" onClick={handleSaveDraft}>
                          Save Draft
                        </Button>
                        <Button className="w-full rounded-full" onClick={handleGenerateQuotation}>
                          Generate Quotation
                        </Button>
                      </CardFooter>
                    )}
                  </Card>
                </TabsContent>

                <TabsContent value="overview" className="mt-4 space-y-4">
                  {selectedDeal ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Latest Deal Overview</CardTitle>
                        <CardDescription>Track the progression for {selectedDeal.title}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {statusOrder.map(status => statusBadge(selectedDeal, status))}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-4">
                            <p className="text-sm font-semibold text-foreground">Buyer</p>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <UserRound className="h-4 w-4" />
                              {selectedDeal.buyerName}
                            </p>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              {selectedDeal.buyerEmail}
                            </p>
                            <p className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Phone className="h-4 w-4" />
                              {selectedDeal.buyerPhone}
                            </p>
                          </div>
                          <div className="space-y-2 rounded-2xl border border-border/60 bg-muted/10 p-4">
                            <p className="text-sm font-semibold text-foreground">Deal value</p>
                            <p className="text-xl font-semibold text-primary">{formatCurrency(selectedDeal.qty * selectedDeal.priceXAF)}</p>
                            <p className="text-xs text-muted-foreground">OTP: {selectedDeal.otpCode}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => {
                              setQuotationOpen(true);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Preview Quotation
                          </Button>
                          <Button
                            className="rounded-full"
                            onClick={() => {
                              upsertDeal(sendToDemoBuyer, 'Quotation sent to demo buyer');
                              setActiveTab('buyer');
                            }}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send to Demo Buyer
                          </Button>
                        </div>
                        {selectedDeal.imageUrls.length > 0 && (
                          <div className="grid gap-3 sm:grid-cols-3">
                            {selectedDeal.imageUrls.map((url, index) => (
                              <div
                                key={`${selectedDeal.id}-dealer-image-${index}`}
                                className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20"
                              >
                                <img src={url} alt={`${selectedDeal.title} preview ${index + 1}`} className="h-24 w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardHeader>
                        <CardTitle>Latest Deal Overview</CardTitle>
                        <CardDescription>No deals yet. Start a new quotation to see progress here.</CardDescription>
                      </CardHeader>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="buyer" className="mt-4 space-y-4">
                  {selectedDeal ? (
                    <Card>
                      <CardHeader>
                        <CardTitle>Demo Buyer View</CardTitle>
                        <CardDescription>Quotation shared from the dealer workspace</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="rounded-3xl border border-white/60 bg-white/80 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                              <ShieldCheck className="h-4 w-4 text-primary" />
                              Escrow protected
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold text-emerald-600 shadow-inner">
                              Demo Buyer Flow
                            </span>
                          </div>
                          <div className="mt-4 space-y-1">
                            <p className="text-lg font-semibold text-slate-900 sm:text-xl">{selectedDeal.title}</p>
                            <p className="text-sm text-muted-foreground">
                              Qty {selectedDeal.qty} • {formatCurrency(selectedDeal.priceXAF)}
                            </p>
                          </div>
                          <Separator className="my-4" />
                          <div className="flex flex-wrap gap-2">
                            {statusOrder.map(status => statusBadge(selectedDeal, status))}
                          </div>
                        </div>
                        {selectedDeal.imageUrls.length > 0 && (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {selectedDeal.imageUrls.map((url, index) => (
                              <div
                                key={`${selectedDeal.id}-buyer-gallery-${index}`}
                                className="overflow-hidden rounded-2xl border border-border/60 bg-muted/20"
                              >
                                <img src={url} alt={`${selectedDeal.title} gallery ${index + 1}`} className="h-36 w-full object-cover" />
                              </div>
                            ))}
                          </div>
                        )}
                        <div className="grid gap-2">
                          <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => setQuotationOpen(true)}
                          >
                            <FileText className="mr-2 h-4 w-4" /> View Quotation
                          </Button>
                          <Button
                            variant="outline"
                            className="rounded-full"
                            onClick={() => upsertDeal(confirmByBuyer, 'Buyer confirmed details')}
                            disabled={selectedDeal.status !== 'SENT' && selectedDeal.status !== 'DRAFT'}
                          >
                            Confirm
                          </Button>
                          <Button
                            className="rounded-full"
                            onClick={() => {
                              setPaymentSheetOpen(true);
                              setInvoiceDealId(selectedDeal.id);
                            }}
                            disabled={selectedDeal.status !== 'PAID' && selectedDeal.status !== 'SENT' && selectedDeal.status !== 'ESCROW_HELD'}
                          >
                            Pay (Demo)
                          </Button>
                        </div>
                        {selectedDeal.status === 'ESCROW_HELD' && (
                          <Alert className="border-emerald-500/40 bg-emerald-500/10">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                            <AlertDescription className="text-sm text-emerald-700">Payment successful • Escrow held • Show QR at pickup</AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card>
                      <CardContent className="py-10 text-center text-sm text-muted-foreground">Create a deal from the Dealer tab to view it here.</CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="agent" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Verify pickup</CardTitle>
                      <CardDescription>Scan the QR or enter the 6-digit OTP shared by the buyer</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="deal-otp">OTP Code</Label>
                        <Input
                          id="deal-otp"
                          placeholder="123456"
                          value={otp}
                          maxLength={6}
                          onChange={event => setOtp(event.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      {otp.length === 6 && (
                        <div className="space-y-3">
                          {deals
                            .filter(deal => deal.otpCode === otp)
                            .map(deal => (
                              <div key={deal.id} className="rounded-2xl border border-primary/40 bg-primary/5 p-4 space-y-3">
                                <div>
                                  <p className="text-sm font-semibold">{deal.title}</p>
                                  <p className="text-xs text-muted-foreground">Buyer: {deal.buyerName}</p>
                                  <p className="text-xs text-muted-foreground">Total: {formatCurrency(deal.priceXAF * deal.qty)}</p>
                                </div>
                                <div className="flex flex-col gap-2 sm:flex-row">
                                  <Button
                                    className="flex-1 rounded-full"
                                    onClick={() => {
                                      setSelectedDealId(deal.id);
                                      upsertDeal(confirmHandover, 'Handover confirmed');
                                    }}
                                  >
                                    Confirm Handover
                                  </Button>
                                  <Button
                                    variant="outline"
                                    className="flex-1 rounded-full"
                                    onClick={() => {
                                      setSelectedDealId(deal.id);
                                      upsertDeal(markReleased, 'Deal released to buyer');
                                    }}
                                  >
                                    Mark Released
                                  </Button>
                                </div>
                              </div>
                            ))}
                          {deals.every(deal => deal.otpCode !== otp) && (
                            <p className="text-xs text-muted-foreground">No deal found for this OTP.</p>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="past" className="mt-4 space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex gap-2">
                      <Button size="sm" className="rounded-full" variant={filter === 'all' ? 'default' : 'outline'} onClick={() => setFilter('all')}>
                        All
                      </Button>
                      <Button size="sm" className="rounded-full" variant={filter === 'active' ? 'default' : 'outline'} onClick={() => setFilter('active')}>
                        Active
                      </Button>
                      <Button size="sm" className="rounded-full" variant={filter === 'completed' ? 'default' : 'outline'} onClick={() => setFilter('completed')}>
                        Completed
                      </Button>
                    </div>
                    <Input
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder="Search by title, buyer, or ID"
                      className="max-w-sm rounded-full"
                    />
                  </div>
                  <div className="space-y-4">
                    {filteredDeals.map(deal => (
                      <Card
                        key={deal.id}
                        className="group overflow-hidden border-none bg-gradient-to-br from-white via-slate-50/80 to-slate-100/60 shadow-[0_25px_50px_rgba(15,23,42,0.16)] ring-1 ring-slate-900/5 transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_38px_70px_rgba(15,23,42,0.18)]"
                      >
                        <CardContent className="flex flex-col gap-6 pt-6 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex flex-1 flex-col gap-4">
                            <div className="flex flex-col gap-3">
                              <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Deal #{deal.id.slice(0, 6)}</p>
                              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <p className="text-lg font-semibold text-slate-900 sm:text-xl">{deal.title}</p>
                                <Badge
                                  className={cn(
                                    'self-start rounded-full border border-white/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide shadow-sm shadow-emerald-900/10 sm:self-auto',
                                    STATUS_COLORS[deal.status],
                                  )}
                                >
                                  {formatStatusLabel(deal.status)}
                                </Badge>
                              </div>
                              <div className="flex flex-col gap-1 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                <p>Buyer • {deal.buyerName}</p>
                                <p className="text-xs sm:text-sm">Created {formatDateTime(deal.createdAt)}</p>
                              </div>
                            </div>
                            <div className="flex flex-col gap-4 rounded-2xl bg-white/80 p-4 shadow-inner shadow-slate-900/5 ring-1 ring-slate-900/10 sm:flex-row sm:items-center sm:justify-between">
                              <div>
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Deal Value</p>
                                <p className="mt-2 text-2xl font-semibold text-emerald-600">
                                  {formatCurrency(deal.priceXAF * deal.qty)}
                                </p>
                              </div>
                              <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
                                <div className="h-2 w-full rounded-full bg-slate-200/80">
                                  <div
                                    className="h-2 rounded-full bg-gradient-to-r from-blue to-primary"
                                    style={{ width: `${Math.min((statusOrder.indexOf(deal.status) / (statusOrder.length - 1)) * 100, 100)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  Progress • {statusOrder.indexOf(deal.status) + 1} of {statusOrder.length}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex w-full flex-col gap-3 sm:w-auto sm:items-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="w-full rounded-full border-dashed border-slate-300 bg-white/70 font-semibold text-slate-600 transition-colors hover:border-slate-400 hover:bg-white sm:w-36"
                              onClick={() => {
                                setInvoiceDealId(deal.id);
                                setInvoiceOpen(true);
                                setSelectedDealId(deal.id);
                              }}
                              disabled={!deal.invoiceNo}
                            >
                              View Invoice
                            </Button>
                            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/70 px-4 py-2 text-xs font-medium text-emerald-700 shadow-inner">
                              OTP {deal.otpCode ?? '—'}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                    {filteredDeals.length === 0 && (
                      <Card>
                        <CardContent className="py-12 text-center text-sm text-muted-foreground">No deals match the current filters.</CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="users" className="mt-4 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Demo Users</CardTitle>
                      <CardDescription>Switch context or reset seeded data</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="rounded-2xl border border-border/60 bg-muted/10 p-4 text-sm text-muted-foreground">
                        Demo mode — no real payments.
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 p-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Demo Seller</p>
                            <p className="text-xs text-muted-foreground">{demoUsers.seller.email}</p>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setActiveTab('dealer')}>
                            Switch role view
                          </Button>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 p-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Demo Buyer</p>
                            <p className="text-xs text-muted-foreground">{demoUsers.buyer.email}</p>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setActiveTab('buyer')}>
                            Switch role view
                          </Button>
                        </div>
                        <div className="flex items-center justify-between rounded-2xl border border-border/60 bg-background/80 p-4">
                          <div>
                            <p className="text-sm font-semibold text-foreground">Demo Agent</p>
                            <p className="text-xs text-muted-foreground">{demoUsers.agent.email}</p>
                          </div>
                          <Button size="sm" variant="outline" className="rounded-full" onClick={() => setActiveTab('agent')}>
                            Switch role view
                          </Button>
                        </div>
                        <div className="space-y-2">
                          <p className="text-sm font-semibold text-foreground">Quotation buyers directory</p>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {demoUsers.buyersList.map(buyer => (
                              <div key={buyer.id} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-muted/10 p-3">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={buyer.avatarUrl} alt={buyer.name} />
                                  <AvatarFallback>{buyer.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="space-y-1 text-xs">
                                  <p className="text-sm font-semibold text-foreground">{buyer.name}</p>
                                  <p className="text-muted-foreground">{buyer.email}</p>
                                  <p className="text-muted-foreground">{buyer.phone}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 sm:flex-row">
                      <Button
                        variant="outline"
                        className="w-full rounded-full"
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            `${demoUsers.seller.email}\n${demoUsers.buyer.email}\n${demoUsers.agent.email}`,
                          );
                          toast({ description: 'Demo contacts copied' });
                        }}
                      >
                        <Copy className="mr-2 h-4 w-4" /> Copy Contacts
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full rounded-full"
                        onClick={() => {
                          resetDemo();
                          toast({ description: 'Demo data reset' });
                        }}
                      >
                        <RotateCcw className="mr-2 h-4 w-4" /> Reset Demo Data
                      </Button>
                    </CardFooter>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={quotationOpen && Boolean(quotationDeal)} onOpenChange={setQuotationOpen}>
        <DialogContent className="max-w-3xl rounded-[28px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>ProList | Deals — Quotation</DialogTitle>
          </DialogHeader>
          {quotationDeal && (
            <div className="max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
              <InvoiceDocument
                invoice={buildDealInvoiceDocument(quotationDeal)}
                formatCurrency={formatCurrency}
                formatDateTime={value => formatDateTime(new Date(value).getTime())}
                pickupPayload={buildPickupQrPayload({
                  orderId: quotationDeal.orderId ?? quotationDeal.id,
                  invoiceNo: quotationDeal.quotationNo ?? quotationDeal.id,
                  pickupCode: quotationDeal.otpCode,
                  hubId: quotationDeal.pickupCenterId ?? 'hub-centre',
                })}
                shareMessage={`Quotation ${quotationDeal.quotationNo ?? quotationDeal.id}`}
              />
            </div>
          )}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                if (quotationDeal?.quotationNo) {
                  navigator.clipboard?.writeText(quotationDeal.quotationNo);
                  toast({ description: 'Quotation link copied' });
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Link
            </Button>
            <Button
              className="w-full rounded-full"
              onClick={() => {
                upsertDeal(sendToDemoBuyer, 'Quotation sent to demo buyer');
                setActiveTab('buyer');
                setQuotationOpen(false);
              }}
            >
              <Send className="mr-2 h-4 w-4" /> Send to Demo Buyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={invoiceOpen && Boolean(invoiceDeal)} onOpenChange={setInvoiceOpen}>
        <DialogContent className="max-w-3xl rounded-[28px] overflow-hidden">
          <DialogHeader>
            <DialogTitle>ProList | Deals — Invoice</DialogTitle>
          </DialogHeader>
          {invoiceDeal && (
            <div className="max-h-[70vh] overflow-y-auto pr-1 sm:pr-2">
              <InvoiceDocument
                invoice={buildDealInvoiceDocument(invoiceDeal)}
                formatCurrency={formatCurrency}
                formatDateTime={value => formatDateTime(new Date(value).getTime())}
                pickupPayload={buildPickupQrPayload({
                  orderId: invoiceDeal.orderId ?? invoiceDeal.id,
                  invoiceNo: invoiceDeal.invoiceNo ?? invoiceDeal.quotationNo ?? invoiceDeal.id,
                  pickupCode: invoiceDeal.otpCode,
                  hubId: invoiceDeal.pickupCenterId ?? 'hub-centre',
                })}
                shareMessage={`Invoice ${invoiceDeal.invoiceNo ?? invoiceDeal.id}`}
                timeline={invoiceDeal.events.map((event, index) => ({
                  id: `${invoiceDeal.id}-event-${index}`,
                  label: `${event.actor} — ${event.action}`,
                  at: new Date(event.ts).toISOString(),
                }))}
              />
            </div>
          )}
          <DialogFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                if (invoiceDeal?.invoiceNo) {
                  navigator.clipboard?.writeText(invoiceDeal.invoiceNo);
                  toast({ description: 'Invoice number copied' });
                }
              }}
            >
              <Copy className="mr-2 h-4 w-4" /> Copy Link
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => window.print()}
            >
              <Download className="mr-2 h-4 w-4" /> Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Sheet open={paymentSheetOpen && Boolean(invoiceDealId)} onOpenChange={value => setPaymentSheetOpen(value)}>
        <SheetContent side="bottom" className="rounded-t-[28px]">
          <SheetHeader className="text-left">
            <SheetTitle>Complete escrow payment</SheetTitle>
            <SheetDescription>Demo payment flow — choose an outcome to continue.</SheetDescription>
          </SheetHeader>
          <div className="space-y-4">
            {invoiceDealId && (
              <div className="rounded-2xl border border-border/60 bg-muted/10 p-4">
                <p className="text-sm font-semibold text-foreground">
                  {deals.find(deal => deal.id === invoiceDealId)?.title ?? 'Selected deal'}
                </p>
                <p className="text-xs text-muted-foreground">
                  Total {formatCurrency((deals.find(deal => deal.id === invoiceDealId)?.qty ?? 0) * (deals.find(deal => deal.id === invoiceDealId)?.priceXAF ?? 0))}
                </p>
              </div>
            )}
          </div>
          <SheetFooter className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              className="w-full rounded-full"
              onClick={() => {
                if (invoiceDealId) {
                  payDemoFail(invoiceDealId);
                  toast({ description: 'Payment failed — try again', variant: 'destructive' });
                }
                setPaymentSheetOpen(false);
              }}
            >
              Fail Payment
            </Button>
            <Button
              className="w-full rounded-full"
              onClick={() => {
                if (invoiceDealId) {
                  const updated = payDemoSuccess(invoiceDealId);
                  if (updated) {
                    setInvoiceDealId(updated.id);
                    setInvoiceOpen(true);
                    toast({ description: 'Payment successful — escrow held' });
                  }
                }
                setPaymentSheetOpen(false);
              }}
            >
              Pay Successful
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      </div>
      <VerificationDialog
        open={verificationOpen}
        onOpenChange={open => {
          setVerificationOpen(open);
          if (!open) {
            setPendingAction(null);
          }
        }}
        initialBusinessName={session.businessName}
        onComplete={handleVerificationComplete}
      />
    </>
  );
};

export default DealsHub;

