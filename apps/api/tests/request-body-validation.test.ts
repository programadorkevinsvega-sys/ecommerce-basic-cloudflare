import { describe, expect, it, vi } from 'vitest';
import { InvoicingController } from '../src/bff/controllers/invoicing/InvoicingController.js';
import { RealtimeController } from '../src/bff/controllers/realtime/RealtimeController.js';

describe('bounded and strict request bodies', () => {
  it('rejects malformed, oversized, and unknown notification-read input', async () => {
    const validateSession = vi.fn(async () => ({ actorType: 'customer', actorId: 'customer-1', permissions: [] }));
    const getNotifications = vi.fn(async () => []);
    const app = RealtimeController.createRoutes(
      { getNotifications, markNotificationsRead: vi.fn() } as never,
      { validateSession } as never,
    );
    const request = (body: string) => app.request('/api/v1/realtime/notifications/read', {
      method: 'POST',
      headers: { cookie: '__Host-session=session-token', 'content-type': 'application/json' },
      body,
    });

    expect((await request('{')).status).toBe(400);
    expect((await request(JSON.stringify({ ids: ['notification-1'], unexpected: true }))).status).toBe(400);
    expect((await request(JSON.stringify({ ids: Array.from({ length: 101 }, (_, index) => `notification-${index}`) }))).status).toBe(400);
    expect(getNotifications).not.toHaveBeenCalled();
  });

  it('rejects malformed and unknown credit-note input before calling the invoicing gateway', async () => {
    const createCreditNote = vi.fn();
    const app = InvoicingController.createRoutes(
      { createCreditNote } as never,
      { validateSession: async () => ({ actorType: 'admin', actorId: 'admin-1', permissions: ['invoices:credit_note'] }) } as never,
      {} as never,
    );
    const request = (body: string) => app.request('/api/v1/admin/invoices/invoice-1/credit-notes', {
      method: 'POST',
      headers: { cookie: '__Host-admin-session=session-token', 'content-type': 'application/json' },
      body,
    });

    expect((await request('{')).status).toBe(400);
    expect((await request(JSON.stringify({
      reason: 'Corrección', amountInCents: 500, correctionConceptCode: '1', unexpected: true,
    }))).status).toBe(400);
    expect((await request(JSON.stringify({
      reason: 'x'.repeat(20_000), amountInCents: 500, correctionConceptCode: '1',
    }))).status).toBe(413);
    expect(createCreditNote).not.toHaveBeenCalled();
  });
});
