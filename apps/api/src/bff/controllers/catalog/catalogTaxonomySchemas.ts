import { z } from 'zod';

const status = z.enum(['active', 'inactive']).optional();
const slug = z.string().trim().min(1).max(100).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional();
export const taxonomyUpdateSchemas = {
  categories: z.object({ name:z.string().trim().min(1).max(100).optional(), slug, description:z.string().max(500).optional(), parentId:z.string().nullable().optional(), status }).strict().refine((value) => Object.keys(value).length > 0),
  brands: z.object({ name:z.string().trim().min(1).max(100).optional(), slug, description:z.string().max(500).optional(), websiteUrl:z.string().url().refine((value) => value.startsWith('https://')).nullable().optional(), status }).strict().refine((value) => Object.keys(value).length > 0),
  providers: z.object({ name:z.string().trim().min(1).max(120).optional(), taxId:z.string().trim().max(40).nullable().optional(), email:z.string().email().max(200).nullable().optional(), phone:z.string().trim().max(40).nullable().optional(), websiteUrl:z.string().url().max(500).refine((value) => value.startsWith('https://')).nullable().optional(), notes:z.string().max(1000).nullable().optional(), status }).strict().refine((value) => Object.keys(value).length > 0),
  attributes: z.object({ name:z.string().trim().min(1).max(100).optional(), code:z.string().trim().min(1).max(50).regex(/^[a-z0-9_]+$/).optional(), type:z.enum(['text','select','number']).optional(), options:z.array(z.string().max(100)).max(100).optional(), status }).strict().refine((value) => Object.keys(value).length > 0),
  variants: z.object({ productId:z.string().uuid().optional(), name:z.string().trim().min(1).max(120).optional(), sku:z.string().trim().min(1).max(60).optional(), options:z.record(z.string().max(100)).optional(), priceInCents:z.number().int().nonnegative().nullable().optional(), stockQuantity:z.number().int().nonnegative().optional(), status }).strict().refine((value) => Object.keys(value).length > 0),
} as const;
