import { CategoryDto, BrandDto, AttributeDto } from '../../gateways/catalog/CatalogGateway.js';

export function renderCatalogManagementSection(
  categories: CategoryDto[],
  brands: BrandDto[],
  attributes: AttributeDto[]
): string {
  const catRows = categories.map((c) => `
    <tr>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;">${escapeHtml(c.name)}</td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155; font-family:monospace;">${escapeHtml(c.slug)}</td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right;">
        <button class="btn-action btn-action-delete" onclick="deleteCategory('${c.id}')">Eliminar</button>
      </td>
    </tr>
  `).join('');

  const brandRows = brands.map((b) => `
    <tr>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;">${escapeHtml(b.name)}</td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155; font-family:monospace;">${escapeHtml(b.slug)}</td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;">${b.websiteUrl ? `<a href="${escapeHtml(b.websiteUrl)}" target="_blank" style="color:#38bdf8;">Web</a>` : '-'}</td>
    </tr>
  `).join('');

  const attrRows = attributes.map((a) => `
    <tr>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;">${escapeHtml(a.name)}</td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155; font-family:monospace;">${escapeHtml(a.code)}</td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;"><span class="badge" style="background:#1e3a8a; color:#93c5fd;">${escapeHtml(a.type)}</span></td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;">
        ${(a.options || []).map((o) => `<span class="tag-pill">${escapeHtml(o)}</span>`).join(' ') || '-'}
      </td>
    </tr>
  `).join('');

  return `
    <div class="card" id="taxonomy-categories" tabindex="-1">
      <h2>Categorías (${categories.length})</h2>
      <form id="newCategoryForm" style="margin-bottom: 1.5rem;">
        <div class="form-grid">
          <div><label>Nombre</label><input type="text" id="catName" required placeholder="Ej. Camisetas" /></div>
          <div><label>Slug</label><input type="text" id="catSlug" placeholder="camisetas (autogenerado)" /></div>
          <div><label>Descripción</label><input type="text" id="catDesc" placeholder="Colección de camisetas" /></div>
        </div>
        <button type="submit" class="btn-primary">Crear Categoría</button>
        <div id="catMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Nombre</th><th>Slug</th><th style="text-align:right;">Acción</th></tr></thead>
        <tbody>${catRows || '<tr><td colspan="3" style="text-align:center; padding:1rem; color:#94a3b8;">No hay categorías registradas</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card" id="taxonomy-brands" tabindex="-1">
      <h2>Marcas y Proveedores (${brands.length})</h2>
      <form id="newBrandForm" style="margin-bottom: 1.5rem;">
        <div class="form-grid">
          <div><label>Nombre de Marca / Proveedor</label><input type="text" id="brandName" required placeholder="Ej. Nike, Vega Basic" /></div>
          <div><label>Slug</label><input type="text" id="brandSlug" placeholder="nike" /></div>
          <div><label>Sitio Web Oficial</label><input type="url" id="brandWeb" placeholder="https://..." /></div>
        </div>
        <button type="submit" class="btn-primary">Guardar Marca / Proveedor</button>
        <div id="brandMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Marca</th><th>Slug</th><th>Sitio Web</th></tr></thead>
        <tbody>${brandRows || '<tr><td colspan="3" style="text-align:center; padding:1rem; color:#94a3b8;">No hay marcas registradas</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card" id="taxonomy-attributes" tabindex="-1">
      <h2>Atributos y Variantes (Tallas, Colores, Dimensiones)</h2>
      <form id="newAttributeForm" style="margin-bottom: 1.5rem;">
        <div class="form-grid">
          <div><label>Nombre del Atributo</label><input type="text" id="attrName" required placeholder="Ej. Talla, Color, Medidas" /></div>
          <div><label>Código Interno</label><input type="text" id="attrCode" required placeholder="size, color, dimensions" /></div>
          <div>
            <label>Tipo</label>
            <select id="attrType"><option value="select">Selección (Opciones múltiples)</option><option value="text">Texto Libre</option><option value="number">Numérico</option></select>
          </div>
          <div style="grid-column: 1 / -1;"><label>Opciones separadas por coma</label><input type="text" id="attrOptions" placeholder="S, M, L, XL, XXL o Rojo, Negro, Blanco" /></div>
        </div>
        <button type="submit" class="btn-primary">Crear Atributo</button>
        <div id="attrMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Nombre</th><th>Código</th><th>Tipo</th><th>Opciones Definidas</th></tr></thead>
        <tbody>${attrRows || '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8;">No hay atributos definidos</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
