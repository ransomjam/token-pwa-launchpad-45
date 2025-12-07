import { DEMO_INVOICE } from '@/invoices/demoInvoice';
import { getAuctionById } from '@/lib/auctionData';

export const FALLBACK_NOTES = [
  'Protected by Escrow • Auto-refund if late',
  'Paiement séquestré • Remboursement auto en cas de retard',
];

export const buildInvoiceFromWin = win => {
  if (!win || !win.checkout) return null;
  const checkout = win.checkout;
  const auction = getAuctionById(win.auctionId);
  const hubs = checkout.hubs ?? [];
  const resolvedHub = checkout.chosenHubId
    ? hubs.find(hub => hub.id === checkout.chosenHubId)
    : checkout.lastHubId
      ? hubs.find(hub => hub.id === checkout.lastHubId)
      : null;
  const pickupCode = checkout.pickupCode ?? '0000';
  const orderId = checkout.orderId ?? checkout.qrCodeValue ?? '';
  const invoiceNo = checkout.invoiceNo ?? '';
  const qrCodePayload = {
    orderId: orderId || '',
    invoiceNo: invoiceNo || '',
    pickupCode,
    hubId: resolvedHub?.id ?? checkout.chosenHubId ?? checkout.lastHubId ?? '',
  };

  return {
    invoiceNo: invoiceNo || DEMO_INVOICE.invoiceNo,
    orderId: orderId || DEMO_INVOICE.orderId,
    paymentStatus: win.status === 'pending_payment' ? 'PENDING' : 'PAID',
    escrowStatus: 'HELD',
    currency: 'XAF',
    createdAt: checkout.invoiceGeneratedAt ?? checkout.pickupSelectedAt ?? checkout.paidAt ?? win.wonAt,
    wonAt: win.wonAt,
    paidAt: checkout.paidAt,
    pickupSelectedAt: checkout.pickupSelectedAt,
    buyer: {
      name: checkout.buyerName,
      phoneMasked: checkout.buyerContactMasked,
      emailMasked: checkout.buyerEmailMasked,
    },
    seller: {
      storeName: checkout.sellerName ?? auction?.seller?.name,
      verified: auction?.seller?.verified ?? true,
      city: auction?.seller?.city,
      contactMasked: checkout.sellerContactMasked ?? '—',
    },
    item: {
      id: auction?.id ?? win.auctionId,
      type: 'AUCTION',
      title: auction?.title,
      image: auction?.images?.[0],
      qty: 1,
      finalBidXAF: win.finalBidXAF,
    },
    pricing: {
      subtotalXAF: win.payment?.hammerPriceXAF ?? win.finalBidXAF,
      escrowFeeXAF: win.payment?.buyerPremiumXAF ?? 0,
      serviceFeeXAF: win.payment?.serviceFeeXAF ?? 0,
      centreHandlingFeeXAF: win.payment?.centreHandlingFeeXAF ?? 0,
      discountXAF: 0,
      totalXAF: checkout.totalDueXAF ?? win.payment?.totalDueXAF ?? win.finalBidXAF,
    },
    pickup: {
      hubId: resolvedHub?.id ?? checkout.chosenHubId ?? checkout.lastHubId ?? '',
      hubName: resolvedHub?.label ?? checkout.pickupWindowLabel,
      address: resolvedHub?.address ?? '',
      hours: resolvedHub?.hours ?? '',
      etaWindow: resolvedHub?.etaLabel ?? checkout.pickupWindowLabel ?? '',
      pickupCode,
    },
    qrCodePayload,
    notes: win.policyNotes ?? [],
  };
};
