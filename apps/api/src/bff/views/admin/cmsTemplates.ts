export interface LegalTemplate {
  key: string;
  name: string;
  title: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  html: string;
}

export const LEGAL_TEMPLATES: Record<string, LegalTemplate> = {
  terminos: {
    key: 'terminos',
    name: 'Términos y Condiciones Generales',
    title: 'Términos y Condiciones de Uso',
    slug: 'terminos-y-condiciones',
    seoTitle: 'Términos y Condiciones | Vega Store Colombia',
    seoDescription: 'Conoce los términos y condiciones de compra, despacho y uso de la plataforma Vega Store en Colombia.',
    html: `<h2>1. Identificación y Alcance</h2>
<p>El presente documento regula el uso de la tienda virtual <strong>Vega Store</strong> y la adquisición de productos ofrecidos en el territorio de la República de Colombia, en concordancia con la Ley 1480 de 2011 (Estatuto del Consumidor).</p>

<h2>2. Precios y Medios de Pago</h2>
<p>Todos los precios publicados están expresados en pesos colombianos (COP) e incluyen los impuestos de ley aplicables. Los medios de pago autorizados comprenden pasarela segura en línea (tarjetas de crédito, débito, PSE) y pago contra entrega en zonas con cobertura habilitada.</p>

<h2>3. Despacho y Entrega</h2>
<p>Los tiempos de entrega oscilan entre 2 y 5 días hábiles a nivel nacional. La empresa transportadora certificada efectuará la entrega en la dirección suministrada por el comprador.</p>`
  },
  privacidad: {
    key: 'privacidad',
    name: 'Política de Tratamiento de Datos (Ley 1581)',
    title: 'Política de Privacidad y Tratamiento de Datos Personales',
    slug: 'politica-de-privacidad',
    seoTitle: 'Tratamiento de Datos Personales | Vega Store',
    seoDescription: 'Política de recolección, uso y protección de datos personales de clientes conforme a la Ley 1581 de 2012.',
    html: `<h2>1. Compromiso de Protección de Datos</h2>
<p>En cumplimiento de la Ley Estatutaria 1581 de 2012 y el Decreto 1377 de 2013, <strong>Vega Store</strong> informa a los usuarios y clientes que los datos personales suministrados serán tratados con altos estándares de seguridad y confidencialidad.</p>

<h2>2. Finalidad del Tratamiento</h2>
<p>La información recolectada se utilizará exclusivamente para:</p>
<ul>
  <li>Procesar y despachar pedidos en línea.</li>
  <li>Gestionar cobros, facturación y validaciones antifraude.</li>
  <li>Enviar notificaciones sobre el estado de las órdenes y soporte posventa.</li>
</ul>

<h2>3. Derechos del Titular</h2>
<p>El titular tiene derecho a conocer, actualizar y rectificar sus datos personales, así como a revocar la autorización enviando una solicitud a nuestros canales oficiales de atención.</p>`
  },
  devoluciones: {
    key: 'devoluciones',
    name: 'Política de Devoluciones y Retracto',
    title: 'Política de Cambios, Devoluciones y Derecho de Retracto',
    slug: 'politica-de-devoluciones',
    seoTitle: 'Devoluciones y Derecho de Retracto | Vega Store',
    seoDescription: 'Información sobre plazos, requisitos y procedimiento para cambios de producto y ejercicio del derecho de retracto legal.',
    html: `<h2>1. Derecho de Retracto (Ley 1480 de 2011)</h2>
<p>El consumidor tiene derecho a ejercer el retracto dentro de los <strong>cinco (5) días hábiles</strong> siguientes a la entrega del producto, siempre que este se encuentre sin uso, en su empaque original y con todas sus etiquetas intactas.</p>

<h2>2. Proceso de Cambio y Garantía</h2>
<p>Para solicitar un cambio por talla, color o defecto de fábrica, el cliente debe reportar el caso a través de nuestros canales de atención adjuntando evidencia fotográfica y el número de pedido.</p>

<h2>3. Devolución de Dinero</h2>
<p>Una vez recibido e inspeccionado el producto en nuestras bodegas, el reembolso se procesará dentro de los términos establecidos por la ley a través del mismo medio de pago utilizado.</p>`
  },
  pqrs: {
    key: 'pqrs',
    name: 'Peticiones, Quejas y Reclamos (PQRS)',
    title: 'Atención de Peticiones, Quejas, Reclamos y Solicitudes (PQRS)',
    slug: 'atencion-pqrs',
    seoTitle: 'Peticiones, Quejas y Reclamos (PQRS) | Vega Store',
    seoDescription: 'Canal oficial para radicación y seguimiento de PQRS conforme a la normativa colombiana de protección al consumidor.',
    html: `<h2>1. Radicación de PQRS</h2>
<p>En <strong>Vega Store</strong> valoramos tu retroalimentación. Si tienes una petición, consulta, queja o reclamo respecto a nuestros productos o servicios, ponemos a tu disposición nuestros canales oficiales de radicación.</p>

<h2>2. Tiempos de Respuesta</h2>
<p>Conforme al Código de Procedimiento Administrativo y de lo Contencioso Administrativo y el Estatuto del Consumidor, daremos respuesta formal a tu solicitud en un plazo máximo de <strong>quince (15) días hábiles</strong> posteriores a su recepción.</p>`
  }
};
