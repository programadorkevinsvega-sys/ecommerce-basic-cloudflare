import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { InventoryGateway } from '../../gateways/inventory/InventoryGateway.js';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { NotificationsGateway } from '../../gateways/notifications/NotificationsGateway.js';
import { AuditGateway } from '../../gateways/audit/AuditGateway.js';
import { RealtimeGateway } from '../../gateways/realtime/RealtimeGateway.js';
import { SettingsGateway } from '../../gateways/settings/SettingsGateway.js';
import { OrderEmailTemplates } from './OrderEmailTemplates.js';

export interface ProcessPaymentSuccessParams {
  orderId: string;
  traceId: string;
  paymentMethod: string;
  paymentReference?: string;
  actor: string;
  ordersGateway: OrdersGateway;
  inventoryGateway: InventoryGateway;
  invoicingGateway: InvoicingGateway;
  notificationsGateway: NotificationsGateway;
  auditGateway: AuditGateway;
  realtimeGateway: RealtimeGateway;
  settingsGateway: SettingsGateway;
}

export async function processOrderPaymentSuccess(params: ProcessPaymentSuccessParams): Promise<void> {
  const {
    orderId,
    traceId,
    paymentMethod,
    paymentReference,
    actor,
    ordersGateway,
    inventoryGateway,
    invoicingGateway,
    notificationsGateway,
    auditGateway,
    realtimeGateway,
    settingsGateway,
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
  const storeSettings = await settingsGateway.getSettings().catch(() => null);
  try {
    const taxCents = Math.round(order.subtotalCents * 0.19);
    const invoice = await invoicingGateway.issueInvoice({
      orderId: order.id,
      customerId: order.customerId,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      customerTaxId: order.customerTaxId || null,
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
          taxId: order.customerTaxId || null,
          phone: order.customerPhone,
        },
        shippingAddress: {
          addressLine: order.shippingAddress?.addressLine || '',
          municipality: order.shippingAddress?.municipality || '',
          department: order.shippingAddress?.department || '',
        },
        company: storeSettings ? {
          storeName: storeSettings.storeName,
          nit: storeSettings.companyNit,
          legalName: storeSettings.companyLegalName,
          address: storeSettings.companyAddress,
          email: storeSettings.supportEmail,
          phone: storeSettings.supportPhone,
        } : undefined,
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
  } catch {
    console.error(JSON.stringify({ event: 'payments.invoice_issue_failed', order_id: order.id, trace_id: traceId }));
  }

  // 3. Enviar emails transaccionales con Resend (Al Cliente Y a la Empresa)
  try {
    // 3.1 Al Cliente
    const customerHtml = OrderEmailTemplates.renderCustomerPaidEmail(order, invoiceNumber, paymentReference);
    await notificationsGateway.sendEmail({
      recipientEmail: order.customerEmail,
      templateName: 'order_confirmed_customer',
      subject: `¡Pago Confirmado! Pedido #${order.id} ${invoiceNumber ? '- Factura ' + invoiceNumber : ''}`,
      idempotencyKey: `email_cust_${order.id}`,
      html: customerHtml,
    });

    // 3.2 A la Empresa / Administrador
    const adminEmail = storeSettings?.supportEmail || 'contacto@tienda.com';
    const adminHtml = OrderEmailTemplates.renderAdminPaidAlertEmail(order, invoiceNumber, paymentReference);
    const totalFormatted = (order.totalCents / 100).toLocaleString('es-CO');

    await notificationsGateway.sendEmail({
      recipientEmail: adminEmail,
      templateName: 'order_confirmed_admin',
      subject: `🚨 [NUEVA VENTA] Pedido #${order.id} — Factura #${invoiceNumber} ($${totalFormatted} COP)`,
      idempotencyKey: `email_admin_${order.id}`,
      html: adminHtml,
    });
  } catch {
    console.error(JSON.stringify({ event: 'payments.confirmation_email_failed', order_id: order.id, trace_id: traceId }));
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
  } catch {
    console.error(JSON.stringify({ event: 'payments.audit_write_failed', order_id: order.id, trace_id: traceId }));
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
