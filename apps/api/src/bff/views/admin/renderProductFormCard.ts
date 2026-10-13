import { ShippingZoneDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderProductFormCard(shippingZones: ShippingZoneDto[] = []): string {
  const localZones = shippingZones.filter((z) => z.type !== 'national');
  const zoneOptions = localZones.map((z) =>
    `<option value="${escapeHtml(z.id)}">${escapeHtml(z.name)} (${escapeHtml(z.type)})</option>`
  ).join('');

  return `
    <div class="card">
      <h2 id="pFormTitle">Crear Nuevo Producto</h2>
      <form id="newProductForm">
        <input type="hidden" id="pEditId" value="" />
        <div class="form-grid">
          <div><label>Nombre</label><input type="text" id="pName" required placeholder="Ej. Camiseta Negra" /></div>
          <div><label>Slug / Handle</label><input type="text" id="pSlug" required placeholder="camiseta-negra" /></div>
          <div><label>SKU</label><input type="text" id="pSku" required placeholder="TSHIRT-001" /></div>
          <div><label>Precio en COP</label><input type="number" id="pPrice" required placeholder="80000" /></div>
          <div><label>Stock</label><input type="number" id="pStock" required value="10" /></div>
          <div>
            <label>Condición</label>
            <select id="pCondition"><option value="new">Nuevo</option><option value="used">Usado</option><option value="refurbished">Reacondicionado</option></select>
          </div>
          <div><label>Marca / Fabricante</label><input type="text" id="pBrand" placeholder="Vega Clothing" /></div>
          <div><label>Tipo de Producto</label><input type="text" id="pType" placeholder="Ropa / Camisetas" /></div>
          <div><label>Código de Barras (GTIN)</label><input type="text" id="pGtin" placeholder="7701234567890" /></div>
          <div><label>Etiquetas (separadas por coma)</label><input type="text" id="pTags" placeholder="verano, algodon, basico" /></div>
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
          <label>Especificaciones Técnicas (JSON)</label>
          <textarea id="pSpecs" rows="2" placeholder='{"material": "100% Algodón", "talla": "M"}'></textarea>
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
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
