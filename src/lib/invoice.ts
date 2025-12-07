export const formatStamp = () => new Date().toISOString().slice(0, 10).replace(/-/g, '');

const randomSuffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();

export const generateOrderId = () => {
  return `ORD-${formatStamp()}-${randomSuffix()}`;
};

export const generateInvoiceNo = () => {
  return `INV-${formatStamp()}-${randomSuffix()}`;
};

export const buildPickupQrPayload = ({
  orderId,
  invoiceNo,
  pickupCode,
  hubId,
}: {
  orderId: string;
  invoiceNo: string;
  pickupCode: string;
  hubId: string;
}) => {
  const params = new URLSearchParams({
    order: orderId,
    invoice: invoiceNo,
    code: pickupCode,
    hub: hubId,
  });
  return `prolist://pickup?${params.toString()}`;
};
