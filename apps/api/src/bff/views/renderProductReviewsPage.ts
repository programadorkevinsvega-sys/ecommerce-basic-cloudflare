import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductReviewDto, ProductReviewSummaryDto } from '../gateways/reviews/ReviewsGateway.js';

export function renderProductReviewsPage(input: {
  product: CatalogProductDto; summary: ProductReviewSummaryDto; items: ProductReviewDto[];
  page: number; pageSize: number; total: number; canReview: boolean; alreadyReviewed: boolean;
}): string {
  const { product, summary, items, page, pageSize, total } = input;
  const lastPage = Math.max(1, Math.ceil(total / pageSize));
  const stars = (rating: number) => `<span class="review-stars" aria-label="${rating} de 5 estrellas">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)}</span>`;
  const cards = items.length ? items.map((review) => `<article class="review-card"><header>${stars(review.rating)}<time datetime="${escapeHtml(review.createdAt)}">${formatDate(review.createdAt)}</time></header><p>${escapeHtml(review.comment)}</p><span class="review-buyer">${review.source==='verified'?'Comprador verificado':'Opinión'}</span></article>`).join('') : '<p class="review-empty">Aún no hay opiniones para este producto. Cuando alguien que lo haya recibido comparta su experiencia, aparecerá aquí.</p>';
  const form = input.alreadyReviewed
    ? '<p class="review-notice">Ya enviaste una opinión para este producto.</p>'
    : input.canReview ? `<form class="review-form" id="product-review-form"><h2>Cuéntanos tu experiencia</h2><fieldset><legend>Tu puntuación</legend><div class="review-rating-input">${[5,4,3,2,1].map((score) => `<label><input type="radio" name="rating" value="${score}" required><span aria-label="${score} estrellas">${'★'.repeat(score)}</span></label>`).join('')}</div></fieldset><label for="review-comment">Comentario</label><textarea id="review-comment" name="comment" minlength="10" maxlength="2000" required placeholder="¿Qué te pareció el producto?"></textarea><button type="submit">Publicar opinión</button><p id="review-form-message" role="status" aria-live="polite"></p></form>`
    : '<p class="review-notice">Solo pueden opinar clientes con sesión iniciada que hayan recibido este producto. <a href="/auth/login">Inicia sesión</a> para comprobar si puedes participar.</p>';
  const pages = lastPage > 1 ? `<nav class="review-pagination" aria-label="Paginación de opiniones">${page > 1 ? `<a href="?page=${page - 1}#opiniones">Opiniones anteriores</a>` : '<span></span>'}<span>Página ${page} de ${lastPage}</span>${page < lastPage ? `<a href="?page=${page + 1}#opiniones">Opiniones siguientes</a>` : '<span></span>'}</nav>` : '';
  const average = summary.count ? `<strong>${summary.average.toFixed(1)}</strong>${stars(Math.round(summary.average))}<span>${summary.count} ${summary.count === 1 ? 'opinión' : 'opiniones'}</span>` : '<span>Sin valoraciones todavía</span>';
  return `<nav class="detail-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span>/</span><a href="/productos/${encodeURIComponent(product.slug)}">${escapeHtml(product.name)}</a><span>/</span><span aria-current="page">Opiniones</span></nav><section class="reviews-page" id="opiniones"><a class="reviews-back" href="/productos/${encodeURIComponent(product.slug)}">← Volver al producto</a><h1>Opiniones de ${escapeHtml(product.name)}</h1><div class="reviews-overview">${average}</div><div class="reviews-list">${cards}</div>${pages}<section class="review-write">${form}</section></section>${input.canReview && !input.alreadyReviewed ? submitScript(product.slug) : ''}`;
}

function submitScript(slug: string): string {
  const endpoint = JSON.stringify(`/api/v1/products/${encodeURIComponent(slug)}/reviews`);
  return `<script>document.getElementById('product-review-form')?.addEventListener('submit',async(event)=>{event.preventDefault();const form=event.currentTarget;const message=document.getElementById('review-form-message');const button=form.querySelector('button[type="submit"]');button.disabled=true;message.textContent='Publicando…';try{const data=new FormData(form);const response=await fetch(${endpoint},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rating:Number(data.get('rating')),comment:String(data.get('comment')||'')})});const result=await response.json();if(!response.ok)throw new Error(result.error||'No se pudo publicar la opinión.');message.textContent='¡Gracias! Tu opinión ya está publicada.';form.reset();setTimeout(()=>location.reload(),900);}catch(error){message.textContent=error instanceof Error?error.message:'Error de conexión.';button.disabled=false;}});</script>`;
}

function formatDate(value: string): string { const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : date.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' }); }
function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] || char); }
