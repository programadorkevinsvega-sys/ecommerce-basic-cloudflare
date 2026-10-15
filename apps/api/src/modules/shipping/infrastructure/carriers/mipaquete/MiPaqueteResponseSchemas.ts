import { z } from 'zod';

const CarrierAmount = z.number().finite().nonnegative();
const Text = z.string().trim().min(1).max(500);
const HttpsUrl = z.string().url().refine((value) => {
  const url = new URL(value);
  const host = url.hostname.toLowerCase();
  return url.protocol === 'https:' && (host.endsWith('.mipaquete.com') || host.endsWith('.amazonaws.com'));
});

export const MiPaqueteQuoteSchema = z.array(z.object({
  id: Text,
  deliveryCompanyId: Text,
  deliveryCompanyName: Text,
  shippingCost: CarrierAmount,
  collectionCommissionWithRate: CarrierAmount.nullable().optional(),
  collectionCommissionWithOutRate: CarrierAmount.nullable().optional(),
  shippingTime: CarrierAmount,
}).passthrough()).max(50);

export const MiPaqueteCreateSchema = z.object({
  code: z.union([z.string(), z.number()]).optional(),
  mpCode: z.union([z.string(), z.number()]).optional(),
  _id: z.string().optional(),
  guideNumber: z.union([z.string(), z.number()]).optional(),
  pdfGuide: z.array(HttpsUrl).max(5).optional(),
  pickupCode: z.union([z.string(), z.number()]).optional(),
  tracking: z.array(z.object({ updateState: Text, date: z.string().optional() }).passthrough()).max(100).optional(),
}).passthrough();

export const MiPaqueteSendingsSchema = z.object({
  sendings: z.array(z.object({
    _id: z.string().optional(),
    'Código mipaquete': z.union([z.string(), z.number()]),
    'Número de Guía': z.union([z.string(), z.number()]).optional(),
    'Transportadora': z.string().optional(),
    'Estado actual del envío': z.string().optional(),
    tracking: z.array(z.object({ updateState: z.string(), date: z.string().optional() }).passthrough()).optional(),
    pdfGuide: z.array(HttpsUrl).optional(),
  }).passthrough()).max(100),
}).passthrough();
