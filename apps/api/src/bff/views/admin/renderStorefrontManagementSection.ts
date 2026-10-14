import { BannerItemDto, AnnouncementItemDto } from '../../gateways/storefront/StorefrontGateway.js';
import type { MarketingDestinationOption } from './AdminDashboardProps.js';
import { renderMarketingDestinationOptions } from './renderMarketingDestinationOptions.js';

export function renderStorefrontManagementSection(
  banners: BannerItemDto[],
  announcements: AnnouncementItemDto[],
  destinations: MarketingDestinationOption[] = []
): string {
  const promoBanners = banners.filter((b) => b.bannerType !== 'informative');
  const infoBanners = banners.filter((b) => b.bannerType === 'informative');
  const savedPlacements = [...new Set([...banners.map((item) => item.placement), ...announcements.map((item) => item.placement)])];
  const destinationOptions = renderMarketingDestinationOptions(destinations, savedPlacements);
  const bannerPlacements = '<option value="home">Inicio</option><option value="category">Categorías</option><option value="product">Producto</option><option value="checkout">Checkout</option><option value="catalog">Catálogo</option><option value="brands">Directorio de marcas</option><option value="collections">Directorio de colecciones</option><option value="blog">Blog</option><option value="cms">Páginas CMS</option>';
  const bannerFilterPlacements = `${bannerPlacements}${destinationOptions}`;
  const announcementPlacements = '<option value="top_bar">Barra superior (todas las páginas)</option><option value="home">Inicio</option><option value="products">Catálogo</option><option value="catalog">Catálogo</option><option value="brands">Directorio de marcas</option><option value="collections">Directorio de colecciones</option><option value="blog">Blog</option><option value="cms">Páginas CMS</option>';

  const renderRows = (items: BannerItemDto[], isPromo: boolean): string => {
    if (items.length === 0) {
      return '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8;">No hay banners en esta sección</td></tr>';
    }
    return items.map((b) => {
      const toggle = b.isActive
        ? `<button class="btn-action btn-action-hide" onclick="setBannerStatus('${b.id}', false)">Ocultar</button>`
        : `<button class="btn-action btn-action-publish" onclick="setBannerStatus('${b.id}', true)">Publicar</button>`;

      const ctaMeta = isPromo
        ? `<div style="font-size:0.75rem; color:#6ee7b7;">Botón: "${escapeHtml(b.buttonText || 'Explorar colección')}" → ${escapeHtml(b.linkUrl)}</div>`
        : `<div style="font-size:0.75rem; color:#94a3b8;">Informativo (Sin botón de acción)</div>`;

      return `
        <tr data-banner-row="1" data-title="${escapeHtml(b.title.toLowerCase())}" data-type="${b.bannerType || 'promotional'}" data-placement="${b.placement}" data-active="${b.isActive ? 'active' : 'inactive'}">
          <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:600;">
            <div style="display:flex; align-items:center; gap:0.6rem;">
              <div style="width:40px; height:40px; border-radius:6px; background:#1e293b; overflow:hidden; flex-shrink:0; display:grid; place-items:center;">
                ${b.imageUrl ? `<img src="${escapeHtml(b.imageUrl)}" style="width:100%; height:100%; object-fit:cover;" onerror="this.style.display='none'" />` : '<span style="font-size:0.6rem; color:#64748b;">Sin img</span>'}
              </div>
              <div>
                ${escapeHtml(b.title)}
                ${ctaMeta}
                ${b.description ? `<div style="font-size:0.75rem; color:#cbd5e1; margin-top:2px;"><em>"${escapeHtml(b.description)}"</em></div>` : ''}
              </div>
            </div>
          </td>
          <td style="padding:0.6rem; border-bottom:1px solid #334155;">${escapeHtml(b.placement)}</td>
          <td style="padding:0.6rem; border-bottom:1px solid #334155;">
            ${b.isActive ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>'}
          </td>
          <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right; white-space:nowrap;">
            ${isPromo ? `<a class="btn-action btn-action-view" href="${escapeHtml(b.linkUrl)}" target="_blank">Ver</a>` : ''}
            <button class="btn-action" style="background:#475569; color:#fff;" onclick="editBanner('${b.id}', '${escapeJs(b.title)}', '${escapeJs(b.linkUrl)}', '${escapeJs(b.altText)}', '${escapeJs(b.imageUrl)}', '${b.placement}', '${escapeJs(b.description || '')}', '${b.bannerType || 'promotional'}', '${escapeJs(b.buttonText || '')}', '${b.startsAt || ''}', '${b.endsAt || ''}', '${b.sortOrder}')">Editar</button>
            <button class="btn-action" onclick="duplicateBanner('${b.id}')">Duplicar</button>
            ${toggle}
            <button class="btn-action btn-action-delete" onclick="deleteBanner('${b.id}')">Eliminar</button>
          </td>
        </tr>
      `;
    }).join('');
  };

  return `
    <dialog id="banner-preview-dialog" aria-labelledby="banner-preview-title" style="max-width:900px; border:0; border-radius:12px; padding:1.5rem;"><h2 id="banner-preview-title"></h2><p></p><img alt="" style="display:block; max-width:100%; max-height:55vh; object-fit:contain;" /><a hidden></a><form method="dialog"><button class="btn-primary">Cerrar vista previa</button></form></dialog>
    <!-- SECCIÓN 1: BANNERS HERO PROMOCIONALES CON BOTÓN -->
    <div class="card" data-marketing-page="promo-banners">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <h2 style="margin:0;">🎯 Banners Hero Promocionales (${promoBanners.length})</h2>
          <small style="color:#94a3b8;">Banners de campañas con botón CTA. Sube una foto a R2 o escribe una URL externa.</small>
        </div>
      </div>
      <form id="newPromoBannerForm" onsubmit="handleBannerSubmit(event, 'promotional')" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="pbEditId" value="" />
        <div class="form-grid">
          <div><label>Título Promocional</label><input type="text" id="pbTitle" required placeholder="Ej. Colección Verano 2026" /></div>
          <div><label>Descripción / Subtítulo</label><input type="text" id="pbDesc" placeholder="Ej. Aprovecha hasta 30% de descuento..." /></div>
          <div><label>Texto del Botón (CTA)</label><input type="text" id="pbBtnText" required value="Explorar colección" placeholder="Ej. Comprar Ahora, Ver Ofertas" /></div>
          <div><label>URL de Destino</label><input type="text" id="pbLink" required value="/productos" /></div>
          <div><label>Texto Alternativo (Alt)</label><input type="text" id="pbAlt" required placeholder="Colección destacada..." /></div>
          <div>
            <label>Ubicación</label>
            <select id="pbPlacement">${bannerPlacements}${destinationOptions}</select>
          </div>
          <div><label>Inicio (opcional)</label><input type="datetime-local" id="pbStartsAt" /></div>
          <div><label>Finalización (opcional)</label><input type="datetime-local" id="pbEndsAt" /></div>
          <div><label>Prioridad / orden</label><input type="number" id="pbSortOrder" value="0" /></div>
        </div>

        <div style="border: 1px dashed #475569; border-radius: 8px; padding: 0.9rem; margin: 0.85rem 0; background: #0f172a;">
          <label style="display:block; font-weight:700; color:#e2e8f0; margin-bottom:0.4rem;">🖼️ Imagen del Banner (Subir archivo a R2 o usar URL)</label>
          <div style="display:flex; gap:0.9rem; align-items:center; flex-wrap:wrap;">
            <div style="width:70px; height:50px; border-radius:6px; background:#1e293b; overflow:hidden; border:1px solid #334155; display:grid; place-items:center;">
              <img id="pbImgPreview" alt="Vista previa del banner" hidden style="width:100%; height:100%; object-fit:cover;" onerror="this.hidden=true;this.nextElementSibling.hidden=false" onload="this.hidden=false;this.nextElementSibling.hidden=true" /><span aria-hidden="true" style="font-size:11px; color:#687283;">Sin imagen</span>
            </div>
            <div style="flex:1; min-width:240px;">
              <input type="file" id="pbFileInput" accept="image/*" style="margin-bottom:0.4rem;" onchange="handleBannerFileUpload(this, 'pb')" />
              <input type="text" id="pbImg" value="" required placeholder="https://... o /media/..." oninput="const p=document.getElementById('pbImgPreview');p.src=this.value;p.hidden=!this.value; p.nextElementSibling.hidden=!!this.value" />
              <div id="pbUploadStatus" style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">Sube PNG/JPEG a Cloudflare R2 o pega cualquier enlace web.</div>
            </div>
          </div>
        </div>

        <button type="submit" class="btn-primary" id="pbSubmitBtn">Publicar Banner Promocional</button><button type="button" class="btn-action" onclick="previewBanner('pb', 'promotional')">Vista previa</button>
        <button type="button" class="btn-action" id="pbCancelBtn" style="display:none; padding:0.75rem 1rem;" onclick="resetPromoBannerForm()">Cancelar</button>
        <div id="pbMsg" class="msg"></div>
      </form>
      <div class="form-grid banner-filters" aria-label="Filtros de banners promocionales"><input type="search" placeholder="Buscar banner" oninput="filterBanners(this.closest('.card'))" /><select aria-label="Filtrar ubicación" onchange="filterBanners(this.closest('.card'))"><option value="">Todas las ubicaciones</option>${bannerFilterPlacements}</select><select aria-label="Filtrar estado" onchange="filterBanners(this.closest('.card'))"><option value="">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select><select aria-label="Filtrar tipo" onchange="filterBanners(this.closest('.card'))"><option value="">Todos los tipos</option><option value="promotional">Promocional</option><option value="informative">Informativo</option></select></div>
      <table>
        <thead><tr><th>Título y Botón CTA</th><th>Ubicación</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${renderRows(promoBanners, true)}</tbody>
      </table>
    </div>

    <!-- SECCIÓN 2: BANNERS HERO INFORMATIVOS SIN BOTÓN -->
    <div class="card" data-marketing-page="info-banners" style="margin-top:2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <h2 style="margin:0;">📢 Banners Hero Informativos (${infoBanners.length})</h2>
          <small style="color:#94a3b8;">Banners de comunicado sin botón CTA. Sube una foto a R2 o escribe una URL externa.</small>
        </div>
      </div>
      <form id="newInfoBannerForm" onsubmit="handleBannerSubmit(event, 'informative')" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="ibEditId" value="" />
        <div class="form-grid">
          <div><label>Título Informativo</label><input type="text" id="ibTitle" required placeholder="Ej. Envíos Nacionales Seguros" /></div>
          <div><label>Descripción / Mensaje</label><input type="text" id="ibDesc" placeholder="Ej. Calidad garantizada en todas nuestras entregas..." /></div>
          <div><label>Texto Alternativo (Alt)</label><input type="text" id="ibAlt" required placeholder="Comunicado de la tienda..." /></div>
          <div>
            <label>Ubicación</label>
            <select id="ibPlacement">${bannerPlacements}${destinationOptions}</select>
          </div>
          <div><label>Inicio (opcional)</label><input type="datetime-local" id="ibStartsAt" /></div>
          <div><label>Finalización (opcional)</label><input type="datetime-local" id="ibEndsAt" /></div>
          <div><label>Prioridad / orden</label><input type="number" id="ibSortOrder" value="0" /></div>
        </div>

        <div style="border: 1px dashed #475569; border-radius: 8px; padding: 0.9rem; margin: 0.85rem 0; background: #0f172a;">
          <label style="display:block; font-weight:700; color:#e2e8f0; margin-bottom:0.4rem;">🖼️ Imagen del Banner (Subir archivo a R2 o usar URL)</label>
          <div style="display:flex; gap:0.9rem; align-items:center; flex-wrap:wrap;">
            <div style="width:70px; height:50px; border-radius:6px; background:#1e293b; overflow:hidden; border:1px solid #334155; display:grid; place-items:center;">
              <img id="ibImgPreview" alt="Vista previa del banner" hidden style="width:100%; height:100%; object-fit:cover;" onerror="this.hidden=true;this.nextElementSibling.hidden=false" onload="this.hidden=false;this.nextElementSibling.hidden=true" /><span aria-hidden="true" style="font-size:11px; color:#687283;">Sin imagen</span>
            </div>
            <div style="flex:1; min-width:240px;">
              <input type="file" id="ibFileInput" accept="image/*" style="margin-bottom:0.4rem;" onchange="handleBannerFileUpload(this, 'ib')" />
              <input type="text" id="ibImg" value="" required placeholder="https://... o /media/..." oninput="const p=document.getElementById('ibImgPreview');p.src=this.value;p.hidden=!this.value; p.nextElementSibling.hidden=!!this.value" />
              <div id="ibUploadStatus" style="font-size:0.75rem; color:#94a3b8; margin-top:2px;">Sube PNG/JPEG a Cloudflare R2 o pega cualquier enlace web.</div>
            </div>
          </div>
        </div>

        <button type="submit" class="btn-primary" id="ibSubmitBtn">Publicar Banner Informativo</button><button type="button" class="btn-action" onclick="previewBanner('ib', 'informative')">Vista previa</button>
        <button type="button" class="btn-action" id="ibCancelBtn" style="display:none; padding:0.75rem 1rem;" onclick="resetInfoBannerForm()">Cancelar</button>
        <div id="ibMsg" class="msg"></div>
      </form>
      <div class="form-grid banner-filters" aria-label="Filtros de banners informativos"><input type="search" placeholder="Buscar banner" oninput="filterBanners(this.closest('.card'))" /><select aria-label="Filtrar ubicación" onchange="filterBanners(this.closest('.card'))"><option value="">Todas las ubicaciones</option>${bannerFilterPlacements}</select><select aria-label="Filtrar estado" onchange="filterBanners(this.closest('.card'))"><option value="">Todos los estados</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select><select aria-label="Filtrar tipo" onchange="filterBanners(this.closest('.card'))"><option value="">Todos los tipos</option><option value="promotional">Promocional</option><option value="informative">Informativo</option></select></div>
      <table>
        <thead><tr><th>Título y Mensaje</th><th>Ubicación</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${renderRows(infoBanners, false)}</tbody>
      </table>
    </div>

    <!-- SECCIÓN 3: ANUNCIOS Y BARRA SUPERIOR -->
    <div class="card" data-marketing-page="announcements" style="margin-top:2rem;">
      <h2>Anuncios & Barra Superior (${announcements.length})</h2>
      <form id="newAnnouncementForm" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="aEditId" value="" />
        <div class="form-grid">
          <div style="grid-column: 1 / -1;"><label>Mensaje del Anuncio</label><input type="text" id="aMsgText" required placeholder="Ej. Envíos gratis a todo el país..." /></div>
          <div><label>Enlace Opcional</label><input type="text" id="aLink" placeholder="/productos" /></div>
          <div>
            <label>Ubicación</label>
            <select id="aPlacement">${announcementPlacements}${destinationOptions}</select>
          </div>
        </div>
        <button type="submit" class="btn-primary" id="aSubmitBtn">Publicar Anuncio</button>
        <button type="button" class="btn-action" id="aCancelBtn" style="display:none; padding:0.75rem 1rem;" onclick="resetAnnouncementForm()">Cancelar</button>
        <div id="aMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Mensaje</th><th>Ubicación</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${announcements.map((a) => `
          <tr>
            <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:600;">
              ${escapeHtml(a.message)}
              ${a.linkUrl ? `<div style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(a.linkUrl)}</div>` : ''}
            </td>
            <td style="padding:0.6rem; border-bottom:1px solid #334155;">${escapeHtml(a.placement)}</td>
            <td style="padding:0.6rem; border-bottom:1px solid #334155;">
              ${a.isActive ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>'}
            </td>
            <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right; white-space:nowrap;">
              ${a.linkUrl ? `<a class="btn-action btn-action-view" href="${escapeHtml(a.linkUrl)}" target="_blank">Ver</a>` : ''}
              <button class="btn-action" style="background:#475569; color:#fff;" onclick="editAnnouncement('${a.id}', '${escapeJs(a.message)}', '${escapeJs(a.linkUrl || '')}', '${a.placement}')">Editar</button>
              ${a.isActive ? `<button class="btn-action btn-action-hide" onclick="setAnnouncementStatus('${a.id}', false)">Ocultar</button>` : `<button class="btn-action btn-action-publish" onclick="setAnnouncementStatus('${a.id}', true)">Publicar</button>`}
              <button class="btn-action btn-action-delete" onclick="deleteAnnouncement('${a.id}')">Eliminar</button>
            </td>
          </tr>
        `).join('') || '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8;">No hay anuncios registrados</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
