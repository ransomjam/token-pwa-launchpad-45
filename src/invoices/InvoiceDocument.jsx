import { forwardRef } from 'react';
import {
  Copy,
  Download,
  MapPin,
  Share2,
  ShieldCheck,
  Store,
  User,
  Phone,
  Mail,
} from 'lucide-react';

import Logo from '@/components/Logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { PickupQrCode } from '@/components/PickupQrCode';
import { cn } from '@/lib/utils';

const PAYMENT_STATUS_COPY = {
  PAID: 'Paid / Payé',
  PENDING: 'Pending / En attente',
};

const ESCROW_STATUS_COPY = {
  HELD: 'Escrow: Held / Séquestre : Actif',
  RELEASED: 'Escrow: Released / Séquestre : Libéré',
};

const InvoiceDocument = forwardRef(
  (
    {
      invoice,
      className,
      formatCurrency,
      formatDateTime,
      pickupPayload,
      shareMessage,
      timeline = [],
      noteEntries = [],
      onCopyInvoiceNo,
      onCopyLink,
      onDownload,
      onShare,
      onTrackOrder,
    },
    ref,
  ) => {
    const paymentStatus = invoice?.paymentStatus ?? 'PAID';
    const escrowStatus = invoice?.escrowStatus ?? 'HELD';
    const paymentBadgeLabel = PAYMENT_STATUS_COPY[paymentStatus] ?? PAYMENT_STATUS_COPY.PAID;
    const isPaymentPending = paymentStatus === 'PENDING';
    const paymentBadgeClasses = isPaymentPending
      ? 'bg-amber-500/10 text-amber-700'
      : 'bg-emerald-500/10 text-emerald-700';
    const escrowBadgeLabel = ESCROW_STATUS_COPY[escrowStatus] ?? ESCROW_STATUS_COPY.HELD;
    const isPreorder = invoice?.item?.type === 'PREORDER';
    const qty = invoice?.item?.qty ?? 1;
    const unitPrice = invoice?.item?.unitPriceXAF;

    const safeFormatCurrency = value => {
      if (typeof formatCurrency === 'function') {
        return formatCurrency(value);
      }
      if (typeof value === 'number') {
        return value.toLocaleString('en-US', { style: 'currency', currency: invoice?.currency ?? 'XAF' });
      }
      return '—';
    };

    const safeFormatDateTime = value => {
      if (!value) return '—';
      if (typeof formatDateTime === 'function') {
        return formatDateTime(value);
      }
      return value;
    };

    return (
      <section
        ref={ref}
        id="invoice-print-root"
        className={cn(
          'invoice-surface space-y-6 rounded-3xl border border-border/60 bg-card/95 p-5 shadow-soft sm:space-y-7 sm:p-7 lg:p-8',
          className,
        )}
      >
        <div className="flex flex-col gap-4 sm:gap-5">
          <Logo
            wrapperClassName="h-12 w-12 shadow-soft"
            wrapperStyle={{ printColorAdjust: 'exact', WebkitPrintColorAdjust: 'exact' }}
            className="p-1.5"
          />
          <div className="space-y-3">
            <p
              className="text-lg font-bold uppercase tracking-[0.2em] text-foreground sm:text-xl"
              style={{ fontFamily: '"Calibri", "Helvetica Neue", Arial, sans-serif' }}
            >
              PROLIST | AUCTIONS
            </p>
            <div className="space-y-1 text-xs text-muted-foreground sm:text-sm">
              <p>Commercial Avenue, Bamenda</p>
              <p>infos.prolist@gmail.com</p>
              <p className="font-semibold text-foreground">+237 671 308 991</p>
            </div>
          </div>

          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-left">
                  <h2 className="text-xl font-semibold text-foreground sm:text-2xl">Invoice / Facture</h2>
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    {invoice?.createdAt ? safeFormatDateTime(invoice.createdAt) : '—'}
                  </span>
                </div>
                {invoice?.orderId && (
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    Order {invoice.orderId}
                  </span>
                )}
              </div>
              <span className="text-xs font-semibold text-foreground sm:text-sm">{invoice?.invoiceNo ?? '—'}</span>
            </div>

            <div className="flex w-full flex-col gap-3 sm:ml-auto sm:w-auto sm:max-w-[220px]">
              <div className="flex flex-col items-start gap-2">
                <Badge className={cn('rounded-full text-xs font-semibold', paymentBadgeClasses)}>{paymentBadgeLabel}</Badge>
                <Badge className="rounded-full border border-primary/40 bg-primary/10 text-xs font-semibold text-primary">
                  {escrowBadgeLabel}
                </Badge>
              </div>
              <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2 text-right">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-primary sm:text-xs">
                  Pickup code
                </p>
                <p className="mt-1 text-2xl font-semibold tracking-[0.25em] text-primary sm:text-3xl">
                  {invoice?.pickup?.pickupCode ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="rounded-3xl border border-border/60 bg-muted/20 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <User className="h-4 w-4" />
              Buyer / Acheteur
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <p className="font-semibold text-foreground">{invoice?.buyer?.name ?? '—'}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {invoice?.buyer?.phoneMasked ?? '—'}
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Mail className="h-4 w-4" />
                {invoice?.buyer?.emailMasked ?? '—'}
              </p>
            </div>
          </div>
          <div className="rounded-3xl border border-border/60 bg-muted/20 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              <Store className="h-4 w-4" />
              Seller / Vendeur
            </div>
            <div className="mt-3 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{invoice?.seller?.storeName ?? '—'}</p>
                {invoice?.seller?.verified && <ShieldCheck className="h-4 w-4 text-primary" />}
              </div>
              <p className="text-muted-foreground">{invoice?.seller?.city ?? '—'}</p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                {invoice?.seller?.contactMasked ?? '—'}
              </p>
            </div>
          </div>
        </div>

        <div id="invoice-pickup-section" className="rounded-3xl border border-border/60 bg-muted/10 p-4 sm:p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-primary">
            {isPreorder ? 'Preorder / Précommande' : 'Auction winner / Gagnant de l’enchère'}
          </div>
          <div className="mt-2.5 flex items-start gap-4">
            <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl bg-muted">
              {invoice?.item?.image ? (
                <img src={invoice.item.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">No image</div>
              )}
            </div>
            <div className="flex-1 space-y-1">
              <p className="text-base font-semibold text-foreground">{invoice?.item?.title ?? '—'}</p>
              {isPreorder ? (
                <p className="text-sm text-muted-foreground">
                  Unit price {safeFormatCurrency(unitPrice)} × Qty {qty}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Qty {invoice?.item?.qty ?? 1} • {safeFormatCurrency(invoice?.item?.finalBidXAF)}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-muted/10 p-4 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Pricing / Détails tarifaires
          </h3>
          <div className="mt-3 space-y-3 text-sm leading-relaxed">
            <div className="flex items-center justify-between">
              <span>Subtotal / Sous-total</span>
              <span className="font-medium text-foreground">{safeFormatCurrency(invoice?.pricing?.subtotalXAF)}</span>
            </div>
            {typeof invoice?.pricing?.escrowFeeXAF === 'number' && invoice.pricing.escrowFeeXAF > 0 && (
              <div className="flex items-center justify-between">
                <span>Buyer premium / Prime acheteur</span>
                <span className="font-medium text-foreground">{safeFormatCurrency(invoice.pricing.escrowFeeXAF)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Service fee / Frais de service</span>
              <span className="font-medium text-foreground">{safeFormatCurrency(invoice?.pricing?.serviceFeeXAF)}</span>
            </div>
            {typeof invoice?.pricing?.centreHandlingFeeXAF === 'number' && invoice.pricing.centreHandlingFeeXAF > 0 && (
              <div className="flex items-center justify-between">
                <span>Centre handling / Centre handling</span>
                <span className="font-medium text-foreground">{safeFormatCurrency(invoice.pricing.centreHandlingFeeXAF)}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span>Discount / Remise</span>
              <span className="font-medium text-foreground">{safeFormatCurrency(invoice?.pricing?.discountXAF)}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between text-base font-semibold text-foreground">
              <span>Total paid / Total payé</span>
              <span className="font-bold text-primary">{safeFormatCurrency(invoice?.pricing?.totalXAF)}</span>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-muted/10 p-4 sm:p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pickup hub / Point de retrait
                </p>
                <p className="mt-1 text-base font-semibold text-foreground">{invoice?.pickup?.hubName ?? '—'}</p>
                <p className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  {invoice?.pickup?.address ?? '—'}
                </p>
              </div>
              <div className="flex flex-col gap-1 text-muted-foreground">
                <span>Hours: {invoice?.pickup?.hours ?? '—'}</span>
                <span>ETA / Délai: {invoice?.pickup?.etaWindow ?? '—'}</span>
              </div>
            </div>
            <div className="flex flex-col items-center gap-3">
              {pickupPayload ? (
                <PickupQrCode
                  value={pickupPayload}
                  size={168}
                  className="rounded-2xl bg-white p-2"
                  ariaLabel={shareMessage ? `Pickup QR for ${shareMessage}` : 'Pickup QR'}
                />
              ) : null}
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-border/60 bg-muted/10 p-4 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Timeline / Historique</h3>
          <ol className="mt-3 space-y-2.5 text-sm">
            {timeline.map(step => (
              <li key={step.id} className="flex items-start justify-between gap-3">
                <span className="font-medium text-foreground">{step.label}</span>
                <span className="text-muted-foreground">{safeFormatDateTime(step.at)}</span>
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-3xl border border-border/60 bg-muted/10 p-4 sm:p-5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notes</h3>
          <ul className="mt-2.5 space-y-2 text-sm text-muted-foreground">
            {noteEntries.map((note, index) => (
              <li key={`${note}-${index}`}>{note}</li>
            ))}
          </ul>
        </div>

        <div className="invoice-hide-print flex flex-wrap gap-3">
          {onDownload && (
            <Button className="rounded-full" onClick={onDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download PDF / Télécharger le PDF
            </Button>
          )}
          {onCopyInvoiceNo && (
            <Button variant="outline" className="rounded-full" onClick={onCopyInvoiceNo}>
              <Copy className="mr-2 h-4 w-4" /> Copy invoice number • Copier le numéro
            </Button>
          )}
          {onCopyLink && (
            <Button variant="outline" className="rounded-full" onClick={onCopyLink}>
              <Copy className="mr-2 h-4 w-4" />
              Copy link / Copier le lien
            </Button>
          )}
          {onShare && (
            <Button variant="secondary" className="rounded-full" onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share / Partager
            </Button>
          )}
          {onTrackOrder && (
            <Button variant="outline" className="rounded-full" onClick={onTrackOrder}>
              Track order / Suivre la commande
            </Button>
          )}
        </div>
      </section>
    );
  },
);

InvoiceDocument.displayName = 'InvoiceDocument';

export default InvoiceDocument;
