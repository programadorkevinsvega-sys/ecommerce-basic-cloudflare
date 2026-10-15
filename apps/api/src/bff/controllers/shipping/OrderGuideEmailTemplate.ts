interface OrderGuideEmailData {
  orderId: string;
  customerName: string;
  carrier: string;
  guideNumber: string;
  estimatedDeliveryDate: string | null;
  minEstimatedDays: number | null;
  maxEstimatedDays: number | null;
  amountToCollectCents: number;
  trackingUrl: string;
}

export class OrderGuideEmailTemplate {
  public static render(data: OrderGuideEmailData): string {
    const estimate = data.estimatedDeliveryDate
      ? `<p><strong>Fecha estimada de entrega:</strong> ${escapeHtml(data.estimatedDeliveryDate)}</p>`
      : data.minEstimatedDays !== null && data.maxEstimatedDays !== null
        ? `<p><strong>Entrega estimada:</strong> entre ${data.minEstimatedDays} y ${data.maxEstimatedDays} días hábiles.</p>`
        : '';
    const collection = data.amountToCollectCents > 0
      ? `<p><strong>Valor pendiente por pagar al recibir:</strong> ${money(data.amountToCollectCents)} COP</p>`
      : '';

    return `<main style="font-family:Arial,sans-serif;max-width:620px;margin:auto;padding:28px;color:#17231d;line-height:1.6">
      <h1 style="color:#20583e">Tu pedido está en camino</h1>
      <p>Hola ${escapeHtml(data.customerName)}, MiPaquete confirmó la información de despacho de tu pedido.</p>
      <section style="padding:18px;background:#f5f7f3;border-radius:12px">
        <p><strong>Pedido:</strong> ${escapeHtml(data.orderId)}</p>
        <p><strong>Transportadora:</strong> ${escapeHtml(data.carrier)}</p>
        <p><strong>Número de guía:</strong> ${escapeHtml(data.guideNumber)}</p>
        ${estimate}${collection}
      </section>
      <p>Consulta las actualizaciones del envío en <a href="${escapeHtml(data.trackingUrl)}" style="color:#20583e;font-weight:bold">Seguimiento de pedidos</a>. Si tienes una cuenta, inicia sesión antes de consultar. Para pedidos de invitado, ingresa también la clave privada que recibiste en el correo de confirmación.</p>
      <p style="color:#68776c;font-size:13px">Este mensaje se envía cuando la transportadora confirma la guía. La etiqueta PDF es de uso interno para preparar el paquete.</p>
    </main>`;
  }
}

function money(cents: number): string {
  return (cents / 100).toLocaleString('es-CO', { maximumFractionDigits: 0 });
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[char] || char);
}
