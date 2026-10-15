import { Hono } from 'hono';
import { Env } from '../../../platform/Env.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { ShippingGateway } from '../../gateways/shipping/ShippingGateway.js';
import { createAuthMiddleware } from '../../middleware/AuthMiddleware.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';

export class MiPaqueteShipmentController {
  public static createRoutes(deps: { identity: IdentityGateway; orders: OrdersGateway; settings: SettingsGateway; shipping: ShippingGateway; audit: AuditGateway }): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();
    app.post('/api/v1/admin/orders/:orderId/mipaquete', createAuthMiddleware(deps.identity, 'admin', 'shipping:update'), async (c) => {
      const order = await deps.orders.getOrder(c.req.param('orderId'));
      if (!order) return c.json({ error: 'Pedido no encontrado' }, 404);
      try {
        const settings = await deps.settings.getSettings();
        const sender = party(settings.companyLegalName || settings.storeName, settings.companyNit,
          settings.supportPhone, settings.supportEmail, settings.companyAddress, 'NIT');
        const recipient = party(order.customerName, order.customerTaxId, order.customerPhone,
          order.customerEmail, order.shippingAddress.addressLine, order.customerTaxId?.length && order.customerTaxId.length > 10 ? 'NIT' : 'CC');
        const shipment = await deps.shipping.createMiPaqueteShipment({
          orderId: order.id, status: order.status, paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod, totalCents: order.totalCents,
          shippingCostCents: order.shippingCostCents, transactionFeeCents: order.transactionFeeCents,
          destinationDaneCode: `${order.shippingAddress.daneCode}000`,
          destinationAddress: order.shippingAddress.addressLine, recipient, sender,
          description: order.lines.map((line) => `${line.quantity}x ${line.productName}`).join(', ').slice(0, 200),
        });
        if (shipment.guideNumber) await deps.orders.saveOrderShippingDetails(order.id, {
          shippingCarrier: shipment.carrierName || 'MiPaquete', shippingTrackingNumber: shipment.guideNumber,
          shippingTrackingUrl: shipment.guideUrl, estimatedDeliveryDate: null,
        });
        await deps.audit.record({ actorId: String(c.get('actorId') || 'unknown'), actorType: 'admin',
          action: 'shipping.mipaquete.shipment.created_or_retrieved', entityType: 'shipping_carrier_shipment',
          entityId: shipment.id, changes: { orderId: order.id, mipaqueteCode: shipment.mipaqueteCode,
            guideNumber: shipment.guideNumber, status: shipment.status } });
        return c.json({ success: true, shipment });
      } catch (error) { return c.json({ error: safeMessage(error) }, 409); }
    });
    app.post('/api/v1/admin/shipping/mipaquete/:shipmentId/sync', createAuthMiddleware(deps.identity, 'admin', 'shipping:update'), async (c) => {
      try {
        const shipment = await deps.shipping.syncMiPaqueteShipment(c.req.param('shipmentId'));
        if (!shipment) return c.json({ error: 'Guía no encontrada' }, 404);
        const order = await deps.orders.getOrder(shipment.orderId);
        if (order && order.status !== 'cancelled') {
          const nextStatus = shipment.status === 'delivered' ? 'delivered'
            : shipment.status === 'in_transit' ? 'shipped' : null;
          if (nextStatus && order.status !== nextStatus) await deps.orders.updateOrderStatus({
            orderId: order.id, status: nextStatus,
            note: `Estado confirmado por consulta autenticada a MiPaquete: ${shipment.providerStatus || shipment.status}`,
            actor: 'mipaquete:authenticated_sync',
          });
        }
        if (shipment.guideNumber) await deps.orders.saveOrderShippingDetails(shipment.orderId, {
          shippingCarrier: shipment.carrierName || 'MiPaquete', shippingTrackingNumber: shipment.guideNumber,
          shippingTrackingUrl: shipment.guideUrl, estimatedDeliveryDate: null,
        });
        await deps.audit.record({ actorId: String(c.get('actorId') || 'unknown'), actorType: 'admin',
          action: 'shipping.mipaquete.shipment.synced', entityType: 'shipping_carrier_shipment',
          entityId: shipment.id, changes: { orderId: shipment.orderId, mipaqueteCode: shipment.mipaqueteCode,
            guideNumber: shipment.guideNumber, status: shipment.status } });
        return c.json({ success: true, shipment });
      } catch { return c.json({ error: 'No se pudo consultar el estado con MiPaquete' }, 502); }
    });
    return app;
  }
}

function party(name: string, identification: string | undefined | null, phone: string | undefined,
  email: string, address: string | undefined, identificationType: 'CC' | 'NIT') {
  if (!identification?.trim() || !phone?.trim() || !email.trim() || !address?.trim()) throw new Error('Completa identificación, teléfono, correo y dirección de la tienda/cliente para generar la guía.');
  const parts = name.trim().split(/\s+/);
  return { name: parts[0] || 'Cliente', surname: parts.slice(1).join(' ') || parts[0] || 'Cliente',
    phone: phone.replace(/\D/g, '').slice(-10), email: email.trim(), address: address.trim(),
    identification: identification.trim(), identificationType };
}

function safeMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : '';
  return message.startsWith('La ') || message.startsWith('No existe') || message.startsWith('El pedido') || message.startsWith('Completa')
    ? message : 'No fue posible generar la guía. Revisa la configuración o consulta el pedido antes de reintentar.';
}
