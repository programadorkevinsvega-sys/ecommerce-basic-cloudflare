import { CategoryDto, BrandDto, AttributeDto } from '../../gateways/catalog/CatalogGateway.js';

export function renderCatalogManagementSection(categories: CategoryDto[], brands: BrandDto[], attributes: AttributeDto[]): string {
  return `<section class="taxonomy-screen" aria-label="Gestión del catálogo">
    <header class="taxonomy-heading"><div><span>CATÁLOGO</span><h1 id="taxonomy-page-title">Categorías</h1><p id="taxonomy-page-description">Organiza los productos en categorías independientes.</p></div></header>
    ${categoryPage(categories)}${brandPage(brands)}${providerPage()}${attributePage(attributes)}${variantPage()}
  </section>`;
}

function categoryPage(categories: CategoryDto[]): string {
  const rows = categories.map((item) => `<tr><td><strong>${escapeHtml(item.name)}</strong>${item.description ? `<small>${escapeHtml(item.description)}</small>` : ''}</td><td><code>${escapeHtml(item.slug)}</code></td><td class="taxonomy-actions"><button class="taxonomy-delete" type="button" onclick="deleteCategory('${escapeHtml(item.id)}')">Eliminar</button></td></tr>`).join('');
  return page('categories', 'Categorías', 'Organiza los productos en categorías independientes.', categories.length, 'Categoría', `<form id="newCategoryForm" class="taxonomy-create-form"><label>Nombre<input type="text" id="catName" required placeholder="Ej. Camisetas"></label><label>Slug<input type="text" id="catSlug" placeholder="Autogenerado"></label><label>Descripción<input type="text" id="catDesc" placeholder="Descripción breve"></label><button type="submit" class="taxonomy-primary">Crear categoría</button><div id="catMsg" class="msg" aria-live="polite"></div></form>`, '<th>Categoría</th><th>Slug</th><th>Acciones</th>', rows, 3, 'No hay categorías registradas.');
}

function brandPage(brands: BrandDto[]): string {
  const rows = brands.map((item) => `<tr><td><strong>${escapeHtml(item.name)}</strong></td><td><code>${escapeHtml(item.slug)}</code></td><td><textarea id="brand-description-${escapeHtml(item.id)}" maxlength="500" aria-label="Descripción de ${escapeHtml(item.name)}">${escapeHtml(item.description || '')}</textarea><button type="button" class="taxonomy-save" onclick="saveBrandDescription('${escapeHtml(item.id)}')">Guardar</button></td></tr>`).join('');
  const form = `<form id="newBrandForm" class="taxonomy-create-form"><label>Nombre<input type="text" id="brandName" required placeholder="Ej. Vega Eyewear"></label><label>Slug<input type="text" id="brandSlug" placeholder="Autogenerado"></label><label>Descripción<textarea id="brandDescription" maxlength="500" placeholder="Descripción pública"></textarea></label><label>Sitio web<input type="url" id="brandWeb" placeholder="https://..."></label><button type="submit" class="taxonomy-primary">Crear marca</button><div id="brandMsg" class="msg" aria-live="polite"></div></form>`;
  return page('brands', 'Marcas', 'Administra marcas y su información pública.', brands.length, 'Marca', form, '<th>Marca</th><th>Slug</th><th>Descripción pública</th>', rows, 3, 'No hay marcas registradas.');
}

function providerPage(): string {
  return page('providers', 'Proveedores', 'Consulta proveedores registrados.', 0, 'Proveedor', '<p class="taxonomy-notice">El catálogo actual no cuenta con una entidad ni operaciones independientes para proveedores. Esta tabla queda separada de Marcas y no muestra registros ficticios.</p>', '<th>Proveedor</th><th>Identificación</th><th>Contacto</th><th>Estado</th>', '', 4, 'Aún no hay proveedores registrados.');
}

function attributePage(attributes: AttributeDto[]): string {
  const rows = attributes.map((item) => `<tr><td><strong>${escapeHtml(item.name)}</strong></td><td><code>${escapeHtml(item.code)}</code></td><td>${escapeHtml(item.type)}</td><td>${(item.options || []).map((option) => `<span class="taxonomy-option">${escapeHtml(option)}</span>`).join(' ') || '—'}</td></tr>`).join('');
  const form = `<form id="newAttributeForm" class="taxonomy-create-form"><label>Nombre<input type="text" id="attrName" required placeholder="Ej. Talla"></label><label>Código<input type="text" id="attrCode" required placeholder="size"></label><label>Tipo<select id="attrType"><option value="select">Selección</option><option value="text">Texto</option><option value="number">Numérico</option></select></label><label>Opciones separadas por coma<input type="text" id="attrOptions" placeholder="S, M, L"></label><button type="submit" class="taxonomy-primary">Crear atributo</button><div id="attrMsg" class="msg" aria-live="polite"></div></form>`;
  return page('attributes', 'Atributos', 'Define características disponibles para asignar a productos.', attributes.length, 'Atributo', form, '<th>Atributo</th><th>Código</th><th>Tipo</th><th>Opciones</th>', rows, 4, 'No hay atributos registrados.');
}

function variantPage(): string {
  return page('variants', 'Variantes', 'Consulta variantes registradas en el catálogo.', 0, 'Variante', '<p class="taxonomy-notice">Actualmente el catálogo guarda atributos en cada producto, pero no tiene una entidad independiente de variantes con SKU, precio y stock propios.</p>', '<th>Variante</th><th>Producto</th><th>SKU</th><th>Stock</th>', '', 4, 'Aún no hay variantes registradas.');
}

function page(key: string, title: string, description: string, count: number, noun: string, form: string, headings: string, rows: string, columns: number, empty: string): string {
  const body = rows || `<tr><td colspan="${columns}" class="taxonomy-empty">${empty}</td></tr>`;
  return `<section class="taxonomy-page" data-taxonomy-page="${key}" data-taxonomy-description="${escapeHtml(description)}" hidden><div class="taxonomy-list-card"><div class="taxonomy-list-heading"><div><h2>${title}</h2><p>${count} ${noun}${count === 1 ? '' : 's'}</p></div></div>${form}<div class="taxonomy-table-scroll"><table class="taxonomy-table"><thead><tr>${headings}</tr></thead><tbody>${body}</tbody></table></div></div></section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
