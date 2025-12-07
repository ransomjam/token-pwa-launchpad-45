import type { Deal } from '@/lib/dealsStore';

export const buildDealInvoiceDocument = (deal: Deal) => {
  const subtotal = deal.priceXAF * deal.qty;
  const serviceFee = Math.round(subtotal * 0.03);
  const total = subtotal + serviceFee;

  return {
    invoiceNo: deal.invoiceNo ?? deal.quotationNo ?? 'Pending',
    orderId: deal.orderId ?? deal.id.toUpperCase(),
    currency: 'XAF',
    createdAt: new Date(deal.createdAt).toISOString(),
    wonAt: new Date(deal.createdAt).toISOString(),
    paidAt: new Date(deal.updatedAt).toISOString(),
    pickupSelectedAt: new Date(deal.updatedAt).toISOString(),
    paymentStatus: deal.status === 'ESCROW_HELD' || deal.status === 'READY' || deal.status === 'RELEASED' ? 'PAID' : 'PENDING',
    escrowStatus: deal.status === 'RELEASED' ? 'RELEASED' : 'HELD',
    buyer: {
      name: deal.buyerName,
      phoneMasked: deal.buyerPhone,
      emailMasked: deal.buyerEmail,
    },
    seller: {
      storeName: 'ProList Deals',
      verified: true,
      city: 'Douala',
      contactMasked: '+237 671 308 991',
    },
    item: {
      type: 'DEAL',
      title: deal.title,
      qty: deal.qty,
      unitPriceXAF: deal.priceXAF,
      finalBidXAF: deal.priceXAF,
      image: deal.imageUrls[0] ?? 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=600&q=80',
    },
    pricing: {
      subtotalXAF: subtotal,
      escrowFeeXAF: 0,
      serviceFeeXAF: serviceFee,
      discountXAF: 0,
      totalXAF: total,
      centreHandlingFeeXAF: 0,
    },
    pickup: {
      hubId: deal.pickupCenterId ?? 'hub-centre',
      hubName: deal.pickupCenterName ?? 'Pickup Hub',
      address: deal.pickupCenterAddress ?? '—',
      hours: 'Mon–Sat 9:00–18:00',
      etaWindow: 'Ready within 48h',
      pickupCode: deal.otpCode,
    },
    qrCodePayload: {
      orderId: deal.orderId ?? deal.id.toUpperCase(),
      invoiceNo: deal.invoiceNo ?? deal.quotationNo ?? deal.id,
      pickupCode: deal.otpCode,
      hubId: deal.pickupCenterId ?? 'hub-centre',
    },
    notes: deal.notes ? [deal.notes] : [],
  };
};

