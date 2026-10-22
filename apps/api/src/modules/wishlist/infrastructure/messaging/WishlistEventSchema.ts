import { z } from 'zod';

export const wishlistItemEventV1Schema = z.object({
  customerId: z.string().min(1).max(128),
  productId: z.string().min(1).max(128),
  action: z.enum(['added', 'removed']),
  occurredAt: z.string().datetime(),
}).strict();

export type WishlistItemEventV1 = z.infer<typeof wishlistItemEventV1Schema>;