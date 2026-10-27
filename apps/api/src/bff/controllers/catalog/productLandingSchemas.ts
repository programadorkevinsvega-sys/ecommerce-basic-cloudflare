import { z } from 'zod';

const benefitSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().max(240),
}).strict();

const faqSchema = z.object({
  question: z.string().trim().min(1).max(180),
  answer: z.string().trim().min(1).max(800),
}).strict();

export const saveProductLandingSchema = z.object({
  enabled: z.boolean(),
  templateKey: z.enum(['standard', 'conversion', 'launch']),
  eyebrow: z.string().max(80).default(''),
  headline: z.string().max(160).default(''),
  subtitle: z.string().max(400).default(''),
  ctaLabel: z.string().trim().min(1).max(40).default('Comprar ahora'),
  benefits: z.array(benefitSchema).max(6).default([]),
  faqs: z.array(faqSchema).max(10).default([]),
  sections: z.array(z.enum(['benefits', 'specifications', 'guides', 'reviews', 'faq', 'related'])).max(6),
}).strict();

export type SaveProductLandingBody = z.infer<typeof saveProductLandingSchema>;
