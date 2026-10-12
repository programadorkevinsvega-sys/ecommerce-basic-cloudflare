import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';

export interface ProcessPaymentSuccessParams {
  orderId: string;
  paymentMethod: string;
  paymentReference?: string;
  actor: string;
  ordersGateway: OrdersGateway;
  inventoryGateway: InventoryGateway;
  invoicingGateway: InvoicingGateway;
  notificationsGateway: NotificationsGateway;
  auditGateway: AuditGateway;
  realtimeGateway: RealtimeGateway;
}

export async function processOrderPaymentSuccess(params: ProcessPaymentSuccessParams): Promise<void> {
  const {
    orderId,
    paymentMethod,
    paymentReference,
    actor,
    ordersGateway,
    inventoryGateway,
    invoicingGateway,
    notificationsGateway,
    auditGateway,
    realtimeGateway,
  } = params;

  const order = await ordersGateway.getOrder(orderId);
  if (!order) return;

  // 1. Descontar stock
  if (order.lines?.length) {
    const items = order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity }));
    await inventoryGateway.consumeStock(orderId, items).catch(() => {});
  }

  // 2. Emitir factura inmutable
  let invoiceNumber = '';
  try {
    const taxCents = Math.round(order.subtotalCents * 0.19);
    const invoice = await invoicingGateway.issueInvoice({
      orderId: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      subtotalCents: order.subtotalCents,
      taxCents,
      shippingCostCents: order.shippingCostCents,
      discountCents: order.discountCents,
      totalCents: order.totalCents,
      currency: 'COP',
      paymentMethod,
      paymentReference,
      snapshot: {
        orderId: order.id,
        lines: order.lines.map((l) => ({
          productId: l.productId,
          productName: l.productName,
          productSku: l.productSku,
          quantity: l.quantity,
          unitPriceCents: l.unitPriceCents,
          totalCents: l.totalCents,
        })),
        customer: {
          id: order.customerId,
          name: order.customerName,
          email: order.customerEmail,
          phone: order.customerPhone,
        },
        shippingAddress: {
          addressLine: order.shippingAddress?.addressLine || '',
          municipality: order.shippingAddress?.municipality || '',
          department: order.shippingAddress?.department || '',
        },
        subtotalCents: order.subtotalCents,
        taxCents,
        shippingCostCents: order.shippingCostCents,
        discountCents: order.discountCents,
        totalCents: order.totalCents,
        currency: 'COP',
        paymentMethod,
        paymentReference,
      },
    });
    invoiceNumber = invoice.invoiceNumber;
  } catch (err) {
    console.error('[processPaymentSuccess:invoice] Error:', err);
  }

  // 3. Enviar email transaccional con Resend
  try {
    const totalFormatted = (order.totalCents / 100).toLocaleString('es-CO');
    await notificationsGateway.sendEmail({
      recipientEmail: order.customerEmail,
      templateName: 'order_confirmed',
      subject: `¡Pago Confirmado! Pedido #${order.id} ${invoiceNumber ? '- Factura ' + invoiceNumber : ''}`,
      idempotencyKey: `email_confirmed_${order.id}`,
      html: `
        <div style="font-family:sans-serif; max-width:600px; margin:auto; padding:2rem; border:1px solid #e2e8f0; border-radius:8px;">
          <h2 style="color:#0284c7;">¡Tu pago ha sido confirmado!</h2>
          <p>Hola <strong>${order.customerName}</strong>, hemos registrado tu pago con éxito.</p>
          <div style="background:#f8fafc; padding:1rem; border-radius:6px; margin:1.5rem 0;">
            <div><strong>Pedido:</strong> #${order.id}</div>
            ${invoiceNumber ? `<div><strong>Factura de Venta:</strong> #${invoiceNumber}</div>` : ''}
            <div><strong>Total Pagado:</strong> $${totalFormatted} COP</div>
            <div><strong>Método de Pago:</strong> ${paymentMethod === 'wompi' ? 'Wompi en línea' : 'Contra entrega'}</div>
          </div>
          <p>Prepararemos tu envío hacia <strong>${order.shippingAddress?.addressLine}, ${order.shippingAddress?.municipality}</strong>.</p>
          <p style="color:#64748b; font-size:0.85rem; margin-top:2rem;">Gracias por confiar en Vega Store.</p>
        </div>
      `,
    });
  } catch (err) {
    console.error('[processPaymentSuccess:email] Error:', err);
  }

  // 4. Registro de auditoría
  try {
    await auditGateway.record({
      actorId: actor,
      actorType: actor === 'wompi-webhook' ? 'system' : 'admin',
      action: 'payments.payment_confirmed',
      entityType: 'order',
      entityId: order.id,
      changes: { totalCents: order.totalCents, paymentMethod, paymentReference, invoiceNumber },
    });
  } catch (err) {
    console.error('[processPaymentSuccess:audit] Error:', err);
  }

  // 5. Notificación en tiempo real al panel admin
  try {
    await realtimeGateway.publishNotification({
      channel: 'admin',
      eventType: 'payments.approved',
      title: `✅ Pago Confirmado — #${order.id}`,
      body: `${order.customerName} pagó $${(order.totalCents / 100).toLocaleString('es-CO')} COP ${invoiceNumber ? `(Factura ${invoiceNumber})` : ''}.`,
      data: { orderId: order.id, invoiceNumber, status: 'approved' },
    });
  } catch (err) {}
}
