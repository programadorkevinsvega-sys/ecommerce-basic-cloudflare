import { BannerItemDto, AnnouncementItemDto } from '../../gateways/storefront/StorefrontGateway.js';

export function renderStorefrontManagementSection(
  banners: BannerItemDto[],
  announcements: AnnouncementItemDto[]
): string {
  const bannerRows = banners.map((b) => {
    const toggleAction = b.isActive
      ? `<button class="btn-action btn-action-hide" onclick="setBannerStatus('${b.id}', false)">Ocultar</button>`
      : `<button class="btn-action btn-action-publish" onclick="setBannerStatus('${b.id}', true)">Publicar</button>`;

    return `
      <tr>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:600;">
          ${escapeHtml(b.title)}
          <div style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(b.linkUrl)} | Alt: "${escapeHtml(b.altText)}"</div>
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">${escapeHtml(b.placement)}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">
          ${b.isActive ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>'}
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right; white-space:nowrap;">
          <a class="btn-action btn-action-view" href="${escapeHtml(b.linkUrl)}" target="_blank">Ver</a>
          <button class="btn-action" style="background:#475569; color:#fff;" onclick="editBanner('${b.id}', '${escapeJs(b.title)}', '${escapeJs(b.linkUrl)}', '${escapeJs(b.altText)}', '${escapeJs(b.imageUrl)}', '${b.placement}')">Editar</button>
          ${toggleAction}
          <button class="btn-action btn-action-delete" onclick="deleteBanner('${b.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');

  const announcementRows = announcements.map((a) => {
    const toggleAction = a.isActive
      ? `<button class="btn-action btn-action-hide" onclick="setAnnouncementStatus('${a.id}', false)">Ocultar</button>`
      : `<button class="btn-action btn-action-publish" onclick="setAnnouncementStatus('${a.id}', true)">Publicar</button>`;

    return `
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
          ${toggleAction}
          <button class="btn-action btn-action-delete" onclick="deleteAnnouncement('${a.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card">
      <h2>Banners Hero & Promocionales (${banners.length})</h2>
      <form id="newBannerForm" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="bEditId" value="" />
        <div class="form-grid">
          <div><label>Título del Banner</label><input type="text" id="bTitle" required placeholder="Ej. Gran Venta de Verano" /></div>
          <div><label>URL de Destino</label><input type="text" id="bLink" required value="/productos" /></div>
          <div><label>URL de Imagen</label><input type="text" id="bImg" value="/media/banner-default.webp" /></div>
          <div><label>Texto Alternativo (Alt)</label><input type="text" id="bAlt" required placeholder="Colección destacada..." /></div>
          <div>
            <label>Ubicación</label>
            <select id="bPlacement"><option value="home">Página Principal (Home)</option><option value="category">Categorías</option><option value="product">Página de Producto</option></select>
          </div>
        </div>
        <button type="submit" class="btn-primary" id="bSubmitBtn">Publicar Banner</button>
        <button type="button" class="btn-action" id="bCancelBtn" style="display:none; padding:0.75rem 1rem;" onclick="resetBannerForm()">Cancelar</button>
        <div id="bMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Título y Destino</th><th>Ubicación</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${bannerRows || '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8;">No hay banners registrados</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Anuncios & Barra Superior (${announcements.length})</h2>
      <form id="newAnnouncementForm" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="aEditId" value="" />
        <div class="form-grid">
          <div style="grid-column: 1 / -1;"><label>Mensaje del Anuncio</label><input type="text" id="aMsgText" required placeholder="Ej. Envíos gratis a todo el país..." /></div>
          <div><label>Enlace Opcional</label><input type="text" id="aLink" placeholder="/productos" /></div>
          <div>
            <label>Ubicación</label>
            <select id="aPlacement"><option value="top_bar">Barra Superior (Top Bar)</option><option value="home">Inicio (Home)</option><option value="products">Productos</option></select>
          </div>
        </div>
        <button type="submit" class="btn-primary" id="aSubmitBtn">Publicar Anuncio</button>
        <button type="button" class="btn-action" id="aCancelBtn" style="display:none; padding:0.75rem 1rem;" onclick="resetAnnouncementForm()">Cancelar</button>
        <div id="aMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Mensaje</th><th>Ubicación</th><th>Estado</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${announcementRows || '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8;">No hay anuncios registrados</td></tr>'}</tbody>
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
