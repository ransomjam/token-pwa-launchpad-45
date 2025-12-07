import { generateInvoiceNo } from '@/lib/invoice';

// Demo preorder “order” object (front-end only)
export const DEMO_PREORDER_ORDER = {
  orderId: 'ORD_PRE_54XZ1',
  poolId: 'POOL_9M21',
  type: 'PREORDER',
  title: 'Mi Band 8 (Global)',
  image: '/demo/download-5.jfif',
  qty: 1,
  unitPriceXAF: 11900,
  serviceFeeXAF: 500,
  etaWindow: '14–21 days',
  importer: { name: 'TechHub CM', verified: true, city: 'Douala', contactMasked: '+237 •••• •• 210' }
};

const stamp = () => new Date().toISOString();

// Mutate an existing invoice object with preorder info (no new component)
export function applyPreorderToInvoice(pre, invoiceObj) {
  if (!invoiceObj || typeof invoiceObj !== 'object') {
    throw new Error('applyPreorderToInvoice requires an invoice object to mutate');
  }
  const qty = pre.qty || 1;
  const subtotal = pre.unitPriceXAF * qty;
  const serviceFee = pre.serviceFeeXAF || 0;
  const total = subtotal + serviceFee;

  invoiceObj.item = {
    id: pre.poolId,
    type: 'PREORDER',
    title: pre.title,
    image: pre.image,
    qty,
    finalBidXAF: undefined,            // not used for preorder
    unitPriceXAF: pre.unitPriceXAF
  };
  invoiceObj.pricing = {
    subtotalXAF: subtotal,
    escrowFeeXAF: 0,
    serviceFeeXAF: serviceFee,
    discountXAF: 0,
    totalXAF: total
  };
  invoiceObj.seller = {
    storeName: pre.importer?.name || 'Importer',
    verified: !!pre.importer?.verified,
    city: pre.importer?.city || '',
    contactMasked: pre.importer?.contactMasked || ''
  };
  invoiceObj.paymentStatus = 'PAID';
  invoiceObj.escrowStatus = 'HELD';
  invoiceObj.currency = invoiceObj.currency || 'XAF';
  const nowIso = stamp();
  invoiceObj.createdAt = invoiceObj.createdAt || nowIso;
  invoiceObj.wonAt = invoiceObj.wonAt || nowIso;
  invoiceObj.paidAt = nowIso;
  invoiceObj.pickupSelectedAt = invoiceObj.pickupSelectedAt || null;
  // Keep existing invoiceNo if present; else generate one
  invoiceObj.invoiceNo = invoiceObj.invoiceNo || generateInvoiceNo();
  invoiceObj.orderId = pre.orderId || invoiceObj.orderId || invoiceObj.invoiceNo?.replace('INV', 'ORD');
  // Update ETA & notes
  invoiceObj.pickup = invoiceObj.pickup || {};
  invoiceObj.pickup.etaWindow = pre.etaWindow || invoiceObj.pickup.etaWindow;
  // Optional: mark preorder context
  invoiceObj.context = { kind: 'PREORDER', orderId: pre.orderId, poolId: pre.poolId };
  return invoiceObj;
}
