import { http, HttpResponse } from 'msw';
import { db } from './db';
import { mockNow, addMinutes } from './mockClock';
import type { Listing, Order, Session } from '@/types';
import { nanoid } from 'nanoid';

const BASE = '/api';

// Helpers
function enrichListing(listing: Listing) {
  const lane = db.lanes.find(l => l.code === listing.laneCode)!;
  const importer = db.importers().find(i => i.id === listing.importerId)!;
  return {
    id: listing.id,
    title: listing.title,
    priceXAF: listing.priceXAF,
    images: listing.images,
    etaDays: lane.etaDays,
    lane: { code: lane.code, onTimePct: lane.onTimePct, medianDays: lane.medianDays },
    moq: listing.moq,
    importer: { id: importer.id, displayName: importer.displayName, verified: importer.verified },
    buyerProtection: { escrow: true, autoRefundOnLate: true }
  };
}

function orderPayload(order: Order) {
  const listing = db.listings.find(l => l.id === order.listingId)!;
  const lane = db.lanes.find(l => l.code === listing.laneCode)!;
  const now = mockNow();
  const secondsLeft = Math.max(0, Math.floor((new Date(order.deadline).getTime() - now) / 1000));
  const eligibleLate = secondsLeft === 0 && !['REFUNDED','CLOSED'].includes(order.status);

  return {
    id: order.id,
    status: order.status,
    countdown: { deadline: order.deadline, secondsLeft },
    milestones: order.milestones,
    evidence: order.evidence,
    eligibility: {
      canRefund: order.canRefund || eligibleLate,
      canDispute: order.canDispute || ['ESCROW_HELD','POOL_LOCKED','FULFILLING','ARRIVED'].includes(order.status)
    }
  };
}

export const handlers = [
  // Session (stub)
  http.get(`${BASE}/auth/session`, () => {
    const sess: Session = { userId: 'usr_buyer_1', role: 'buyer', token: 'mock-token' };
    return HttpResponse.json(sess);
  }),

  // Listings
  http.get(`${BASE}/listings`, () => {
    const out = db.listings.map(enrichListing);
    return HttpResponse.json({ items: out });
  }),

  http.get(`${BASE}/listings/:id`, ({ params }) => {
    const l = db.listings.find(x => x.id === params.id);
    if (!l) return new HttpResponse('Not found', { status: 404 });
    return HttpResponse.json(enrichListing(l));
  }),

  // Lanes & pickups
  http.get(`${BASE}/lanes`, () => HttpResponse.json({ items: db.lanes })),
  http.get(`${BASE}/pickups`, () => HttpResponse.json({ items: db.pickupPoints })),

  // Create order → PSP redirect
  http.post(`${BASE}/orders`, async ({ request }) => {
    const body = await request.json() as { listingId: string; qty: number; pickupPointId: string; paymentMethod: string; };
    const order = db.createOrder({
      listingId: body.listingId,
      buyerId: 'usr_buyer_1',
      qty: body.qty,
      pickupPointId: body.pickupPointId
    });
    const pspRef = `psp_${nanoid(6)}`;
    return HttpResponse.json({
      orderId: order.id,
      pspRedirectUrl: `/mock/psp?ref=${pspRef}&order=${order.id}`,
      returnUrl: `/checkout/return?order=${order.id}`
    });
  }),

  // Simulate PSP verify on return
  http.post(`${BASE}/checkout/verify`, async ({ request }) => {
    const { orderId, status } = await request.json() as { orderId: string; status: 'success'|'failed'|'cancelled' };
    const ord = db.orders.find(o => o.id === orderId);
    if (!ord) return new HttpResponse('Not found', { status: 404 });
    if (status === 'success') {
      ord.status = 'ESCROW_HELD';
      ord.escrowHeld = true;
      // For demo: assume pool already locked → start deadline from now + lane ETA max
      const l = db.listings.find(l => l.id === ord.listingId)!;
      const lane = db.lanes.find(x => x.code === l.laneCode)!;
      const now = new Date(mockNow());
      const deadline = new Date(now.getTime() + lane.etaDays.max * 24 * 3600 * 1000);
      ord.milestones[0].at = now.toISOString(); // POOL_LOCKED
      ord.deadline = deadline.toISOString();
      ord.status = 'POOL_LOCKED';
    } else if (status === 'failed' || status === 'cancelled') {
      ord.status = 'DRAFT';
    }
    return HttpResponse.json({ ok: true, order: orderPayload(ord) });
  }),

  // Order read
  http.get(`${BASE}/orders/:id`, ({ params }) => {
    const ord = db.orders.find(o => o.id === params.id);
    if (!ord) return new HttpResponse('Not found', { status: 404 });
    return HttpResponse.json(orderPayload(ord));
  }),

  // Pickup confirm → schedules escrow release
  http.post(`${BASE}/orders/:id/collect`, async ({ params }) => {
    const ord = db.orders.find(o => o.id === params.id);
    if (!ord) return new HttpResponse('Not found', { status: 404 });
    ord.status = 'COLLECTED';
    ord.milestones.find(m => m.code === 'COLLECTED')!.at = new Date(mockNow()).toISOString();
    const releaseAt = new Date(mockNow() + 24 * 3600 * 1000).toISOString();
    return HttpResponse.json({ ok: true, escrowReleaseAt: releaseAt });
  }),

  // Evidence upload (mock)
  http.post(`${BASE}/shipments/:id/evidence`, async () => {
    return HttpResponse.json({ ok: true, url: `/demo/evidence_${nanoid(4)}.jpg` }, { status: 201 });
  }),

  // Dispute open (mock)
  http.post(`${BASE}/disputes`, async ({ request }) => {
    const { orderId } = await request.json() as { orderId: string; reason: string; notes?: string };
    const ord = db.orders.find(o => o.id === orderId);
    if (!ord) return new HttpResponse('Not found', { status: 404 });
    ord.canRefund = true; // simplify demo logic
    return HttpResponse.json({ ok: true, disputeId: `dsp_${nanoid(5)}` }, { status: 201 });
  }),

  // Simulate time travel for demos
  http.post(`${BASE}/admin/time/add-minutes`, async ({ request }) => {
    const { minutes } = await request.json() as { minutes: number };
    addMinutes(minutes);
    // If any order past deadline → mark late & eligible
    const now = mockNow();
    db.orders.forEach(o => {
      if (new Date(o.deadline).getTime() <= now && !['REFUNDED','CLOSED'].includes(o.status)) {
        o.status = 'LATE';
        o.canRefund = true;
      }
    });
    return HttpResponse.json({ ok: true });
  }),

  // Refund endpoint (mock)
  http.post(`${BASE}/orders/:id/refund`, ({ params }) => {
    const ord = db.orders.find(o => o.id === params.id);
    if (!ord) return new HttpResponse('Not found', { status: 404 });
    ord.status = 'REFUNDED';
    ord.canRefund = false;
    return HttpResponse.json({ ok: true });
  })
];