import { Order } from '../../../modules/orders/domain/entities/Order.js';
import { calculateOrderTaxCents } from './calculateOrderTaxCents.js';

export class OrderEmailTemplates {
  public static renderCustomerPaidEmail(order: Order, invoiceNumber: string, txId?: string): string {
    const totalFormatted = (order.totalCents / 100).toLocaleString('es-CO');
    const subtotalFormatted = (order.subtotalCents / 100).toLocaleString('es-CO');
    const taxFormatted = (calculateOrderTaxCents(order) / 100).toLocaleString('es-CO');
    const billedShippingCents = Math.max(0, order.shippingCostCents - order.shippingDiscountCents);
    const shippingFormatted = (billedShippingCents / 100).toLocaleString('es-CO');
    const addr = order.shippingAddress || {} as any;

    return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;">
        <div style="text-align:center;border-bottom:2px solid #0284c7;padding-bottom:1.5rem;margin-bottom:1.5rem;">
          <h1 style="color:#0284c7;margin:0;font-size:1.6rem;">VEGA STORE</h1>
          <p style="color:#64748b;margin:0.25rem 0 0 0;font-size:0.9rem;">¡Pago Aprobado y Confirmado con Éxito!</p>
        </div>
        <p>Hola <strong>${order.customerName}</strong>, hemos recibido la confirmación de tu pago a través de <strong>Wompi</strong>.</p>
        <p>Adjuntamos el PDF de tu factura para que puedas guardarlo.</p>
        <div style="background:#f8fafc;padding:1rem;border-radius:8px;margin:1.5rem 0;border:1px solid #e2e8f0;font-size:0.9rem;">
          <div><strong>Número de Pedido:</strong> #${order.id}</div>
          <div><strong>Factura Comercial:</strong> <span style="color:#0284c7;font-weight:700;">#${invoiceNumber}</span></div>
          <div><strong>Referencia / Tx Wompi:</strong> ${txId || 'Validado por pasarela'}</div>
          <div><strong>Método de Pago:</strong> Pago en línea (Wompi)</div>
        </div>
        <h3 style="color:#0f172a;margin-bottom:0.5rem;font-size:1rem;text-transform:uppercase;">Artículos Comprados</h3>
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;margin-bottom:1.5rem;">
          <thead>
            <tr style="background:#f1f5f9;text-align:left;color:#475569;">
              <th style="padding:0.6rem;">Producto</th>
              <th style="padding:0.6rem;text-align:center;">Cant.</th>
              <th style="padding:0.6rem;text-align:right;">Precio</th>
              <th style="padding:0.6rem;text-align:right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${(order.lines || []).map((l: any) => `
              <tr style="border-bottom:1px solid #e2e8f0;">
                <td style="padding:0.6rem;"><strong>${l.productName}</strong><br><small style="color:#64748b;">${l.productSku}</small></td>
                <td style="padding:0.6rem;text-align:center;">${l.quantity}</td>
                <td style="padding:0.6rem;text-align:right;">$${(l.unitPriceCents / 100).toLocaleString('es-CO')}</td>
                <td style="padding:0.6rem;text-align:right;"><strong>$${(l.totalCents / 100).toLocaleString('es-CO')}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="background:#f8fafc;padding:1rem;border-radius:8px;margin-bottom:1.5rem;font-size:0.9rem;line-height:1.6;">
          <div style="display:flex;justify-content:space-between;"><span>Subtotal:</span><span>$${subtotalFormatted}</span></div>
          ${order.discountCents > 0 ? `<div style="display:flex;justify-content:space-between;"><span>Descuento:</span><span>-$${(order.discountCents / 100).toLocaleString('es-CO')}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;"><span>IVA incluido:</span><span>$${taxFormatted}</span></div>
          <div style="display:flex;justify-content:space-between;"><span>${order.shippingChargeMode === 'collect_at_delivery' ? 'Envío incluido en factura:' : 'Envío:'}</span><span>$${shippingFormatted}</span></div>
          ${order.shippingDiscountCents ? `<div style="display:flex;justify-content:space-between;"><span>Envío cubierto por la tienda:</span><span>-$${(order.shippingDiscountCents / 100).toLocaleString('es-CO')}</span></div>` : ''}
          ${order.shippingCollectionCents ? `<div style="display:flex;justify-content:space-between;"><span>Envío por pagar al recibir:</span><span>$${(order.shippingCollectionCents / 100).toLocaleString('es-CO')}</span></div>` : ''}
          ${order.transactionFeeCents ? `<div style="display:flex;justify-content:space-between;"><span>Costo de transacción Wompi:</span><span>$${(order.transactionFeeCents / 100).toLocaleString('es-CO')}</span></div>` : ''}
          ${order.transactionFeeCents ? `<div style="display:flex;justify-content:space-between;"><span>Costo de transacción Wompi:</span><span>$${(order.transactionFeeCents / 100).toLocaleString('es-CO')}</span></div>` : ''}
          <div style="display:flex;justify-content:space-between;border-top:2px solid #0284c7;font-size:1.1rem;font-weight:700;color:#0284c7;padding-top:0.5rem;margin-top:0.5rem;">
            <span>TOTAL PAGADO:</span><span>$${totalFormatted} COP</span>
          </div>
        </div>
        <div style="background:#f8fafc;padding:1rem;border-radius:8px;font-size:0.85rem;line-height:1.5;">
          <h4 style="margin:0 0 0.5rem 0;color:#0284c7;text-transform:uppercase;">Dirección de Entrega</h4>
          <div><strong>Dirección:</strong> ${addr.addressLine || 'N/A'}</div>
          <div><strong>Ciudad / Depto:</strong> ${addr.municipality || ''}, ${addr.department || ''}</div>
          ${order.shippingFulfillmentMethod === 'merchant_local' ? '<div><strong>Entrega:</strong> Domiciliario o vehículo de la tienda</div>' : order.shippingFulfillmentMethod === 'carrier' ? '<div><strong>Entrega:</strong> Transportadora MiPaquete</div>' : ''}
          <div><strong>Teléfono:</strong> ${order.customerPhone}</div>
        </div>
      </div>
    `;
  }

  public static renderAdminPaidAlertEmail(order: Order, invoiceNumber: string, txId?: string): string {
    const totalFormatted = (order.totalCents / 100).toLocaleString('es-CO');
    const addr = order.shippingAddress || {} as any;

    return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;">
        <div style="background:#14532d;color:#ffffff;padding:1rem;border-radius:8px;text-align:center;margin-bottom:1.5rem;">
          <h2 style="margin:0;font-size:1.4rem;">💰 ¡NUEVA VENTA PAGADA (WOMPI)!</h2>
          <p style="margin:0.3rem 0 0 0;font-size:0.9rem;">Pedido #${order.id} — Factura #${invoiceNumber}</p>
        </div>
        <div style="background:#f8fafc;padding:1rem;border-radius:8px;margin-bottom:1.5rem;font-size:0.9rem;">
          <div><strong>Cliente:</strong> ${order.customerName} (${order.customerEmail})</div>
          <div><strong>Teléfono:</strong> ${order.customerPhone}</div>
          <div><strong>Dirección:</strong> ${addr.addressLine}, ${addr.municipality}, ${addr.department}</div>
          <div><strong>Total:</strong> <span style="color:#14532d;font-weight:700;">$${totalFormatted} COP</span></div>
          <div><strong>Tx Wompi:</strong> ${txId || 'N/A'}</div>
        </div>
        <h3 style="color:#0f172a;margin-bottom:0.5rem;font-size:1rem;">Artículos a Empacar</h3>
        <table style="width:100%;border-collapse:collapse;font-size:0.85rem;">
          ${(order.lines || []).map((l: any) => `
            <tr style="border-bottom:1px solid #e2e8f0;">
              <td style="padding:0.5rem;"><strong>${l.productName}</strong></td>
              <td style="padding:0.5rem;text-align:center;">${l.quantity} u.</td>
              <td style="padding:0.5rem;text-align:right;">$${(l.totalCents / 100).toLocaleString('es-CO')}</td>
            </tr>
          `).join('')}
        </table>
      </div>
    `;
  }

  public static renderCustomerCodEmail(order: Order): string {
    const totalFormatted = (order.totalCents / 100).toLocaleString('es-CO');
    const collectionCents = order.totalCents + order.shippingCollectionCents;
    const addr = order.shippingAddress || {} as any;

    return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;">
        <h2 style="color:#0284c7;margin-top:0;">📦 ¡Hemos recibido tu pedido Contra Entrega!</h2>
        <p>Hola <strong>${order.customerName}</strong>, tu pedido <strong>#${order.id}</strong> ha sido registrado.</p>
        <div style="background:#fef3c7;border:1px solid #f59e0b;padding:1rem;border-radius:8px;margin:1rem 0;color:#92400e;">
          <strong>💵 Pago Contra Entrega:</strong> Pagarás <strong>$${(collectionCents / 100).toLocaleString('es-CO')} COP</strong> al recibir. ${order.shippingCollectionCents ? `Incluye $${(order.shippingCollectionCents / 100).toLocaleString('es-CO')} de envío, cobrado por separado del valor del pedido.` : `El valor del pedido es $${totalFormatted} COP.`}
        </div>
        <div><strong>Dirección de Envío:</strong> ${addr.addressLine}, ${addr.municipality}, ${addr.department}</div>
        <p style="margin-top:1.5rem;font-size:0.85rem;color:#64748b;">Nos pondremos en contacto contigo si requerimos validar algún dato de entrega.</p>
      </div>
    `;
  }

  public static renderAdminCodAlertEmail(order: Order): string {
    const totalFormatted = ((order.totalCents + order.shippingCollectionCents) / 100).toLocaleString('es-CO');
    const addr = order.shippingAddress || {} as any;

    return `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:650px;margin:auto;padding:2rem;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;color:#1e293b;">
        <div style="background:#78350f;color:#ffffff;padding:1rem;border-radius:8px;text-align:center;margin-bottom:1.5rem;">
          <h2 style="margin:0;font-size:1.4rem;">🚚 ¡NUEVO PEDIDO CONTRA ENTREGA!</h2>
          <p style="margin:0.3rem 0 0 0;font-size:0.9rem;">Pedido #${order.id} — Cobrar al entregar</p>
        </div>
        <div><strong>Cliente:</strong> ${order.customerName} (${order.customerEmail}) - Tel: ${order.customerPhone}</div>
        <div><strong>Destino:</strong> ${addr.addressLine}, ${addr.municipality}, ${addr.department}</div>
        <div><strong>Valor a Recaudar:</strong> <strong style="color:#b45309;">$${totalFormatted} COP</strong></div>
        ${order.shippingCollectionCents ? `<div><strong>Incluye envío por cobrar:</strong> $${(order.shippingCollectionCents / 100).toLocaleString('es-CO')} COP</div>` : ''}
      </div>
    `;
  }
}
