import { BannerItemDto, AnnouncementItemDto } from '../../gateways/storefront/StorefrontGateway.js';

export function renderStorefrontManagementSection(
  banners: BannerItemDto[],
  announcements: AnnouncementItemDto[]
): string {
  const bannerRows = banners.map((b) => `
    <tr>
      <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:600;">
        ${escapeHtml(b.title)}
        <div style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(b.linkUrl)}</div>
      </td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;">${escapeHtml(b.placement)}</td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;">
        ${b.isActive ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>'}
      </td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right;">
        <button class="btn-action btn-action-delete" onclick="deleteBanner('${b.id}')">Eliminar</button>
      </td>
    </tr>
  `).join('');

  const announcementRows = announcements.map((a) => `
    <tr>
      <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:600;">
        ${escapeHtml(a.message)}
        ${a.linkUrl ? `<div style="font-size:0.75rem; color:#94a3b8;">${escapeHtml(a.linkUrl)}</div>` : ''}
      </td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;">${escapeHtml(a.placement)}</td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155;">
        ${a.isActive ? '<span class="badge badge-published">Activo</span>' : '<span class="badge badge-draft">Inactivo</span>'}
      </td>
      <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right;">
        <button class="btn-action btn-action-delete" onclick="deleteAnnouncement('${a.id}')">Eliminar</button>
      </td>
    </tr>
  `).join('');

  return `
    <div class="card">
      <h2>Banners Hero & Promocionales (${banners.length})</h2>
      <form id="newBannerForm" style="margin-bottom: 1.5rem;">
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
        <button type="submit" class="btn-primary">Publicar Banner</button>
        <div id="bMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Título y Destino</th><th>Ubicación</th><th>Estado</th><th style="text-align:right;">Acción</th></tr></thead>
        <tbody>${bannerRows || '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8;">No hay banners registrados</td></tr>'}</tbody>
      </table>
    </div>

    <div class="card">
      <h2>Anuncios & Barra Superior (${announcements.length})</h2>
      <form id="newAnnouncementForm" style="margin-bottom: 1.5rem;">
        <div class="form-grid">
          <div style="grid-column: 1 / -1;"><label>Mensaje del Anuncio</label><input type="text" id="aMsgText" required placeholder="Ej. Envíos gratis a todo el país en pedidos mayores a $150.000 COP" /></div>
          <div><label>Enlace Opcional</label><input type="text" id="aLink" placeholder="/productos" /></div>
          <div>
            <label>Ubicación</label>
            <select id="aPlacement"><option value="top_bar">Barra Superior (Top Bar)</option><option value="home">Inicio (Home)</option><option value="products">Productos</option></select>
          </div>
        </div>
        <button type="submit" class="btn-primary">Publicar Anuncio</button>
        <div id="aMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Mensaje</th><th>Ubicación</th><th>Estado</th><th style="text-align:right;">Acción</th></tr></thead>
        <tbody>${announcementRows || '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8;">No hay anuncios registrados</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
