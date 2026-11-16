import { describe, expect, it, vi } from 'vitest';
import { Hono } from 'hono';
import { MiPaqueteShipmentController } from '../src/bff/controllers/shipping/MiPaqueteShipmentController.js';

describe('admin MiPaquete shipment lookup by order', () => {
  it('requires an authenticated shipping reader and returns the shipment separately', async () => {
    const shipment = { id: 'shipment-1', orderId: 'ord-12345678', status: 'creation_pending' };
    const identity = { validateSession: vi.fn().mockResolvedValue({
      actorId: 'admin-1', actorType: 'admin', permissions: ['shipping:read'], mfaEnabled: true,
    }) };
    const shipping = { getCarrierShipmentForOrder: vi.fn().mockResolvedValue(shipment) };
    const app = new Hono();
    app.route('/', MiPaqueteShipmentController.createRoutes({
      identity, shipping,
    } as never));
    const path = '/api/v1/admin/shipping/mipaquete/orders/ord-12345678';

    expect((await app.request(path)).status).toBe(401);
    const response = await app.request(path, { headers: { cookie: '__Host-admin-session=session' } });

    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(await response.json()).toMatchObject({ success: true, shipment });
    expect(shipping.getCarrierShipmentForOrder).toHaveBeenCalledWith('ord-12345678');
  });

  it('rejects invalid order identifiers before reading shipping data', async () => {
    const identity = { validateSession: vi.fn().mockResolvedValue({
      actorId: 'admin-1', actorType: 'admin', permissions: ['shipping:read'], mfaEnabled: true,
    }) };
    const shipping = { getCarrierShipmentForOrder: vi.fn() };
    const app = new Hono();
    app.route('/', MiPaqueteShipmentController.createRoutes({
      identity, shipping,
    } as never));

    const response = await app.request('/api/v1/admin/shipping/mipaquete/orders/x', {
      headers: { cookie: '__Host-admin-session=session' },
    });

    expect(response.status).toBe(400);
    expect(shipping.getCarrierShipmentForOrder).not.toHaveBeenCalled();
  });
});
