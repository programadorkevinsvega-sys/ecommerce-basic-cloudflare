import { Order } from '../../../modules/orders/domain/entities/Order.js';

export class OrderStatusEmailTemplates {
  public static renderShippedEmail(order: Order, note?: string): { subject: string; html: string } {
    const addr = order.shippingAddress || {} as any;
    const subject = `🚚 ¡Tu pedido #${order.id} va en camino!`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;line-height:1.6;">
        <div style="text-align:center;border-bottom:2px solid #0284c7;padding-bottom:1.5rem;margin-bottom:1.5rem;">
          <h1 style="color:#0284c7;margin:0;font-size:1.5rem;letter-spacing:0.02em;">VEGA STORE</h1>
          <p style="color:#64748b;margin:0.25rem 0 0 0;font-size:0.9rem;">Actualización de entrega de tu pedido</p>
        </div>
        <p>Apreciado(a) <strong>${order.customerName}</strong>,</p>
        <p>Te informamos que tu pedido <strong>#${order.id}</strong> ha sido despachado de nuestra bodega y se encuentra en ruta de entrega hacia tu dirección.</p>
        <div style="background:#f8fafc;padding:1.2rem;border-radius:8px;margin:1.5rem 0;border:1px solid #e2e8f0;font-size:0.9rem;">
          <div><strong>Dirección de Entrega:</strong> ${addr.addressLine || 'N/A'}, ${addr.municipality || ''}, ${addr.department || ''}</div>
          <div><strong>Teléfono de Contacto:</strong> ${order.customerPhone}</div>
          ${note ? `<div style="margin-top:0.6rem;color:#0369a1;"><strong>Guía o Nota de Envío:</strong> ${note}</div>` : ''}
        </div>
        <p style="font-size:0.85rem;color:#64748b;">Agradecemos verificar que haya una persona disponible en el domicilio para la recepción del paquete.</p>
        <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0;font-size:0.75rem;color:#94a3b8;text-align:center;">
          <p style="margin:0;">Mensaje transaccional enviado automáticamente por Vega Store Colombia.</p>
          <p style="margin:0.2rem 0 0 0;">Si tienes preguntas o necesitas soporte, comunícate con nosotros.</p>
        </div>
      </div>
    `;
    return { subject, html };
  }

  public static renderDeliveredEmail(order: Order, note?: string): { subject: string; html: string } {
    const subject = `🎉 ¡Tu pedido #${order.id} ha sido entregado!`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;line-height:1.6;">
        <div style="text-align:center;border-bottom:2px solid #16a34a;padding-bottom:1.5rem;margin-bottom:1.5rem;">
          <h1 style="color:#16a34a;margin:0;font-size:1.5rem;letter-spacing:0.02em;">VEGA STORE</h1>
          <p style="color:#64748b;margin:0.25rem 0 0 0;font-size:0.9rem;">Confirmación de entrega de pedido</p>
        </div>
        <p>Apreciado(a) <strong>${order.customerName}</strong>,</p>
        <p>Te confirmamos que tu pedido <strong>#${order.id}</strong> ha sido entregado exitosamente.</p>
        ${note ? `<div style="background:#f0fdf4;padding:1.2rem;border-radius:8px;margin:1.5rem 0;color:#166534;font-size:0.9rem;border:1px solid #bbf7d0;"><strong>Nota:</strong> ${note}</div>` : ''}
        <p style="font-size:0.85rem;color:#64748b;">Agradecemos tu confianza en nuestra tienda. Esperamos que disfrutes de tu compra.</p>
        <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0;font-size:0.75rem;color:#94a3b8;text-align:center;">
          <p style="margin:0;">Mensaje transaccional enviado automáticamente por Vega Store Colombia.</p>
        </div>
      </div>
    `;
    return { subject, html };
  }

  public static renderCancelledEmail(order: Order, note?: string): { subject: string; html: string } {
    const subject = `Notificación: Tu pedido #${order.id} ha sido cancelado`;
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;line-height:1.6;">
        <div style="text-align:center;border-bottom:2px solid #dc2626;padding-bottom:1.5rem;margin-bottom:1.5rem;">
          <h1 style="color:#dc2626;margin:0;font-size:1.5rem;letter-spacing:0.02em;">VEGA STORE</h1>
          <p style="color:#64748b;margin:0.25rem 0 0 0;font-size:0.9rem;">Actualización sobre el estado de tu compra</p>
        </div>
        <p>Apreciado(a) <strong>${order.customerName}</strong>,</p>
        <p>Te informamos que tu pedido <strong>#${order.id}</strong> ha sido cancelado.</p>
        ${note ? `<div style="background:#fef2f2;padding:1.2rem;border-radius:8px;margin:1.5rem 0;color:#991b1b;font-size:0.9rem;border:1px solid #fecaca;"><strong>Motivo:</strong> ${note}</div>` : ''}
        <p style="font-size:0.85rem;color:#64748b;">Si requieres aclaración adicional, no dudes en ponerte en contacto con nuestro equipo de atención.</p>
        <div style="margin-top:2rem;padding-top:1rem;border-top:1px solid #e2e8f0;font-size:0.75rem;color:#94a3b8;text-align:center;">
          <p style="margin:0;">Mensaje transaccional enviado automáticamente por Vega Store Colombia.</p>
        </div>
      </div>
    `;
    return { subject, html };
  }
}
