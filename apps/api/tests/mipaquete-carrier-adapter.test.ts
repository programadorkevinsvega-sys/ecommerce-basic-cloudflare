import { describe, expect, it, vi } from 'vitest';
import { MiPaqueteApiConfig } from '../src/modules/shipping/infrastructure/carriers/mipaquete/MiPaqueteApiConfig.js';
import { MiPaqueteCarrierAdapter } from '../src/modules/shipping/infrastructure/carriers/mipaquete/MiPaqueteCarrierAdapter.js';
import { MiPaqueteHttpClient } from '../src/modules/shipping/infrastructure/carriers/mipaquete/MiPaqueteHttpClient.js';

const config: MiPaqueteApiConfig = { apiKey: 'test-secret-not-real', baseUrl: new URL('https://api-v2.mpr.mipaquete.com') };

describe('MiPaqueteCarrierAdapter', () => {
  it('maps quote response into COP carrier options', async () => {
    let sentBody: Record<string, unknown> = {};
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      sentBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return Response.json([{ id: 'q1', deliveryCompanyId: 'c1', deliveryCompanyName: 'Carrier', shippingCost: 12000, shippingTime: 60, collectionCommissionWithRate: 3000 }]);
    });
    const adapter = new MiPaqueteCarrierAdapter(new MiPaqueteHttpClient(config, fetcher as typeof fetch));
    const result = await adapter.quote({ originDaneCode: '05001000', destinationDaneCode: '11001000', widthCm: 10, lengthCm: 20, heightCm: 5, weightKg: 1, quantity: 1, declaredValueCop: 50000, cashOnDelivery: true, saleValueCop: 60000 });
    expect(result[0]).toMatchObject({ quoteId: 'q1', shippingCostCop: 12000, collectionCommissionCop: 3000 });
    expect(sentBody).toMatchObject({ saleValue: 60000, originLocationCode: '05001000' });
  });

  it('retains mpCode and emits provider pickup format without a real network call', async () => {
    let sentBody: Record<string, unknown> = {};
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      sentBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
      return Response.json({ mpCode: 98765, message: 'created' });
    });
    const adapter = new MiPaqueteCarrierAdapter(new MiPaqueteHttpClient(config, fetcher as typeof fetch));
    const party = { name: 'Tienda', surname: 'Vega', phone: '3000000000', email: 'store@example.com', address: 'Calle 1', identification: '123', identificationType: 'NIT' as const };
    const created = await adapter.create({ orderId: 'order-1', sender: party, recipient: { ...party, identificationType: 'CC' }, package: { widthCm: 10, lengthCm: 20, heightCm: 5, weightKg: 1, quantity: 1, declaredValueCop: 50000 }, originDaneCode: '05001000', destinationDaneCode: '11001000', carrierId: 'carrier-1', criterion: 'price', paymentType: 101, collectionValueCop: 0, saleValueCop: 0, requestPickup: false, description: 'Pedido' });
    expect(created.mipaqueteCode).toBe('98765');
    expect(sentBody.requestPickup).toBe(false);
    expect(sentBody.deliveryCompany).toBe('carrier-1');
    expect(sentBody).not.toHaveProperty('criteria');
  });
});
