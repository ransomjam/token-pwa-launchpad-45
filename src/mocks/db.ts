import lanesSeed from './seeds/lanes.json';
import pickupsSeed from './seeds/pickupPoints.json';
import usersSeed from './seeds/users.json';
import listingsSeed from './seeds/listings.json';
import ordersSeed from './seeds/orders.json';
import { nanoid } from 'nanoid';
import type { Lane, Listing, Order, PickupPoint, Importer } from '@/types';

export const db = {
  lanes: lanesSeed as Lane[],
  pickupPoints: pickupsSeed as PickupPoint[],
  users: usersSeed as any[],
  listings: listingsSeed as Listing[],
  orders: ordersSeed as Order[],
  importers(): Importer[] {
    return this.users
      .filter(u => u.role === 'importer')
      .map(u => ({
        id: u.id,
        displayName: u.displayName,
        verified: !!u.verified,
        score: u.score ?? 80
      }));
  },
  createOrder(input: Partial<Order>): Order {
    const id = input.id ?? `ord_${nanoid(6)}`;
    const order: Order = {
      id,
      listingId: input.listingId!,
      buyerId: input.buyerId!,
      qty: input.qty ?? 1,
      pickupPointId: input.pickupPointId!,
      status: 'PENDING_PAYMENT',
      milestones: [
        { code: 'POOL_LOCKED', at: null },
        { code: 'SUPPLIER_PAID', at: null },
        { code: 'EXPORTED', at: null },
        { code: 'ARRIVED', at: null },
        { code: 'COLLECTED', at: null }
      ],
      deadline: input.deadline ?? new Date(Date.now() + 12 * 24 * 3600 * 1000).toISOString(),
      escrowHeld: false,
      evidence: {},
      canRefund: false,
      canDispute: false,
      createdAt: new Date().toISOString()
    };
    this.orders.unshift(order);
    return order;
  }
};