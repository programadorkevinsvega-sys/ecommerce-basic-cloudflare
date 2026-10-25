import { Hono } from 'hono';
import { z } from 'zod';
import { Env } from '../../../platform/Env.js';
import { PaymentsGateway } from '../../gateways/payments/PaymentsGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { processOrderPaymentSuccess } from './processOrderPaymentSuccess.js';
import { isFactusCustomerEmailEnabled } from './isFactusCustomerEmailEnabled.js';

type PaymentRouteDependencies = { paymentsGateway: PaymentsGateway; ordersGateway: OrdersGateway; identityGateway: IdentityGateway; realtimeGateway: RealtimeGateway; inventoryGateway: InventoryGateway; invoicingGateway: InvoicingGateway; notificationsGateway: NotificationsGateway; auditGateway: AuditGateway; settingsGateway: SettingsGateway };

export function registerAdminPaymentRoutes(app: Hono<{ Bindings: Env }>, d: PaymentRouteDependencies): void {
  app.get('/api/v1/admin/payments/cod/local-deliveries', async (c) => {
    const token = getAdminToken(c.req.header('authorization'), c.req.header('cookie'));
    if (!token) return c.json({ error: 'No autorizado' }, 401);
    const admin = await d.identityGateway.validateSession(token);
    if (admin?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
    if (!admin.permissions.some((p) => p === '*' || p === 'payments:*' || p === 'payments:collect')) return c.json({ error: 'Permiso insuficiente' }, 403);
    const page = Number(c.req.query('page') || 1); const pageSize = Number(c.req.query('pageSize') || 25);
    if (!Number.isSafeInteger(page) || page < 1 || !Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) return c.json({ error: 'Paginación inválida' }, 400);
    const [items, total] = await Promise.all([d.ordersGateway.listLocalCodCollectionCandidates(pageSize, (page - 1) * pageSize), d.ordersGateway.countLocalCodCollectionCandidates()]);
    return c.json({ success: true, items, page, pageSize, total, hasMore: page * pageSize < total });
  });

  app.post('/api/v1/admin/payments/cod/collect', async (c) => {
    const token = getAdminToken(c.req.header('authorization'), c.req.header('cookie'));
    if (!token) return c.json({ error: 'No autorizado' }, 401);
    const admin = await d.identityGateway.validateSession(token);
    if (admin?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
    if (!admin.permissions.some((p) => p === '*' || p === 'payments:*' || p === 'payments:collect')) return c.json({ error: 'Permiso insuficiente' }, 403);
    const body = await c.req.json();
    const order = typeof body.orderId === 'string' ? await d.ordersGateway.getOrder(body.orderId) : null;
    if (!order || order.paymentMethod !== 'cash_on_delivery' || order.paymentStatus !== 'pending' || order.status !== 'delivered' || order.shippingFulfillmentMethod !== 'merchant_local') return c.json({ error: 'Selecciona una entrega local contra entrega marcada como entregada y aún pendiente de recaudo.' }, 409);
    const expectedCashAmount = Math.round(order.totalCents / 100) * 100;
    if (!Number.isSafeInteger(body.amountInCents) || body.amountInCents !== expectedCashAmount) return c.json({ error: 'El monto recibido debe coincidir con el total del pedido, redondeado al peso colombiano.' }, 400);
    const receiptNumber = typeof body.receiptNumber === 'string' && body.receiptNumber.trim()
      ? body.receiptNumber.trim().slice(0, 120) : `LOCAL-${order.id.slice(-8).toUpperCase()}`;
    const cod = await d.paymentsGateway.recordCodCollection({ orderId: order.id, amountInCents: body.amountInCents, collectedBy: admin.actorId, receiptNumber, notes: body.notes });
    await d.ordersGateway.updateOrderStatus({ orderId: order.id, status: 'delivered', paymentStatus: 'collected', note: `Recaudo contra entrega registrado por ${admin.actorId}`, actor: admin.actorId });
    await processOrderPaymentSuccess({ orderId: order.id, traceId: (c.get('traceContext') as { traceId?: string } | undefined)?.traceId || 'unknown', paymentMethod: 'cash_on_delivery', paymentReference: receiptNumber, factusCustomerEmailEnabled: isFactusCustomerEmailEnabled(c.env), actor: admin.actorId, ordersGateway: d.ordersGateway, inventoryGateway: d.inventoryGateway, invoicingGateway: d.invoicingGateway, notificationsGateway: d.notificationsGateway, auditGateway: d.auditGateway, realtimeGateway: d.realtimeGateway, settingsGateway: d.settingsGateway });
    return c.json({ success: true, collection: cod.toJSON() });
  });

  app.get('/api/v1/admin/payments', async (c) => {
    const token = getAdminToken(c.req.header('authorization'), c.req.header('cookie'));
    if (!token) return c.json({ error: 'No autorizado' }, 401);
    const admin = await d.identityGateway.validateSession(token);
    if (admin?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
    if (!admin.permissions.some((p) => p === '*' || p === 'payments:*' || p === 'payments:read')) return c.json({ error: 'Permiso insuficiente' }, 403);
    const params = paymentPages.safeParse({
      pageSize: c.req.query('pageSize') || '25',
      transactionsPage: c.req.query('transactionsPage') || '1',
      collectionsPage: c.req.query('collectionsPage') || '1',
      settlementsPage: c.req.query('settlementsPage') || '1',
      q: c.req.query('q') || undefined,
    });
    if (!params.success) return c.json({ error: 'Filtros o paginación inválidos' }, 400);
    const { pageSize, q } = params.data;
    const txOffset = (params.data.transactionsPage - 1) * pageSize;
    const collectionOffset = (params.data.collectionsPage - 1) * pageSize;
    const settlementOffset = (params.data.settlementsPage - 1) * pageSize;
    const [transactions, transactionTotal, collections, collectionTotal, settlementCosts, settlementTotal] = await Promise.all([
      d.paymentsGateway.listTransactions(pageSize, txOffset, q), d.paymentsGateway.countTransactions(q),
      d.paymentsGateway.listCodCollections(pageSize, collectionOffset), d.paymentsGateway.countCodCollections(),
      d.paymentsGateway.listSettlementCosts(pageSize, settlementOffset), d.paymentsGateway.countSettlementCosts(),
    ]);
    const details = await Promise.all(transactions.map(async (transaction) => {
      const [order, invoice] = await Promise.all([
        d.ordersGateway.getOrder(transaction.orderId), d.invoicingGateway.getInvoice({ orderId: transaction.orderId }),
      ]);
      return { orderId: transaction.orderId, order: order ? { customerName: order.customerName, customerEmail: order.customerEmail } : null,
        invoice: invoice ? { invoiceNumber: invoice.invoiceNumber, customerName: invoice.customerName, customerEmail: invoice.customerEmail } : null };
    }));
    return c.json({ success: true,
      transactions: { items: transactions.map((tx) => tx.toJSON()), page: params.data.transactionsPage, pageSize, total: transactionTotal, hasMore: txOffset + transactions.length < transactionTotal },
      collections: { items: collections.map((row) => row.toJSON()), page: params.data.collectionsPage, pageSize, total: collectionTotal, hasMore: collectionOffset + collections.length < collectionTotal },
      settlementCosts: { items: settlementCosts, page: params.data.settlementsPage, pageSize, total: settlementTotal, hasMore: settlementOffset + settlementCosts.length < settlementTotal },
      details,
    });
  });

  app.post('/api/v1/admin/payments/:orderId/settlement', async (c) => {
    const token = getAdminToken(c.req.header('authorization'), c.req.header('cookie'));
    if (!token) return c.json({ error: 'No autorizado' }, 401);
    const admin = await d.identityGateway.validateSession(token);
    if (admin?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
    if (!admin.permissions.some((p) => p === '*' || p === 'payments:*' || p === 'payments:edit')) return c.json({ error: 'Permiso insuficiente' }, 403);
    const orderId = c.req.param('orderId');
    const order = await d.ordersGateway.getOrder(orderId);
    if (!order || order.paymentMethod !== 'wompi' || order.paymentStatus !== 'approved') return c.json({ error: 'Pedido Wompi aprobado no encontrado' }, 404);
    const existing = (await d.paymentsGateway.listSettlementCosts(1, 0, orderId)).find((row) => row.orderId === orderId);
    if (existing) return c.json({ error: 'La conciliación ya existe; registra una corrección para conservar el historial' }, 409);
    let body: Record<string, unknown>;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Datos de liquidación inválidos' }, 400); }
    if (!Number.isSafeInteger(body.actualFeeCents) || typeof body.reportReference !== 'string') return c.json({ error: 'Importe y referencia del reporte son requeridos' }, 400);
    try {
      await d.paymentsGateway.recordSettlementCost({ orderId, actualFeeCents: body.actualFeeCents as number, estimatedFeeCents: order.estimatedPaymentFeeCents, reportReference: body.reportReference, recordedBy: admin.actorId });
      const varianceCents = (body.actualFeeCents as number) - order.estimatedPaymentFeeCents;
      await d.auditGateway.record({ actorId: admin.actorId, actorType: 'admin', action: 'payments.settlement_cost.recorded', entityType: 'order', entityId: orderId, changes: { actualFeeCents: body.actualFeeCents, estimateCents: order.estimatedPaymentFeeCents, varianceCents } });
      return c.json({ success: true, estimateCents: order.estimatedPaymentFeeCents, actualFeeCents: body.actualFeeCents, varianceCents });
    } catch { return c.json({ error: 'No fue posible registrar la liquidación' }, 400); }
  });

  app.post('/api/v1/admin/payments/:orderId/settlement/corrections', async (c) => {
    const token = getAdminToken(c.req.header('authorization'), c.req.header('cookie'));
    if (!token) return c.json({ error: 'No autorizado' }, 401);
    const admin = await d.identityGateway.validateSession(token);
    if (admin?.actorType !== 'admin') return c.json({ error: 'Token inválido' }, 401);
    if (!admin.permissions.some((p) => p === '*' || p === 'payments:*' || p === 'payments:edit')) return c.json({ error: 'Permiso insuficiente' }, 403);
    const orderId = c.req.param('orderId');
    const order = await d.ordersGateway.getOrder(orderId);
    if (!order || order.paymentMethod !== 'wompi' || order.paymentStatus !== 'approved') return c.json({ error: 'Pedido Wompi aprobado no encontrado' }, 404);
    let body: Record<string, unknown>;
    try { body = await c.req.json(); } catch { return c.json({ error: 'Datos de corrección inválidos' }, 400); }
    if (!Number.isSafeInteger(body.actualFeeCents) || typeof body.reportReference !== 'string' || typeof body.reason !== 'string') return c.json({ error: 'Comisión, referencia y motivo son requeridos' }, 400);
    const previous = (await d.paymentsGateway.listSettlementCosts(1, 0, orderId)).find((row) => row.orderId === orderId);
    if (!previous) return c.json({ error: 'No existe una conciliación para corregir' }, 404);
    try {
      await d.paymentsGateway.recordSettlementCorrection({ orderId, actualFeeCents: body.actualFeeCents as number, reportReference: body.reportReference, reason: body.reason, recordedBy: admin.actorId });
      const varianceCents = (body.actualFeeCents as number) - previous.estimatedFeeCents;
      await d.auditGateway.record({ actorId: admin.actorId, actorType: 'admin', action: 'payments.settlement_cost.corrected', entityType: 'order', entityId: orderId, changes: { previousActualFeeCents: previous.actualFeeCents, actualFeeCents: body.actualFeeCents, reportReference: body.reportReference, reason: body.reason, varianceCents } });
      return c.json({ success: true, estimateCents: previous.estimatedFeeCents, previousActualFeeCents: previous.actualFeeCents, actualFeeCents: body.actualFeeCents, varianceCents });
    } catch { return c.json({ error: 'No fue posible guardar la corrección' }, 400); }
  });
}

const paymentPages = z.object({
  pageSize: z.coerce.number().int().min(1).max(50),
  transactionsPage: z.coerce.number().int().min(1).max(1_000_000),
  collectionsPage: z.coerce.number().int().min(1).max(1_000_000),
  settlementsPage: z.coerce.number().int().min(1).max(1_000_000),
  q: z.string().trim().max(120).optional(),
}).strict();

function getAdminToken(authorization?: string, cookies?: string): string | null {
  if (authorization?.startsWith('Bearer ')) return authorization.slice(7).trim();
  return cookies?.match(/(?:^|;\s*)__Host-admin-session=([^;]+)/)?.[1] ?? null;
}
