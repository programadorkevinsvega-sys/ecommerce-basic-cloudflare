import { BlogPostDto } from '../gateways/cms/CmsGateway.js';

export function renderProductGuides(title = '', content = '', posts: BlogPostDto[] = []): string {
  const guide = content.trim() ? `<article class="product-guide-copy"><h3>${escapeHtml(title.trim() || 'Guía de uso')}</h3>${content.trim().split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`).join('')}</article>` : '';
  const articles = posts.length ? `<div class="product-guide-articles"><h3>Artículos relacionados</h3><ul>${posts.map((post) => `<li><a href="/blog/${encodeURIComponent(post.slug)}">${escapeHtml(post.title)} <span aria-hidden="true">↗</span></a>${post.excerpt ? `<p>${escapeHtml(post.excerpt)}</p>` : ''}</li>`).join('')}</ul></div>` : '';
  if (!guide && !articles) return '';
  return `<section class="product-guides" aria-labelledby="product-guides-title"><div class="section-heading"><div><span class="eyebrow">Información útil</span><h2 id="product-guides-title">Guías para este producto</h2></div></div>${guide}${articles}</section>`;
}

function escapeHtml(value: string): string { return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
