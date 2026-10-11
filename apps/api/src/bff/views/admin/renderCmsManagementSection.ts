import { CmsPageDto } from '../../gateways/cms/CmsGateway.js';

export function renderCmsManagementSection(pages: CmsPageDto[]): string {
  const pageRows = pages.map((p) => {
    const isPub = p.status === 'published';
    const toggleAction = isPub
      ? `<button class="btn-action btn-action-hide" onclick="toggleCmsPageStatus('${p.id}', 'draft')">Ocultar</button>`
      : `<button class="btn-action btn-action-publish" onclick="toggleCmsPageStatus('${p.id}', 'published')">Publicar</button>`;

    // Extraer texto plano del primer bloque si es rich_text
    let bodyText = '';
    if (p.blocks && p.blocks.length > 0) {
      const bContent = p.blocks[0]?.content as { html?: string } | undefined;
      bodyText = (bContent?.html || '').replace(/<[^>]+>/g, '').trim();
    }

    return `
      <tr>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; font-weight:600;">
          ${escapeHtml(p.title)}
          <div style="font-size:0.75rem; color:#94a3b8;">/p/${escapeHtml(p.slug)} (v${p.currentVersion})</div>
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">
          ${isPub ? '<span class="badge badge-published">Publicado</span>' : '<span class="badge badge-draft">Borrador</span>'}
        </td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155;">${escapeHtml(p.updatedAt.substring(0, 10))}</td>
        <td style="padding:0.6rem; border-bottom:1px solid #334155; text-align:right; white-space:nowrap;">
          <a class="btn-action btn-action-view" href="/p/${escapeHtml(p.slug)}" target="_blank">Ver</a>
          <button class="btn-action" style="background:#475569; color:#fff;" onclick="editCmsPage('${p.id}', '${escapeJs(p.title)}', '${escapeJs(p.slug)}', '${p.status}', '${escapeJs(p.seoTitle || '')}', '${escapeJs(p.seoDescription || '')}', '${escapeJs(bodyText)}')">Editar</button>
          ${toggleAction}
          <button class="btn-action btn-action-delete" onclick="deleteCmsPage('${p.id}')">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');

  return `
    <div class="card">
      <h2>Páginas de Contenido Institucional CMS (${pages.length})</h2>
      <p style="color:#94a3b8; font-size:0.875rem; margin-bottom:1rem;">
        Crea y gestiona páginas como Términos y Condiciones, Políticas de Privacidad, Preguntas Frecuentes, etc.
      </p>
      <form id="newCmsPageForm" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="cmsEditId" value="" />
        <div class="form-grid">
          <div><label>Título de la Página</label><input type="text" id="cmsTitle" required placeholder="Ej. Políticas de Devolución" /></div>
          <div><label>Slug URL (/p/...)</label><input type="text" id="cmsSlug" required placeholder="politicas-de-devolucion" /></div>
          <div>
            <label>Estado</label>
            <select id="cmsStatus"><option value="published">Publicado</option><option value="draft">Borrador</option></select>
          </div>
          <div><label>Título SEO</label><input type="text" id="cmsSeoTitle" placeholder="Vacío usa el título de la página" /></div>
          <div style="grid-column: 1 / -1;"><label>Meta Descripción SEO</label><input type="text" id="cmsSeoDesc" placeholder="Descripción breve para Google..." /></div>
        </div>
        <div style="margin-bottom: 1rem;">
          <label>Contenido Principal (Párrafo o HTML)</label>
          <textarea id="cmsBody" rows="4" required placeholder="Escribe el texto de la página aquí..."></textarea>
        </div>
        <button type="submit" class="btn-primary" id="cmsSubmitBtn">Publicar Página CMS</button>
        <button type="button" class="btn-action" id="cmsCancelBtn" style="display:none; padding:0.75rem 1rem;" onclick="resetCmsForm()">Cancelar</button>
        <div id="cmsMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Título y URL</th><th>Estado</th><th>Última Actualización</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${pageRows || '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8;">No hay páginas CMS creadas</td></tr>'}</tbody>
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
