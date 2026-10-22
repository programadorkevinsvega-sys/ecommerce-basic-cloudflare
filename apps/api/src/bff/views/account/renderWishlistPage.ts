export interface WishlistPageProduct {
  id: string;
  name: string;
  slug: string;
  priceInCents: number;
  imageMediaId?: string;
}
export interface WishlistPageEntry { productId: string; createdAt: string; product: WishlistPageProduct | null; }
export interface WishlistPageProps { items: WishlistPageEntry[]; total: number; page: number; pageSize: number; }

export function renderWishlistPage(props: WishlistPageProps): string {
  const cards = props.items.map((entry) => {
    const product = entry.product;
    const image = product?.imageMediaId ? '<img src="/media/' + encodeURIComponent(product.imageMediaId) + '" alt="' + escapeHtml(product.name) + '" loading="lazy">' : '<span class="image-empty" aria-hidden="true">♡</span>';
    const name = product ? '<a href="/productos/' + encodeURIComponent(product.slug) + '">' + escapeHtml(product.name) + '</a>' : '<span>Producto no disponible</span><p>Este producto ya no está publicado o fue retirado.</p>';
    const price = product ? '<p class="price">' + formatPrice(product.priceInCents) + '</p>' : '';
    return '<article class="item-card" data-wishlist-item="' + escapeHtml(entry.productId) + '">' + image + '<div class="item-copy">' + name + price + '<small>Guardado el ' + escapeHtml(new Date(entry.createdAt).toLocaleDateString('es-CO')) + '</small></div><button type="button" class="remove-button" data-remove-wishlist="' + escapeHtml(entry.productId) + '">Quitar de favoritos</button></article>';
  }).join('');
  const empty = props.total === 0 ? '' : ' hidden';
  const emptyState = '<div id="wishlist-empty" class="empty-state"' + empty + '><h2>Aún no tienes favoritos</h2><p>Guarda los productos que te interesan y vuelve a ellos cuando quieras.</p><a href="/productos">Explorar catálogo</a></div>';
  const previous = props.page > 1 ? '<a href="/cuenta/favoritos?page=' + (props.page - 1) + '">Anterior</a>' : '';
  const next = props.page * props.pageSize < props.total ? '<a href="/cuenta/favoritos?page=' + (props.page + 1) + '">Siguiente</a>' : '';
  const listHidden = props.items.length === 0 ? ' hidden' : '';
  return '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Mis favoritos | Vega Store</title><style>' + styles + '</style></head><body><header><a class="brand" href="/">VEGA STORE</a><nav><a href="/cuenta">Mi cuenta</a><a href="/productos">Catálogo</a></nav></header><main><p class="eyebrow">MI CUENTA</p><h1>Mis favoritos</h1><p class="intro">Productos que guardaste para consultar más adelante.</p><p id="wishlist-message" role="status" aria-live="polite" hidden></p><section id="wishlist-items"' + listHidden + '>' + cards + '</section>' + emptyState + '<nav class="pagination" aria-label="Paginación de favoritos">' + previous + '<span>' + String(props.total) + ' producto(s) guardado(s)</span>' + next + '</nav></main><script>' + script + '</script></body></html>';
}

function formatPrice(cents: number): string {
  return (cents / 100).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
}
function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] || char));
}
const styles = 'body{margin:0;background:#f2f4ef;color:#18211c;font-family:system-ui,-apple-system,Segoe UI,sans-serif}header{display:flex;justify-content:space-between;gap:1rem;align-items:center;padding:1rem max(1.25rem,calc((100% - 1040px)/2));background:#fff;border-bottom:1px solid #dfe5dc}header a{color:#20563c;text-decoration:none;font-weight:700;margin-right:1rem}.brand{letter-spacing:.06em}main{max-width:1040px;margin:2rem auto 5rem;padding:0 1.25rem}.eyebrow{font-size:.75rem;letter-spacing:.13em;font-weight:800;color:#20563c}h1{font-size:clamp(2rem,4vw,3rem);margin:.4rem 0}.intro{color:#68736b}.item-card{display:grid;grid-template-columns:100px minmax(0,1fr) auto;gap:1rem;align-items:center;background:#fff;border:1px solid #dfe5dc;border-radius:14px;padding:1rem;margin:1rem 0}.item-card img,.image-empty{width:100px;height:100px;object-fit:cover;border-radius:10px;background:#f5f7f4;display:grid;place-items:center}.item-copy a{font-weight:750;color:#18211c;text-decoration:none}.price{font-weight:750;color:#20563c}.item-copy small{color:#68736b}.remove-button{padding:.65rem .85rem;border:1px solid #dfc9c6;background:#fff;color:#8f2828;border-radius:8px;cursor:pointer}.empty-state{margin:1rem 0;padding:2rem;background:#fff;border:1px solid #dfe5dc;border-radius:14px}.empty-state a{color:#20563c;font-weight:700}.pagination{display:flex;justify-content:space-between;gap:1rem;align-items:center;margin-top:1.5rem}.pagination a{color:#20563c;font-weight:700}@media(max-width:620px){header{flex-wrap:wrap;padding:1rem}main{margin-top:1.25rem}.item-card{grid-template-columns:72px minmax(0,1fr);gap:.75rem}.item-card img,.image-empty{width:72px;height:72px}.remove-button{grid-column:2;justify-self:start}.pagination{font-size:.85rem}}';
const script = "document.querySelectorAll('[data-remove-wishlist]').forEach(function(button){button.addEventListener('click',async function(){var productId=button.getAttribute('data-remove-wishlist');var message=document.getElementById('wishlist-message');button.disabled=true;button.setAttribute('aria-busy','true');try{var response=await fetch('/api/v1/customer/wishlist/items/'+encodeURIComponent(productId),{method:'DELETE'});if(!response.ok){message.hidden=false;message.textContent='No se pudo quitar el producto. Inténtalo de nuevo.';return;}var card=button.closest('[data-wishlist-item]');var remaining=document.querySelectorAll('[data-wishlist-item]').length;if(remaining===1){var currentPage=Number(new URL(window.location.href).searchParams.get('page')||'1');window.location.assign('/cuenta/favoritos?page='+Math.max(1,currentPage-1));return;}if(card)card.remove();message.hidden=false;message.textContent='Producto quitado de favoritos.';}catch{message.hidden=false;message.textContent='Error de conexión. Inténtalo de nuevo.';}finally{button.disabled=false;button.removeAttribute('aria-busy');}});});";
