export type Lane = {
  code: string;              // "GZ-DLA-AIR"
  name: string;              // "Guangzhou → Douala (Air)"
  onTimePct: number;         // 0.93
  medianDays: number;        // 12
  etaDays: { min: number; max: number };
  color: 'green' | 'amber' | 'red';
};

export type Importer = {
  id: string;
  displayName: string;
  verified: boolean;
  score: number;             // 0-100
};

export type Listing = {
  id: string;
  title: string;
  priceXAF: number;
  images: string[];
  laneCode: string;
  moq: { target: number; committed: number; lockAt: string };
  importerId: string;
  category: string;
  specs: string[];
  createdAt: string;
};

export type ListingSummary = {
  id: string;
  title: string;
  priceXAF: number;
  images: string[];
  etaDays: { min: number; max: number };
  lane: { code: string; onTimePct: number; medianDays: number };
  moq: Listing['moq'];
  importer: { id: string; displayName: string; verified: boolean };
  buyerProtection: { escrow: boolean; autoRefundOnLate: boolean };
  category: string;
  specs: string[];
  createdAt: string;
};

export type OrderStatus =
  | 'DRAFT' | 'PENDING_PAYMENT' | 'ESCROW_HELD' | 'POOL_LOCKED'
  | 'FULFILLING' | 'ARRIVED' | 'COLLECTED' | 'ESCROW_RELEASED'
  | 'CLOSED' | 'REFUNDED' | 'LATE';

export type MilestoneCode =
  | 'POOL_LOCKED' | 'SUPPLIER_PAID' | 'EXPORTED' | 'ARRIVED' | 'COLLECTED';

export type Order = {
  id: string;
  listingId: string;
  buyerId: string;
  qty: number;
  pickupPointId: string;
  status: OrderStatus;
  milestones: { code: MilestoneCode; at: string | null }[];
  deadline: string;                // when auto-refund triggers (from pool lock)
  escrowHeld: boolean;
  evidence: { awb?: string; supplierInvoice?: string; photos?: string[] };
  canRefund: boolean;
  canDispute: boolean;
  createdAt: string;
};

export type PickupPoint = {
  id: string;
  name: string;
  address: string;
  city: string;   // "Douala" | "Yaoundé" etc.
  phone?: string;
};

export type VerificationSnapshot = {
  status: 'unverified' | 'verified';
  businessName: string;
  location: string;
  fullName?: string;
  dateOfBirth?: string;
  profession?: string;
  idCardFrontUrl?: string | null;
  idCardBackUrl?: string | null;
  selfieUrl?: string | null;
};

export type Session = {
  userId: string;
  personalName: string;
  businessName: string;
  email: string;
  phone: string;
  displayName: string;
  contact: string;
  role: 'buyer' | 'importer' | 'vendor' | 'merchant';
  hasSelectedRole: boolean;
  isVerified: boolean;
  verification?: VerificationSnapshot;
  avatarUrl?: string | null;
};

export type OrderDetailResponse = {
  id: string;
  status: OrderStatus;
  countdown: { deadline: string; secondsLeft: number };
  milestones: { code: MilestoneCode; at: string | null }[];
  eligibility: { canRefund: boolean; canDispute: boolean };
  evidence?: { supplierInvoice?: string | null; awb?: string | null };
  pickupPoint?: {
    id?: string;
    name: string;
    address: string;
    city?: string;
    phone?: string | null;
  } | null;
  listing?: {
    id: string;
    title: string;
    priceXAF: number;
  } | null;
  qty?: number | null;
};
