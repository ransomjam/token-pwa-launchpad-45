import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  BellRing,
  Camera,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Gavel,
  HandCoins,
  Handshake,
  MapPin,
  PackageCheck,
  QrCode,
  ShieldCheck,
  Smartphone,
  TimerReset,
  Truck,
  UserCheck,
  Warehouse,
} from "lucide-react";

const mockAuction = {
  listing: "Lot #27 · DJI Mavic 3 Cine Combo",
  hammerPriceXaf: 1180000,
  minIncrementXaf: 2000,
  buyerPremiumPct: 7.5,
  serviceFeeXaf: 3500,
  winner: "Clarisse T.",
  seller: "SkyLogix Imports",
  reserveMet: true,
  dropOffDeadlineHours: 48,
  pickupWindowDays: 5,
  autoReturnDays: "10–14",
  pickupCentre: {
    name: "Douala Bonapriso Hub",
    address: "42 Rue Koloko, Bonapriso, Douala",
    hours: "Mon–Sat · 08:30 – 18:30",
    contact: "+237 653 151 930",
    mapLabel: "View on Map",
  },
  codes: {
    dropOff: "GX7-2L9-Q",
    pickup: "A93 562",
  },
};

const flowStages = [
  {
    title: "Confirm Bid → Winner",
    state: "WON",
    accent: "from-primary/20 via-primary/10 to-blue/10",
    highlights: [
      {
        icon: Gavel,
        label: "Bid confirmation modal",
        description:
          "Shows hammer price, +2 000 XAF minimum increment, buyer premium and service fees before the bidder commits.",
      },
      {
        icon: ShieldCheck,
        label: "Live validation checks",
        description:
          "Real-time guardrails confirm valid increments, block sellers from self-bidding, and extend the timer by 60s when a bid lands with under a minute left.",
      },
      {
        icon: BellRing,
        label: "Reserve-aware close",
        description:
          "Once the timer expires the highest valid bid wins only if the seller's reserve is satisfied—otherwise the lot is marked Unsold.",
      },
    ],
    footer: "Winner notified immediately: “You won—pay within 24h to keep it.” Seller receives: “You have a winner. Deliver to centre after payment.”",
  },
  {
    title: "Winner payment (Escrow Hold)",
    state: "AWAITING_PAYMENT → ESCROW_FUNDED",
    accent: "from-teal/20 via-primary/10 to-teal/10",
    highlights: [
      {
        icon: CreditCard,
        label: "Checkout composition",
        description:
          "Buyer pays hammer price + buyer premium + service fee and any centre handling fee. A dynamic summary keeps totals transparent.",
      },
      {
        icon: Smartphone,
        label: "MoMo USSD flow",
        description:
          "Dial *126*14*653151930*<amount># to fund the escrow wallet. Status polls confirm success before advancing.",
      },
      {
        icon: TimerReset,
        label: "24h payment window",
        description:
          "If escrow is not funded within 24 hours, the order moves to NO_PAY, applies penalties, and can trigger an optional second-chance offer.",
      },
    ],
    footer: "When payment is confirmed funds are held in escrow and the journey advances automatically.",
  },
  {
    title: "Assign Logistics Centre",
    state: "ESCROW_FUNDED → AWAITING_DROPOFF",
    accent: "from-blue/20 via-ocean/10 to-primary/10",
    highlights: [
      {
        icon: Warehouse,
        label: "Centre selection",
        description:
          "System picks the nearest certified centre to the buyer (or honours their saved preference) and shares address, hours, contact, and a 48h drop-off clock.",
      },
      {
        icon: QrCode,
        label: "Codes generated",
        description:
          "Seller receives a QR + alphanumeric drop-off code; buyer receives a QR + 6-digit pickup OTP. Both are available in-app and via email/SMS.",
      },
      {
        icon: Truck,
        label: "SLA tracking",
        description:
          "State is AWAITING_DROPOFF. Automated reminders kick in as the 48h window nears expiry; if the seller misses it the order flags SELLER_NO_SHOW for ops review.",
      },
    ],
    footer: "Operational dashboard surfaces upcoming drop-offs so centres can prepare space and staffing.",
  },
  {
    title: "Seller drop-off at centre",
    state: "AWAITING_DROPOFF → AT_CENTRE_INTAKE → READY_FOR_PICKUP",
    accent: "from-primary/20 via-teal/10 to-blue/10",
    highlights: [
      {
        icon: Camera,
        label: "Intake capture",
        description:
          "Centre staff scan the drop-off QR, capture photos/video, log condition notes, and assign a shelf/bin location to create the intake record.",
      },
      {
        icon: ClipboardCheck,
        label: "Centre labelling",
        description:
          "A centre label is printed and affixed to the item so back-of-house staff can locate it instantly during pickup.",
      },
      {
        icon: BellRing,
        label: "Buyer ready notification",
        description:
          "Buyer receives: “Ready for pickup at Centre X. Pickup within 5 days.” Storage fees start after day 5; auto-return triggers between days 10–14.",
      },
    ],
    footer: "Storage SLA and reminders are fully automated with escalation paths for operations.",
  },
  {
    title: "Buyer collection & on-site inspection",
    state: "READY_FOR_PICKUP → RELEASED / DISPUTE_AT_CENTRE / UNCLAIMED_RETURN",
    accent: "from-ocean/20 via-blue/10 to-primary/10",
    highlights: [
      {
        icon: UserCheck,
        label: "Pickup verification",
        description:
          "Buyer presents the QR or 6-digit OTP plus government ID. Staff verify real-name match before bringing the item to the inspection counter.",
      },
      {
        icon: Handshake,
        label: "Inspection window",
        description:
          "10–15 minutes on-site to confirm appearance and basic function per category guidelines. Staff assist and capture additional evidence if needed.",
      },
      {
        icon: HandCoins,
        label: "Outcomes & payouts",
        description:
          "Accept → handover confirmed and escrow pays seller immediately (minus seller fees). Reject → DISPUTE_AT_CENTRE for admin decision. No-show → reminders, storage fees, then UNCLAIMED_RETURN and refund minus logistics costs.",
      },
    ],
    footer: "Receipts and rating prompts fire after a successful handover; disputes route to the admin console with evidence attached.",
  },
];

const personaJourneys = [
  {
    label: "Buyer",
    accent: "from-blue to-ocean",
    experiences: [
      "Win screen with 24h payment countdown and Pay Now CTA",
      "Escrow funded confirmation + pickup centre map, hours, and OTP",
      "Ready-for-pickup push/email with QR + inspection guidelines",
      "On-site Accept or Open Dispute actions with photo upload",
      "Receipt + prompt to rate the seller once released",
    ],
  },
  {
    label: "Seller",
    accent: "from-primary to-teal",
    experiences: [
      "Alert: Awaiting buyer payment with penalties for late drop-offs",
      "Post-escrow package: centre details, drop-off QR, 48h timer",
      "Status card tracks whether intake completed and buyer notified",
      "Handover confirmation triggers immediate payout summary",
      "If buyer disputes, seller sees case updates and resolution outcome",
    ],
  },
  {
    label: "Centre Staff",
    accent: "from-teal to-primary",
    experiences: [
      "Intake queue with scan-to-intake workflow and evidence checklist",
      "Automated reminders for overdue drop-offs and uncollected items",
      "Pickup screen verifies QR/OTP, ID match, and logs inspection notes",
      "Buttons for Handover Confirmed or Open Dispute with photo capture",
      "Return logistics wizard for UNCLAIMED_RETURN or REFUNDED cases",
    ],
  },
  {
    label: "Admin",
    accent: "from-ocean to-blue",
    experiences: [
      "Dashboards highlight overdue drop-offs, unclaimed items, disputes",
      "One-click decisions for DISPUTE_AT_CENTRE: refund, partial, release",
      "Policy knob management for increments, SLAs, and fee profiles",
      "Audit trail of centre events: intake, ready, pickup, dispute, return",
      "Escrow reconciliation view showing payouts and refunds by case",
    ],
  },
];

const stateMachine = [
  {
    state: "LIVE",
    details: [
      "Bid accepted → stays LIVE; timer can extend by anti-snipe window",
      "Time up with reserve met → WON → AWAITING_PAYMENT",
      "Time up without reserve → UNSOLD",
    ],
  },
  {
    state: "AWAITING_PAYMENT",
    details: [
      "Payment within 24h → ESCROW_FUNDED",
      "Timeout → NO_PAY (penalty) and optional second-chance offer",
    ],
  },
  {
    state: "ESCROW_FUNDED",
    details: [
      "Assign centre → AWAITING_DROPOFF",
      "Generate drop-off & pickup codes + share logistics pack",
    ],
  },
  {
    state: "AT CENTRE",
    details: [
      "Seller drop → AT_CENTRE_INTAKE",
      "Intake complete → READY_FOR_PICKUP",
      "Late seller → SELLER_NO_SHOW after grace (admin resolution)",
    ],
  },
  {
    state: "PICKUP",
    details: [
      "Buyer accepts → RELEASED (escrow pays seller)",
      "Buyer disputes → DISPUTE_AT_CENTRE → RESOLVED_*",
      "Buyer no-show → STORAGE_FEES (optional) → UNCLAIMED_RETURN → RETURNED_TO_SELLER → REFUND_MINUS_FEES",
    ],
  },
];

const policyKnobs = [
  { label: "Bid increment", value: "2 000 XAF" },
  { label: "Anti-snipe extension", value: "+60s when < 60s remaining" },
  { label: "Payment window", value: "24 hours" },
  { label: "Seller drop-off window", value: "48 hours" },
  { label: "Free pickup window", value: "5 days" },
  { label: "Auto-return", value: "Day 10–14" },
  { label: "Inspection time", value: "10–15 minutes" },
  { label: "Dispute evidence", value: "Mandatory photos + staff note" },
];

const centreEvents = [
  { code: "centre_intake", description: "Seller checked in; intake record with condition media" },
  { code: "centre_ready", description: "Item staged and buyer notified for pickup" },
  { code: "centre_pickup_verified", description: "Buyer identity verified and handover confirmed" },
  { code: "centre_dispute_opened", description: "Buyer rejected item; dispute created with evidence" },
  { code: "centre_return_initiated", description: "Item routed back to seller after no-show or refund" },
];

const dataFields = [
  "dropoff_code (QR + text)",
  "pickup_code (QR + text)",
  "pickup_otp (6-digit)",
  "centre.id, name, address, hours, contact, mapPin",
  "Payout trigger fires on centre_pickup_verified",
];

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "XAF",
  maximumFractionDigits: 0,
});

const AuctionFulfillmentFlow = () => {
  const feesTotal = Math.round(
    mockAuction.hammerPriceXaf * (mockAuction.buyerPremiumPct / 100) + mockAuction.serviceFeeXaf,
  );

  return (
    <div className="min-h-dvh bg-background pb-20">
      <div className="mx-auto flex max-w-6xl flex-col gap-12 px-4 pb-10 pt-12 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-primary via-teal to-blue text-white shadow-lux">
          <div className="pointer-events-none absolute -right-24 top-0 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -left-16 bottom-0 h-72 w-72 rounded-full bg-white/20 blur-3xl" />
          <div className="relative z-10 grid gap-8 px-8 py-10 md:grid-cols-5 md:items-center md:gap-10 md:px-12 md:py-14">
            <div className="md:col-span-3 space-y-5">
              <Badge className="w-fit border-white/30 bg-white/20 text-xs uppercase tracking-[0.2em] text-white">
                Post-win operations
              </Badge>
              <h1 className="text-3xl font-semibold leading-tight md:text-4xl">
                Auction fulfilment journey
              </h1>
              <p className="max-w-xl text-sm text-white/80 md:text-base">
                Demo view showing exactly what happens once a bid is confirmed—from the anti-snipe protected win moment all the way to payout or dispute resolution. Designed with our launchpad palette and production UX components.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/30 bg-white/15 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-white/70">Winning lot</p>
                  <p className="text-base font-semibold md:text-lg">{mockAuction.listing}</p>
                </div>
                <div className="rounded-2xl border border-white/30 bg-white/15 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-white/70">Hammer price</p>
                  <p className="text-base font-semibold md:text-lg">{currencyFormatter.format(mockAuction.hammerPriceXaf)}</p>
                  <p className="text-xs text-white/70">
                    Fees due: {currencyFormatter.format(feesTotal)} (premium {mockAuction.buyerPremiumPct}% + service {currencyFormatter.format(mockAuction.serviceFeeXaf)})
                  </p>
                </div>
              </div>
            </div>
            <div className="md:col-span-2 space-y-4 rounded-3xl border border-white/30 bg-white/10 p-6 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/70">Key identifiers</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/70">Winner</span>
                  <span className="font-semibold">{mockAuction.winner}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/70">Seller</span>
                  <span className="font-semibold">{mockAuction.seller}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/70">Drop-off code</span>
                  <span className="font-mono text-sm font-semibold tracking-wider">{mockAuction.codes.dropOff}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-white/70">Pickup OTP</span>
                  <span className="font-mono text-sm font-semibold tracking-wider">{mockAuction.codes.pickup}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-foreground">Operational timeline</h2>
            <Separator className="hidden flex-1 sm:block" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            {flowStages.map(stage => (
              <Card key={stage.title} className="border-border/60 bg-card/80 shadow-card">
                <CardHeader className="space-y-3">
                  <Badge className="w-fit border-primary/30 bg-gradient-to-r from-primary/90 to-blue/80 text-primary-foreground shadow-glow">
                    {stage.state}
                  </Badge>
                  <CardTitle className="text-xl font-semibold text-foreground">{stage.title}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    {stage.footer}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {stage.highlights.map(point => (
                    <div key={point.label} className="flex gap-4 rounded-2xl border border-border/60 bg-background/70 p-4">
                      <div className="flex h-11 w-11 flex-none items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-blue/20 text-primary">
                        <point.icon className="h-5 w-5" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-foreground">{point.label}</p>
                        <p className="text-sm text-muted-foreground">{point.description}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-foreground">What each side experiences</h2>
            <Separator className="hidden flex-1 sm:block" />
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {personaJourneys.map(persona => (
              <Card key={persona.label} className="border-border/70 bg-card/80">
                <CardHeader className="space-y-4">
                  <div className={`inline-flex items-center gap-2 rounded-full border border-primary/30 bg-gradient-to-r ${persona.accent} px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow-glow`}>
                    {persona.label}
                  </div>
                  <CardDescription className="text-sm text-muted-foreground">
                    Touchpoints surfaced in product for this persona.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3 text-sm">
                    {persona.experiences.map(item => (
                      <li key={item} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-primary" />
                        <span className="text-foreground">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-foreground">State machine overview</h2>
            <Separator className="hidden flex-1 sm:block" />
          </div>
          <Card className="border-border/70 bg-card/80">
            <CardHeader>
              <CardDescription className="text-sm text-muted-foreground">
                Reference map aligning engineering states with SLA expectations and fallback branches.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                {stateMachine.map(group => (
                  <div key={group.state} className="space-y-3 rounded-3xl border border-border/60 bg-background/70 p-5">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-primary">
                      {group.state}
                    </div>
                    <ul className="space-y-2 text-sm">
                      {group.details.map(detail => (
                        <li key={detail} className="flex items-start gap-3 text-foreground">
                          <ArrowBullet />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <Card className="border-border/70 bg-card/80 lg:col-span-2">
            <CardHeader className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Policy knobs</h3>
              <CardDescription className="text-sm text-muted-foreground">
                Adjustable defaults to tune liquidity, risk, and operational load.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                {policyKnobs.map(knob => (
                  <div key={knob.label} className="rounded-2xl border border-border/60 bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">{knob.label}</p>
                    <p className="text-sm font-semibold text-foreground">{knob.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="space-y-3">
              <h3 className="text-xl font-semibold text-foreground">Data & events to wire</h3>
              <CardDescription className="text-sm text-muted-foreground">
                Front-end demo references for engineering integration.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Centre event hooks</p>
                <ul className="space-y-2 text-sm">
                  {centreEvents.map(event => (
                    <li key={event.code} className="flex items-start gap-3 rounded-2xl border border-border/60 bg-background/70 p-3">
                      <PackageCheck className="mt-0.5 h-4 w-4 text-primary" />
                      <div>
                        <p className="font-semibold text-foreground">{event.code}</p>
                        <p className="text-xs text-muted-foreground">{event.description}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <Separator />
              <div className="space-y-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Required fields</p>
                <ul className="space-y-2 text-sm">
                  {dataFields.map(field => (
                    <li key={field} className="flex items-start gap-3 text-foreground">
                      <ArrowBullet />
                      <span>{field}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="space-y-6">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-semibold text-foreground">Pickup centre snapshot</h2>
            <Separator className="hidden flex-1 sm:block" />
          </div>
          <Card className="border-border/70 bg-card/80">
            <CardHeader className="space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-xl font-semibold text-foreground">{mockAuction.pickupCentre.name}</CardTitle>
                  <CardDescription className="text-sm text-muted-foreground">
                    Assigned immediately after escrow is funded.
                  </CardDescription>
                </div>
                <Badge className="border-primary/40 bg-primary/10 text-primary">
                  Drop-off in {mockAuction.dropOffDeadlineHours}h · Pickup within {mockAuction.pickupWindowDays}d
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4 rounded-3xl border border-border/60 bg-background/70 p-5">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{mockAuction.pickupCentre.address}</p>
                    <p className="text-xs text-muted-foreground">{mockAuction.pickupCentre.hours}</p>
                    <a href="tel:+237653151930" className="mt-2 inline-flex items-center gap-2 text-xs font-semibold text-primary">
                      <Smartphone className="h-4 w-4" />
                      {mockAuction.pickupCentre.contact}
                    </a>
                  </div>
                </div>
                <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4 text-xs text-primary">
                  <p className="font-semibold uppercase tracking-wide">Storage policy</p>
                  <p className="mt-2 text-muted-foreground">
                    Pickup within {mockAuction.pickupWindowDays} days to avoid storage fees. Day {mockAuction.autoReturnDays}: item returns to seller and buyer is refunded minus logistics and handling fees.
                  </p>
                </div>
              </div>
              <div className="space-y-4 rounded-3xl border border-border/60 bg-background/70 p-5">
                <p className="text-sm font-semibold text-foreground">On-site checklist</p>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3 text-foreground">
                    <ArrowBullet />
                    <span>Verify ID matches account real name before releasing codes.</span>
                  </li>
                  <li className="flex items-start gap-3 text-foreground">
                    <ArrowBullet />
                    <span>Guide buyer through 10–15 minute inspection window with staff assistance.</span>
                  </li>
                  <li className="flex items-start gap-3 text-foreground">
                    <ArrowBullet />
                    <span>Capture photos if buyer raises “not as described” or “damaged” issues.</span>
                  </li>
                  <li className="flex items-start gap-3 text-foreground">
                    <ArrowBullet />
                    <span>Escalate disputes to admin console with all evidence attached.</span>
                  </li>
                </ul>
                <div className="rounded-2xl border border-primary/40 bg-primary/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-primary">Payout trigger</p>
                  <p className="mt-2 text-sm text-foreground">
                    Escrow releases funds instantly when staff tap “Handover Confirmed” (centre_pickup_verified).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

const ArrowBullet = () => (
  <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-[10px] font-semibold text-primary">
    •
  </span>
);

export default AuctionFulfillmentFlow;
