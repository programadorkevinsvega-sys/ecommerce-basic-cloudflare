import { z } from 'zod';

const numberingRangeSchema = z.object({
  id: z.union([z.string().min(1).max(40), z.number().int().positive()]),
  document: z.union([z.string().min(1).max(120), z.number().int()]),
  document_name: z.string().max(120).optional(),
  prefix: z.string().min(1).max(20),
  current: z.union([z.string().max(40), z.number().int()]),
  from: z.coerce.number().int().nonnegative(),
  to: z.coerce.number().int().positive(),
  resolution_number: z.union([z.string().max(50), z.number().int()]).optional(),
  start_date: z.string().max(30).nullable().optional(),
  end_date: z.string().max(30).nullable().optional(),
  is_expired: z.union([z.boolean(), z.number().int()]).optional(),
}).passthrough();

const responseSchema = z.object({
  data: z.array(numberingRangeSchema),
  pagination: z.object({ last_page: z.coerce.number().int().min(1).max(20) }).passthrough().optional(),
}).passthrough();

export function parseFactusNumberingRangePage(input: unknown) {
  const parsed = responseSchema.safeParse(input);
  if (!parsed.success) throw new Error('FACTUS_NUMBERING_RANGES_INVALID_RESPONSE');
  return parsed.data;
}
