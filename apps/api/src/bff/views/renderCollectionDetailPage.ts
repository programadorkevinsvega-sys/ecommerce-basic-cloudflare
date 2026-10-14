import { CatalogCollectionDto, CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';
import { ProductDiscountDto } from '../gateways/promotions/PromotionsGateway.js';
import { renderStorefrontProductCard } from './renderStorefrontProductCard.js';

export function renderCollectionDetailPage(collection:CatalogCollectionDto,products:CatalogProductDto[],discounts?:Map<string,ProductDiscountDto>):string {
  const cards=products.map((product)=>renderStorefrontProductCard(product,discounts?.get(product.id))).join('');
  return `<nav class="catalog-breadcrumb" aria-label="Ruta de navegación"><a href="/">Inicio</a><span aria-hidden="true">/</span><a href="/colecciones">Colecciones</a><span aria-hidden="true">/</span><span aria-current="page">${escapeHtml(collection.name)}</span></nav><header class="collection-detail-hero"><span class="eyebrow">Colección Vega Store</span><h1>${escapeHtml(collection.name)}</h1><p>${escapeHtml(collection.description)}</p></header><section class="products-section"><div class="section-heading"><div><h2>Productos de esta colección</h2><p>${products.length} productos disponibles</p></div></div>${products.length?`<div class="grid">${cards}</div>`:`<p class="collection-products-empty">Esta colección aún no tiene productos disponibles.</p>`}</section>`;
}
function escapeHtml(value:string):string{return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;');}
