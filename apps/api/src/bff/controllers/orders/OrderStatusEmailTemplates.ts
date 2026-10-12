import { Order } from '../../../modules/orders/domain/entities/Order.js';

export class OrderStatusEmailTemplates {
  public static renderShippedEmail(order: Order, note?: string): { subject: string; html: string } {
    const addr = order.shippingAddress || {} as any;
    const subject = `🚚 ¡Tu pedido #${order.id} va en camino!`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;">
        <div style="text-align:center;border-bottom:2px solid #0284c7;padding-bottom:1.5rem;margin-bottom:1.5rem;">
          <h1 style="color:#0284c7;margin:0;font-size:1.6rem;">VEGA STORE</h1>
          <p style="color:#64748b;margin:0.25rem 0 0 0;font-size:0.9rem;">¡Buenas noticias! Tu paquete ya fue despachado</p>
        </div>
        <p>Hola <strong>${order.customerName}</strong>,</p>
        <p>Tu pedido <strong>#${order.id}</strong> ha sido despachado y se encuentra en ruta de entrega hacia tu dirección.</p>
        <div style="background:#f8fafc;padding:1rem;border-radius:8px;margin:1.5rem 0;border:1px solid #e2e8f0;font-size:0.9rem;line-height:1.5;">
          <div><strong>Dirección de Entrega:</strong> ${addr.addressLine || 'N/A'}, ${addr.municipality || ''}, ${addr.department || ''}</div>
          <div><strong>Teléfono de Contacto:</strong> ${order.customerPhone}</div>
          ${note ? `<div style="margin-top:0.5rem;color:#0284c7;"><strong>Nota de Envío:</strong> ${note}</div>` : ''}
        </div>
        <p style="font-size:0.85rem;color:#64748b;">Por favor asegúrate de que haya alguien disponible para recibir tu pedido.</p>
      </div>
    `;
    return { subject, html };
  }

  public static renderDeliveredEmail(order: Order, note?: string): { subject: string; html: string } {
    const subject = `🎉 ¡Tu pedido #${order.id} ha sido entregado!`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;">
        <div style="text-align:center;border-bottom:2px solid #16a34a;padding-bottom:1.5rem;margin-bottom:1.5rem;">
          <h1 style="color:#16a34a;margin:0;font-size:1.6rem;">VEGA STORE</h1>
          <p style="color:#64748b;margin:0.25rem 0 0 0;font-size:0.9rem;">¡Esperamos que disfrutes tu compra!</p>
        </div>
        <p>Hola <strong>${order.customerName}</strong>,</p>
        <p>Te confirmamos que tu pedido <strong>#${order.id}</strong> ha sido marcado como <strong>Entregado</strong>.</p>
        ${note ? `<div style="background:#f0fdf4;padding:1rem;border-radius:8px;margin:1rem 0;color:#166534;font-size:0.9rem;"><strong>Nota:</strong> ${note}</div>` : ''}
        <p style="font-size:0.85rem;color:#64748b;">Gracias por confiar en nosotros. Si tienes alguna duda sobre tu producto, contáctanos a soporte.</p>
      </div>
    `;
    return { subject, html };
  }

  public static renderCancelledEmail(order: Order, note?: string): { subject: string; html: string } {
    const subject = `❌ Notificación: Tu pedido #${order.id} ha sido cancelado`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;">
        <div style="text-align:center;border-bottom:2px solid #dc2626;padding-bottom:1.5rem;margin-bottom:1.5rem;">
          <h1 style="color:#dc2626;margin:0;font-size:1.6rem;">VEGA STORE</h1>
          <p style="color:#64748b;margin:0.25rem 0 0 0;font-size:0.9rem;">Actualización sobre el estado de tu pedido</p>
        </div>
        <p>Hola <strong>${order.customerName}</strong>,</p>
        <p>Te informamos que tu pedido <strong>#${order.id}</strong> ha sido cancelado.</p>
        ${note ? `<div style="background:#fef2f2;padding:1rem;border-radius:8px;margin:1rem 0;color:#991b1b;font-size:0.9rem;"><strong>Motivo:</strong> ${note}</div>` : ''}
        <p style="font-size:0.85rem;color:#64748b;">Si crees que esto es un error o necesitas más información, contáctanos a soporte.</p>
      </div>
    `;
    return { subject, html };
  }
}
