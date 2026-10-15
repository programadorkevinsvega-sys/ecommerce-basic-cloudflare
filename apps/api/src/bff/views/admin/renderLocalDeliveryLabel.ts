import { Order } from '../../../modules/orders/domain/entities/Order.js';

export function renderLocalDeliveryLabel(order: Order): string {
  const lines = order.lines.map((line) => `<li>${escape(line.quantity + ' × ' + line.productName)} <small>${escape(line.productSku)}</small></li>`).join('');
  const due = order.paymentMethod === 'cash_on_delivery' ? order.totalCents + order.shippingCollectionCents : 0;
  return `<!doctype html><html lang="es"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Etiqueta ${escape(order.id)}</title>
  <style>@page{size:100mm 150mm;margin:5mm}*{box-sizing:border-box}body{font:14px Arial,sans-serif;color:#15251e;margin:0}.label{width:90mm;min-height:140mm;border:1px solid #263c31;padding:6mm}.brand{font-size:23px;font-weight:800;letter-spacing:1px}.kind{margin:3mm 0 5mm;color:#20563e;font-weight:700;text-transform:uppercase}.id{font-size:16px;font-weight:700;border-block:1px solid #aaa;padding:3mm 0}.section{margin-top:5mm}.section h2{font-size:12px;text-transform:uppercase;color:#53635b;margin:0 0 2mm}.recipient{font-size:18px;font-weight:700}.address{font-size:16px;line-height:1.4;overflow-wrap:anywhere}.phone{font-size:17px;font-weight:700;margin-top:2mm}.items{padding-left:5mm}.items li{margin:1mm 0}.payment{border:2px solid #20563e;padding:3mm;font-weight:700;margin-top:5mm}.footer{font-size:10px;color:#59675f;margin-top:4mm}@media screen{body{background:#eef1ee;padding:20px}.label{background:white;margin:auto;box-shadow:0 4px 20px #0002}}@media print{.label{border:0}}</style>
  <main class="label"><div class="brand">VEGA STORE</div><div class="kind">Etiqueta de entrega local · Mensajería propia</div><div class="id">PEDIDO ${escape(order.id)}</div>
  <section class="section"><h2>Entregar a</h2><div class="recipient">${escape(order.customerName)}</div><div class="address">${escape(order.shippingAddress.addressLine)}<br>${escape(order.shippingAddress.municipality)}, ${escape(order.shippingAddress.department)}</div><div class="phone">${escape(order.customerPhone)}</div></section>
  <section class="section"><h2>Contenido</h2><ul class="items">${lines}</ul></section>
  <div class="payment">${due ? `RECAUDAR AL ENTREGAR · ${money(due)}` : `PAGO REGISTRADO · ${money(order.totalCents)}`}</div><div class="footer">Etiqueta interna de preparación. No es una guía emitida por una transportadora.<br>Creado ${escape(new Date(order.createdAt).toLocaleString('es-CO'))}</div></main><script>window.addEventListener('load',()=>window.print())</script></html>`;
}

function money(value: number): string { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value / 100); }
function escape(value: string): string { return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] || c); }
