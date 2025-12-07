const STORAGE_KEY = 'pl.demo.invoices';

export const INVOICE_UPDATED_EVENT = 'pl.demo.invoice.updated';

const readStoredInvoices = () => {
  if (typeof window === 'undefined') return [];
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (Array.isArray(parsed?.invoices)) return parsed.invoices;
  } catch (error) {
    console.warn('Failed to parse stored invoices', error);
  }
  return [];
};

const writeStoredInvoices = invoices => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ invoices }));
  } catch (error) {
    console.warn('Failed to persist stored invoices', error);
  }
};

const cloneInvoice = invoice => JSON.parse(JSON.stringify(invoice));

export const listStoredInvoices = () => readStoredInvoices();

export const getStoredInvoiceByNo = invoiceNo => {
  if (!invoiceNo) return null;
  return readStoredInvoices().find(invoice => invoice.invoiceNo === invoiceNo) ?? null;
};

export const findStoredInvoiceByOrderId = orderId => {
  if (!orderId) return null;
  return readStoredInvoices().find(invoice => invoice.context?.orderId === orderId) ?? null;
};

export const saveStoredInvoice = invoice => {
  if (typeof window === 'undefined' || !invoice) return invoice;
  const invoices = readStoredInvoices();
  const payload = cloneInvoice(invoice);
  const index = payload.invoiceNo ? invoices.findIndex(item => item.invoiceNo === payload.invoiceNo) : -1;
  if (index >= 0) {
    invoices[index] = { ...invoices[index], ...payload };
  } else {
    invoices.push(payload);
  }
  writeStoredInvoices(invoices);
  window.dispatchEvent(new CustomEvent(INVOICE_UPDATED_EVENT, { detail: { invoiceNo: payload.invoiceNo } }));
  return payload;
};

export const DEMO_INVOICE = {
  invoiceNo: "INV-20251002-7G5Q",
  orderId: "ORD_7J39K2",
  paymentStatus: "PAID",
  escrowStatus: "HELD",
  currency: "XAF",
  createdAt: "2025-10-02T10:12:00Z",
  wonAt: "2025-10-02T09:45:12Z",
  paidAt: "2025-10-02T10:11:03Z",
  pickupSelectedAt: "2025-10-02T10:12:18Z",
  buyer: {
    name: "Nadege A.",
    phoneMasked: "+237 •••• •• 321",
    emailMasked: "nad•••@mail.com",
  },
  seller: {
    storeName: "Nelly Stores",
    verified: true,
    city: "Douala",
    contactMasked: "+237 •••• •• 210",
  },
  item: {
    id: "auc_seed_1",
    type: "AUCTION",
    title: "Anker 65W GaN Charger",
    image: "/demo/auc_anker1.jpg",
    qty: 1,
    finalBidXAF: 128500,
  },
  pricing: {
    subtotalXAF: 128500,
    escrowFeeXAF: 0,
    serviceFeeXAF: 1000,
    discountXAF: 0,
    totalXAF: 129500,
  },
  pickup: {
    hubId: "HUB_AKWA",
    hubName: "Akwa Pickup Hub",
    address: "Boulevard de la Liberté, Douala",
    hours: "Mon–Sat 9:00–18:00",
    etaWindow: "10–14 days",
    pickupCode: "7421",
  },
  qrCodePayload: {
    orderId: "ORD_7J39K2",
    invoiceNo: "INV-20251002-7G5Q",
    pickupCode: "7421",
    hubId: "HUB_AKWA",
  },
  notes: [
    "Funds held in escrow. Released on collection.",
    "Auto-refund if late beyond ETA window.",
  ],
};

export function getInvoiceByNo(invoiceNo, appState) {
  const stored = getStoredInvoiceByNo(invoiceNo);
  if (stored) return stored;
  const storedFallback = listStoredInvoices().find(invoice => !invoiceNo || !invoice.invoiceNo);
  if (storedFallback && (!invoiceNo || !storedFallback.invoiceNo || storedFallback.invoiceNo === invoiceNo)) {
    return storedFallback;
  }
  const fromStore = appState?.invoices?.find(invoice => invoice.invoiceNo === invoiceNo);
  if (fromStore) return fromStore;
  if (!invoiceNo || invoiceNo === DEMO_INVOICE.invoiceNo) return DEMO_INVOICE;
  return { ...DEMO_INVOICE, invoiceNo };
}
