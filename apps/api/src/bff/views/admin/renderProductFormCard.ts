import { ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';
import { BrandDto } from '../../gateways/catalog/CatalogGateway.js';
import { AttributeDto } from '../../gateways/catalog/CatalogGateway.js';
import { CatalogProductTagDto } from '../../gateways/catalog/CatalogGateway.js';
import { BlogPostDto } from '../../gateways/cms/CmsGateway.js';

export function renderProductFormCard(shippingZones: ShippingZoneDto[] = [], taxRatePercent = 19, brands: BrandDto[] = [], legacyBrandNames: string[] = [], attributes: AttributeDto[] = [], productTags: CatalogProductTagDto[] = [], blogPosts: BlogPostDto[] = []): string {
  const localZones = shippingZones.filter((z) => z.type !== 'national' && z.isActive);
  const registeredBrands = brands.filter((brand) => brand.status !== 'inactive').map((brand) => brand.name);
  const registeredNames = new Set(registeredBrands.map((name) => name.toLocaleLowerCase()));
  const legacyBrands = [...new Set(legacyBrandNames.map((name) => name.trim()).filter((name) => name && !registeredNames.has(name.toLocaleLowerCase())))];
  const brandOptions = `${registeredBrands.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('')}${legacyBrands.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)} (marca histórica)</option>`).join('')}`;
  const zoneOptions = localZones.map((z) =>
    `<option value="${escapeHtml(z.id)}">${escapeHtml(z.name)} (${escapeHtml(z.type)})</option>`
  ).join('');
  const attributeFields = attributes.filter((attribute) => attribute.status !== 'inactive').map((attribute) => {
    const fieldId = `pAttr-${escapeHtml(attribute.code)}`;
    const control = attribute.type === 'select' || attribute.options.length > 0
      ? `<select id="${fieldId}" data-product-attribute="${escapeHtml(attribute.code)}"><option value="">Sin especificar</option>${attribute.options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join('')}</select>`
      : `<input id="${fieldId}" data-product-attribute="${escapeHtml(attribute.code)}" type="${attribute.type === 'number' ? 'number' : 'text'}" />`;
    return `<div><label for="${fieldId}">${escapeHtml(attribute.name)}</label>${control}</div>`;
  }).join('');
  const tagOptions = productTags.map((tag) => `<option value="${escapeHtml(tag.name)}" ${tag.status === 'inactive' ? 'disabled' : ''}>${escapeHtml(tag.name)}${tag.status === 'inactive' ? ' (inactiva)' : ''}</option>`).join('');
  const blogPostOptions = blogPosts.filter((post) => post.status === 'published').map((post) => `<option value="${escapeHtml(post.id)}">${escapeHtml(post.title)}</option>`).join('');

  return `
    <div id="product-modal" class="product-modal" hidden>
      <button class="product-modal-backdrop" type="button" onclick="closeProductModal()" aria-label="Cerrar formulario"></button>
      <section class="product-modal-dialog" role="dialog" aria-modal="true" aria-labelledby="pFormTitle" tabindex="-1">
        <header class="product-modal-heading"><div><h2 id="pFormTitle">Crear Nuevo Producto</h2><p>Completa la información del producto y sus opciones de venta.</p></div><button class="product-modal-close" type="button" onclick="closeProductModal()" aria-label="Cerrar">×</button></header>
        <div class="product-modal-body"><div class="card">
      <form id="newProductForm">
        <input type="hidden" id="pEditId" value="" />
        <input type="hidden" id="productTaxRate" value="${taxRatePercent}" />
        <input type="hidden" id="transactionShippingCents" value="${Math.max(0, ...shippingZones.filter((zone) => zone.isActive).map((zone) => zone.priceInCents))}" />
        <div class="form-grid">
          <div><label>Nombre</label><input type="text" id="pName" required placeholder="Ej. Camiseta Negra" /></div>
          <div><label>Slug / Handle</label><input type="text" id="pSlug" required placeholder="camiseta-negra" /></div>
          <div><label>SKU</label><input type="text" id="pSku" required placeholder="TSHIRT-001" /></div>
          <div><label>Costo del proveedor (COP)</label><input type="text" id="pCost" data-cop-input inputmode="numeric" autocomplete="off" required placeholder="1.200.000" /><small>Escribe pesos completos; los separadores aparecen automáticamente.</small></div>
          <div><label>Objetivo de ganancia</label><select id="pTargetType" onchange="updateProductPricingTargetFields()"><option value="margin">Porcentaje sobre la venta</option><option value="profit">Valor fijo en pesos COP</option></select></div>
          <div id="pMarginWrap"><label>Margen objetivo sobre la venta neta (%)</label><input type="number" id="pMargin" min="0.01" max="99.99" step="0.01" value="20" required /><small>Porcentaje sobre venta sin IVA, no recargo sobre costo. Se calcula antes de descuentos o promociones.</small></div>
          <div id="pProfitWrap" style="display:none"><label>Ganancia neta objetivo (COP)</label><input type="text" id="pTargetProfit" data-cop-input inputmode="numeric" autocomplete="off" placeholder="20.000" /><small>Escribe pesos completos. El sistema calcula el precio para obtener esta ganancia estimada después del costo del proveedor, IVA y comisión Wompi.</small></div>
          <div class="form-field-full"><label>Precio bruto recomendado del producto (IVA incluido, COP)</label><input type="text" id="pPrice" data-cop-input inputmode="numeric" readonly required /><div id="pPriceBreakdown" aria-live="polite">El cálculo mostrará el precio bruto, el IVA, el costo del proveedor, la ganancia neta y el margen estimados.</div></div>
          <div class="form-field-full"><label>Medios de pago habilitados</label><label><input type="checkbox" id="pPayWompi" checked /> Wompi (comisión estimada incluida en el precio)</label><small>El pago contra entrega se controla en la opción “Contra Entrega” de abajo. Debe estar permitido para que aparezca en el checkout. Mercado Pago no está disponible hasta integrar y verificar su flujo.</small></div>
          <div><label for="pStock">Stock total</label><input type="number" id="pStock" min="0" max="100000" step="1" required value="10" /><small>En edición, cambiar este valor requiere aplicarlo explícitamente al inventario operativo.</small><div id="pStockSyncOption" style="display:none;margin-top:0.5rem"><label><input type="checkbox" id="pSyncStockToInventory" /> Aplicar cambio de stock al inventario operativo</label><small>El ajuste conserva las unidades reservadas y se rechaza si el nuevo stock total queda por debajo de ellas.</small></div></div>
          <div>
            <label>Condición</label>
            <select id="pCondition"><option value="new">Nuevo</option><option value="used">Usado</option><option value="refurbished">Reacondicionado</option></select>
          </div>
          <div><label>Marca / Fabricante</label><select id="pBrand"><option value="">Sin marca</option>${brandOptions}</select><small>Las marcas se administran en Catálogo → Marcas.</small></div>
          <div><label>Tipo de Producto</label><input type="text" id="pType" placeholder="Ropa / Camisetas" /></div>
          <div><label>Código de Barras (GTIN)</label><input type="text" id="pGtin" placeholder="7701234567890" /></div>
          <div class="form-field-full"><label for="pTags">Etiquetas</label><select id="pTags" multiple size="4">${tagOptions}</select><small>Selecciona las etiquetas para este producto. Créelas o adminístralas desde Catálogo → Etiquetas.</small></div>
          <fieldset class="form-field-full"><legend>Guía específica del producto</legend><label for="pGuideTitle">Título de la guía</label><input id="pGuideTitle" maxlength="140" placeholder="Ej. Cómo elegir la talla"></input><label for="pGuideContent">Contenido de la guía</label><textarea id="pGuideContent" rows="5" maxlength="12000" placeholder="Escribe instrucciones, recomendaciones de uso o cuidado. El contenido se mostrará como texto seguro en la ficha."></textarea><label for="pRelatedBlogPosts">Artículos del blog relacionados</label><select id="pRelatedBlogPosts" multiple size="5">${blogPostOptions}</select><small>Se mostrarán enlaces a artículos publicados. Administra su contenido en Marketing → Blog.</small>${blogPostOptions ? '' : '<small>Aún no hay artículos publicados para asociar.</small>'}</fieldset>
          <fieldset class="form-field-full"><legend>Empaque para transportadora</legend><p>Registra la unidad tal como se enviará dentro de su empaque individual. Se usa para calcular qué caja del inventario de empaques admite el pedido. Las medidas iniciales están estimadas; verifica y corrige con el producto empacado.</p><div class="form-grid"><div><label for="pPackedWidth">Ancho empacado (cm)</label><input id="pPackedWidth" type="number" min="1" max="300" step="1" inputmode="numeric" /></div><div><label for="pPackedLength">Largo empacado (cm)</label><input id="pPackedLength" type="number" min="1" max="300" step="1" inputmode="numeric" /></div><div><label for="pPackedHeight">Alto empacado (cm)</label><input id="pPackedHeight" type="number" min="1" max="300" step="1" inputmode="numeric" /></div><div><label for="pPackedWeight">Peso empacado (gramos)</label><input id="pPackedWeight" type="number" min="1" max="100000" step="1" inputmode="numeric" /></div></div></fieldset>
          <div>
            <label>Contra Entrega</label>
            <select id="pCod"><option value="true">Sí (Permitido)</option><option value="false">No (Anticipado)</option></select>
          </div>
          <div>
            <label>Alcance de Envío</label>
            <select id="pScope" onchange="onProductScopeChange()">
              <option value="national">Nacional (Todo el país)</option>
              <option value="local">Local (Zonas exclusivas)</option>
            </select>
          </div>
          <div>
            <label>Modalidad de Venta</label>
            <select id="pSaleMode"><option value="both" selected>Contado y Crédito</option><option value="cash">Solo Contado</option><option value="credit">Solo Crédito</option></select>
          </div>
        </div>

        <div id="pLocalZonesWrapper" style="display:none; margin-top:0.75rem; margin-bottom:1rem;">
          <label>Zonas Locales con Cobertura para este Producto</label>
          <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:0.25rem;">
            Selecciona las zonas que cubren este producto:
          </div>
          <select id="pLocalZones" multiple size="3" style="height:auto; min-height:80px;">
            ${zoneOptions || '<option value="" disabled>No hay zonas locales registradas</option>'}
          </select>
        </div>

        <div style="margin-bottom: 1rem;">
          <label>Descripción</label>
          <textarea id="pDesc" rows="2" required placeholder="Descripción detallada del producto..."></textarea>
        </div>
        <div style="margin-bottom: 1rem;">
          <h3>Atributos del producto</h3>
          <p>Los valores seleccionados se guardan con las especificaciones del producto.</p>
          <div class="form-grid" id="productAttributes">${attributeFields || '<p>No hay atributos configurados. Crea opciones desde Catálogo → Atributos.</p>'}</div>
        </div>
        <div style="margin-bottom: 1rem;">
          <input type="hidden" id="pSpecs" value="{}" />
          <p>Las características del producto se configuran en Catálogo → Atributos y aquí se seleccionan sus valores.</p>
        </div>

        <div style="border: 1px dashed #475569; border-radius: 8px; padding: 1rem; margin-bottom: 1rem; background: #0f172a;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">
            <label style="margin:0; font-weight:700; color:#e2e8f0;">🖼️ Imágenes del Producto (Máximo 5)</label>
            <span id="pImageUploadStatus" style="font-size:0.8rem; color:#94a3b8;"></span>
          </div>
          <div id="pMediaGrid" style="display:flex; gap:0.6rem; flex-wrap:wrap; margin-bottom:0.75rem;"></div>
          <div>
            <input type="file" id="pMediaFileInput" accept="image/png,image/jpeg,image/webp,image/avif" multiple style="margin-bottom:0.35rem;" onchange="handleProductImageSelected(this)" />
            <input type="hidden" id="pMediaIdsJson" value="[]" />
            <div style="font-size:0.75rem; color:#94a3b8;">
              Puedes subir hasta 5 imágenes (la primera será la principal). Se guardan directamente en Cloudflare R2.
            </div>
          </div>
        </div>

        <div style="border-top: 1px solid #334155; padding-top: 1rem; margin-top: 1rem;">
          <h3>Optimización para Motores de Búsqueda (SEO)</h3>
          <div class="form-grid" style="margin-top: 0.75rem;">
            <div>
              <label>Título SEO <span id="titleCount" class="char-count">0/70 car.</span></label>
              <input type="text" id="pSeoTitle" placeholder="Vacío usa el nombre del producto" />
            </div>
            <div><label>URL Canónica</label><input type="url" id="pCanonical" placeholder="Autogenerado: https://tienda.com/productos/slug" /></div>
          </div>
          <div style="margin-bottom: 0.75rem;">
            <label>Meta Descripción SEO <span id="descCount" class="char-count">0/160 car.</span></label>
            <textarea id="pSeoDesc" rows="2" placeholder="Vacío usa el inicio de la descripción del producto"></textarea>
          </div>
          <div style="display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem;">
            <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
              <input type="checkbox" id="pNoindex" style="width: auto;" /> Ocultar de motores de búsqueda (noindex)
            </label>
          </div>

          <label>Vista previa de Google (SERP Preview):</label>
          <div class="serp-card">
            <div id="serpTitle" class="serp-title">Título del Producto</div>
            <div id="serpUrl" class="serp-url">https://tienda.com/productos/producto-slug</div>
            <div id="serpDesc" class="serp-desc">Descripción del producto...</div>
          </div>
        </div>

        <div style="margin-top: 1.5rem;">
          <button type="submit" class="btn-primary" id="pSubmitBtn">Guardar Producto</button>
          <button type="button" class="btn-action" id="pCancelBtn" style="display:none; padding:0.75rem 1rem;" onclick="resetProductForm()">Cancelar Edición</button>
          <div id="pMsg" class="msg"></div>
        </div>
      </form>
        </div></div>
      </section>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
