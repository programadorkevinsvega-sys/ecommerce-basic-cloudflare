import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().trim().min(1).max(120), taxId: z.string().trim().max(40).optional(),
  email: z.string().email().max(200).optional(), phone: z.string().trim().max(40).optional(),
  websiteUrl: z.string().url().max(500).refine((url) => url.startsWith('https://'), 'El sitio debe usar HTTPS').optional(), notes: z.string().max(1000).optional(),
  status: z.enum(['active', 'inactive']).default('active'),
}).strict();

export const createVariantSchema = z.object({
  productId: z.string().uuid(), name: z.string().trim().min(1).max(120),
  sku: z.string().trim().min(1).max(60), options: z.record(z.string().max(100)).default({}),
  priceInCents: z.number().int().nonnegative().optional(), stockQuantity: z.number().int().nonnegative(),
  status: z.enum(['active', 'inactive']).default('active'),
}).strict();
