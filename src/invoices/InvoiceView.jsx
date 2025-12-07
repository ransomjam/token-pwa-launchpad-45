import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Copy } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import InvoiceDocument from '@/invoices/InvoiceDocument';
import { DEMO_INVOICE, getInvoiceByNo, INVOICE_UPDATED_EVENT } from '@/invoices/demoInvoice';
import { buildInvoiceFromWin, FALLBACK_NOTES } from '@/invoices/invoiceUtils';
import { loadWins, WINS_UPDATED_EVENT } from '@/lib/auctionData';
import { buildPickupQrPayload } from '@/lib/invoice';
import { useI18n } from '@/context/I18nContext';

const InvoiceView = () => {
  const { invoiceNo: invoiceParam } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { locale } = useI18n();
  const [winsVersion, setWinsVersion] = useState(0);
  const [invoiceVersion, setInvoiceVersion] = useState(0);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleWinsUpdate = () => setWinsVersion(prev => prev + 1);
    window.addEventListener(WINS_UPDATED_EVENT, handleWinsUpdate);
    window.addEventListener('storage', handleWinsUpdate);
    return () => {
      window.removeEventListener(WINS_UPDATED_EVENT, handleWinsUpdate);
      window.removeEventListener('storage', handleWinsUpdate);
    };
  }, []);

  useEffect(() => {
    const handleInvoiceUpdate = () => setInvoiceVersion(prev => prev + 1);
    window.addEventListener(INVOICE_UPDATED_EVENT, handleInvoiceUpdate);
    window.addEventListener('storage', handleInvoiceUpdate);
    return () => {
      window.removeEventListener(INVOICE_UPDATED_EVENT, handleInvoiceUpdate);
      window.removeEventListener('storage', handleInvoiceUpdate);
    };
  }, []);

  const wins = useMemo(() => loadWins(), [winsVersion]);
  const derivedInvoices = useMemo(() => {
    return wins.map(buildInvoiceFromWin).filter(Boolean);
  }, [wins]);

  const invoice = useMemo(() => {
    return getInvoiceByNo(invoiceParam, { invoices: derivedInvoices });
  }, [invoiceParam, derivedInvoices, invoiceVersion]);

  useEffect(() => {
    if (!invoice?.invoiceNo) return;
    document.title = `Invoice ${invoice.invoiceNo}`;
  }, [invoice?.invoiceNo]);

  const currencyFormatter = useMemo(() => {
    return new Intl.NumberFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      style: 'currency',
      currency: invoice?.currency ?? 'XAF',
      maximumFractionDigits: 0,
    });
  }, [locale, invoice?.currency]);

  const formatCurrency = value => {
    if (typeof value !== 'number') return '—';
    return currencyFormatter.format(value);
  };

  const dateFormatter = useMemo(() => {
    return new Intl.DateTimeFormat(locale === 'fr' ? 'fr-FR' : 'en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  }, [locale]);

  const formatDateTime = value => {
    if (!value) return '—';
    try {
      return dateFormatter.format(new Date(value));
    } catch (error) {
      return value;
    }
  };

  const pickupPayload = useMemo(() => {
    const payload = invoice?.qrCodePayload;
    if (
      payload?.orderId &&
      payload?.invoiceNo &&
      payload?.pickupCode &&
      payload?.hubId
    ) {
      return buildPickupQrPayload(payload);
    }
    if (
      invoice?.orderId &&
      invoice?.pickup?.hubId &&
      invoice?.pickup?.pickupCode
    ) {
      return buildPickupQrPayload({
        orderId: invoice.orderId,
        invoiceNo: invoice.invoiceNo,
        pickupCode: invoice.pickup.pickupCode,
        hubId: invoice.pickup.hubId,
      });
    }
    return null;
  }, [invoice]);

  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
  const shareMessage = `Invoice ${invoice?.invoiceNo ?? ''} • Pickup code ${
    invoice?.pickup?.pickupCode ?? ''
  }`;

  const focusTarget = searchParams.get('focus');

  const isPreorder = invoice?.item?.type === 'PREORDER';

  const timeline = [
    {
      id: isPreorder ? 'preorder' : 'won',
      label: isPreorder ? 'Preorder placed / Précommande confirmée' : 'Won / Gagné',
      at: isPreorder ? invoice?.createdAt ?? invoice?.wonAt : invoice?.wonAt,
    },
    {
      id: 'paid',
      label: 'Paid / Payé',
      at: invoice?.paidAt,
    },
    {
      id: 'pickup',
      label: 'Pickup chosen / Point de retrait choisi',
      at: invoice?.pickupSelectedAt,
    },
    {
      id: 'escrow',
      label: 'Escrow Held → Release on collection / Séquestre : Actif → Libération lors du retrait',
      at: invoice?.pickupSelectedAt ?? invoice?.paidAt ?? invoice?.createdAt,
    },
  ];

  const noteEntries = useMemo(() => {
    const baseNotes = Array.isArray(invoice?.notes) ? invoice.notes : [];
    const combined = [...baseNotes, ...FALLBACK_NOTES];
    return Array.from(new Set(combined));
  }, [invoice?.notes]);

  const copyToClipboard = async value => {
    try {
      if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
        return false;
      }
      await navigator.clipboard.writeText(value);
      return true;
    } catch (error) {
      console.error('Copy failed', error);
      return false;
    }
  };

  const handleBack = () => navigate(-1);

  const handleCopyInvoiceNo = async () => {
    if (!invoice?.invoiceNo) return;
    const success = await copyToClipboard(invoice.invoiceNo);
    if (success) {
      toast({ description: 'Invoice number copied • Numéro copié' });
    } else {
      toast({ description: 'Unable to copy', variant: 'destructive' });
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    const success = await copyToClipboard(shareUrl);
    if (success) {
      toast({ description: 'Link copied • Lien copié' });
    } else {
      toast({ description: 'Unable to copy', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    window.print();
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ title: 'Invoice', text: 'Your invoice', url: shareUrl });
        toast({ description: 'Shared successfully • Partage envoyé' });
      } catch (error) {
        if (error?.name !== 'AbortError') {
          toast({ description: 'Share failed • Échec du partage', variant: 'destructive' });
        }
      }
      return;
    }
    setShareSheetOpen(true);
  };

  const openShareChannel = channel => {
    const payload = `${shareMessage}\n${shareUrl}`.trim();
    const encoded = encodeURIComponent(payload);
    if (channel === 'whatsapp') {
      window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
      toast({ description: 'WhatsApp share ready • Partage WhatsApp' });
    }
    if (channel === 'sms') {
      window.open(`sms:?body=${encoded}`, '_blank');
      toast({ description: 'SMS share ready • Partage SMS' });
    }
  };

  useEffect(() => {
    if (focusTarget !== 'pickup' || !invoice) return;
    const section = document.getElementById('invoice-pickup-section');
    if (!section) return;
    section.scrollIntoView({ behavior: 'smooth', block: 'center' });
    section.classList.add('ring-2', 'ring-primary/40', 'ring-offset-2', 'ring-offset-background');
    const timer = window.setTimeout(() => {
      section.classList.remove('ring-2', 'ring-primary/40', 'ring-offset-2', 'ring-offset-background');
    }, 2200);
    return () => {
      window.clearTimeout(timer);
      section.classList.remove('ring-2', 'ring-primary/40', 'ring-offset-2', 'ring-offset-background');
    };
  }, [focusTarget, invoice]);

  const handleTrackOrder = () => {
    const orderId = invoice?.context?.orderId;
    if (!orderId) return;
    navigate(`/order/${orderId}`);
  };

  return (
    <main className="invoice-print-page min-h-dvh bg-muted/30 pb-20">
      <div className="invoice-print-container mx-auto w-full max-w-3xl px-4 pt-6 md:px-6">
        <header className="invoice-hide-print mb-6 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full"
            onClick={handleBack}
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="sr-only">Back</span>
          </Button>
          <div className="flex flex-1 flex-col">
            <h1 className="text-lg font-semibold text-foreground">Invoice / Facture</h1>
            <p className="text-xs text-muted-foreground">#{invoice?.invoiceNo ?? DEMO_INVOICE.invoiceNo}</p>
          </div>
          <div className="w-10" aria-hidden />
        </header>

        <InvoiceDocument
          invoice={invoice}
          formatCurrency={formatCurrency}
          formatDateTime={formatDateTime}
          pickupPayload={pickupPayload}
          shareMessage={shareMessage}
          timeline={timeline}
          noteEntries={noteEntries}
          onCopyInvoiceNo={handleCopyInvoiceNo}
          onCopyLink={handleCopyLink}
          onDownload={handleDownload}
          onShare={handleShare}
          onTrackOrder={invoice?.context?.orderId ? handleTrackOrder : undefined}
        />
      </div>

      <Sheet open={shareSheetOpen} onOpenChange={setShareSheetOpen}>
        <SheetContent side="bottom" className="space-y-4">
          <SheetHeader>
            <SheetTitle>Share / Partager</SheetTitle>
            <SheetDescription>
              Choose a channel or copy the message below.
            </SheetDescription>
          </SheetHeader>
          <div className="space-y-3 text-sm">
            <div className="flex gap-3">
              <Button className="flex-1 rounded-full" onClick={() => openShareChannel('whatsapp')}>
                WhatsApp
              </Button>
              <Button variant="outline" className="flex-1 rounded-full" onClick={() => openShareChannel('sms')}>
                SMS
              </Button>
            </div>
            <div className="rounded-2xl border border-dashed border-border/60 bg-muted/20 p-3 text-xs text-muted-foreground">
              {shareMessage}
              <br />
              {shareUrl}
            </div>
            <Button variant="ghost" className="w-full rounded-full" onClick={handleCopyLink}>
              <Copy className="mr-2 h-4 w-4" /> Copy link / Copier le lien
            </Button>
          </div>
          <SheetFooter>
            <Button variant="secondary" className="w-full rounded-full" onClick={() => setShareSheetOpen(false)}>
              Close / Fermer
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </main>
  );
};

export default InvoiceView;
