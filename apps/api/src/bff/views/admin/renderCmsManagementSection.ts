import { CmsPageDto } from '../../gateways/cms/CmsGateway.js';

export function renderCmsManagementSection(pages: CmsPageDto[]): string {
  const pageRows = pages.map((p) => {
    const isPub = p.status === 'published';
    const toggleAction = isPub
      ? `<button class="btn-action btn-action-hide" onclick="toggleCmsPageStatus('${p.id}', 'draft')">Ocultar</button>`
      : `<button class="btn-action btn-action-publish" onclick="toggleCmsPageStatus('${p.id}', 'published')">Publicar</button>`;

    // Extraer contenido HTML o texto del primer bloque
    let bodyContent = '';
    if (p.blocks && p.blocks.length > 0) {
      const bContent = p.blocks[0]?.content as { html?: string; text?: string } | undefined;
      bodyContent = bContent?.html || bContent?.text || '';
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
          <button class="btn-action" style="background:#475569; color:#fff;" onclick="editCmsPage('${p.id}', '${escapeJs(p.title)}', '${escapeJs(p.slug)}', '${p.status}', '${escapeJs(p.seoTitle || '')}', '${escapeJs(p.seoDescription || '')}', '${escapeJs(bodyContent)}')">Editar</button>
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
      <div style="background:#1e293b; border:1px solid #334155; border-radius:8px; padding:1rem; margin-bottom:1.5rem;">
        <label style="font-weight:700; margin-bottom:0.5rem; display:block;">📋 Cargar Plantilla Legal para Colombia:</label>
        <div style="display:flex; gap:0.5rem; flex-wrap:wrap;">
          <button type="button" class="btn-action" onclick="loadCmsTemplate('terminos')" style="background:#334155; color:#fff;">Términos y Condiciones</button>
          <button type="button" class="btn-action" onclick="loadCmsTemplate('privacidad')" style="background:#334155; color:#fff;">Política Tratamiento Datos (Ley 1581)</button>
          <button type="button" class="btn-action" onclick="loadCmsTemplate('devoluciones')" style="background:#334155; color:#fff;">Devoluciones y Retracto</button>
          <button type="button" class="btn-action" onclick="loadCmsTemplate('pqrs')" style="background:#334155; color:#fff;">Atención PQRS</button>
        </div>
      </div>
      <form id="newCmsPageForm" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="cmsEditId" value="" />
        <div class="form-grid">
          <div><label>Título de la Página</label><input type="text" id="cmsTitle" required placeholder="Ej. Políticas de Devolución" /></div>
          <div><label>Slug URL (/p/...)</label><input type="text" id="cmsSlug" required placeholder="politicas-de-devolucion" /></div>
          <div>
            <label>Estado</label>
            <select id="cmsStatus"><option value="published">Publicado</option><option value="draft">Borrador</option></select>
          </div>
          <div>
            <div style="display:flex; justify-content:space-between;"><label>Título SEO</label><small id="cmsSeoTitleCount" style="color:#94a3b8;">0/60</small></div>
            <input type="text" id="cmsSeoTitle" placeholder="Vacío usa el título de la página" maxlength="80" />
          </div>
          <div style="grid-column: 1 / -1;">
            <div style="display:flex; justify-content:space-between;"><label>Meta Descripción SEO</label><small id="cmsSeoDescCount" style="color:#94a3b8;">0/155</small></div>
            <input type="text" id="cmsSeoDesc" placeholder="Descripción breve para Google..." maxlength="200" />
          </div>
        </div>
        <div style="margin-bottom: 1.25rem;">
          <label style="font-weight:700; margin-bottom:0.5rem; display:block;">📄 Documento y Contenido Principal (Editor Estilo Word)</label>
          <!-- Barra de Herramientas Estilo Word -->
          <div style="display:flex; gap:0.4rem; padding:0.6rem; background:#1e293b; border:1px solid #334155; border-bottom:none; border-radius:8px 8px 0 0; flex-wrap:wrap; align-items:center;">
            <!-- Jerarquía de Encabezados -->
            <select onchange="cmsFormatBlock(this.value); this.selectedIndex=0;" style="width:auto; padding:0.3rem 0.6rem; font-size:0.8rem; background:#0f172a; color:#fff; border:1px solid #475569; border-radius:4px;">
              <option value="">Formato…</option>
              <option value="h1">Título 1 (H1)</option>
              <option value="h2">Título 2 (H2)</option>
              <option value="h3">Título 3 (H3)</option>
              <option value="p">Párrafo Normal</option>
              <option value="blockquote">Cita destacada</option>
            </select>
            <!-- Tamaño de Letra -->
            <select onchange="cmsFontSize(this.value); this.selectedIndex=0;" style="width:auto; padding:0.3rem 0.6rem; font-size:0.8rem; background:#0f172a; color:#fff; border:1px solid #475569; border-radius:4px;">
              <option value="">Tamaño…</option>
              <option value="2">Pequeña (13px)</option>
              <option value="3">Normal (16px)</option>
              <option value="4">Mediana (18px)</option>
              <option value="5">Grande (24px)</option>
              <option value="6">Muy Grande (32px)</option>
            </select>
            <span style="width:1px; height:20px; background:#475569; margin:0 0.2rem;"></span>
            <!-- Estilos de Texto -->
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem; min-width:32px;" onclick="cmsFormat('bold')" title="Negrita (Ctrl+B)"><strong>B</strong></button>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem; min-width:32px;" onclick="cmsFormat('italic')" title="Cursiva (Ctrl+I)"><em>I</em></button>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem; min-width:32px;" onclick="cmsFormat('underline')" title="Subrayado (Ctrl+U)"><span style="text-decoration:underline;">U</span></button>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem; min-width:32px;" onclick="cmsFormat('strikeThrough')" title="Tachado"><span style="text-decoration:line-through;">S</span></button>
            <span style="width:1px; height:20px; background:#475569; margin:0 0.2rem;"></span>
            <!-- Alineación de Párrafo -->
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem;" onclick="cmsFormat('justifyLeft')" title="Alinear a la izquierda">⬅️ Izq</button>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem;" onclick="cmsFormat('justifyCenter')" title="Centrar">🎯 Centrar</button>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem;" onclick="cmsFormat('justifyRight')" title="Alinear a la derecha">➡️ Der</button>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem;" onclick="cmsFormat('justifyFull')" title="Justificar">↔️ Justificar</button>
            <span style="width:1px; height:20px; background:#475569; margin:0 0.2rem;"></span>
            <!-- Listas -->
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem;" onclick="cmsFormat('insertUnorderedList')" title="Viñetas">• Lista</button>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem;" onclick="cmsFormat('insertOrderedList')" title="Numeración">1. Lista</button>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem;" onclick="cmsFormat('insertHorizontalRule')" title="Línea horizontal">➖ Línea</button>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem;" onclick="cmsCreateLink()" title="Insertar enlace">🔗 Enlace</button>
            <span style="width:1px; height:20px; background:#475569; margin:0 0.2rem;"></span>
            <!-- Color de Letra y Resaltado -->
            <label style="display:inline-flex; align-items:center; gap:0.25rem; margin:0; font-size:0.75rem; cursor:pointer;" title="Color del texto">
              🎨 Color:
              <input type="color" onchange="cmsFontColor(this.value)" value="#0f172a" style="width:26px; height:26px; padding:0; border:none; cursor:pointer; background:transparent;" />
            </label>
            <label style="display:inline-flex; align-items:center; gap:0.25rem; margin:0; font-size:0.75rem; cursor:pointer;" title="Resaltador">
              🖍️ Resaltar:
              <input type="color" onchange="cmsHighlightColor(this.value)" value="#fef08a" style="width:26px; height:26px; padding:0; border:none; cursor:pointer; background:transparent;" />
            </label>
            <button type="button" class="btn-action" style="padding:0.3rem 0.6rem; background:#475569; color:#fff;" onclick="cmsFormat('removeFormat')" title="Limpiar formato">🧹 Limpiar</button>
          </div>
          <!-- Hoja de Documento estilo Word (fondo claro, legible, profesional) -->
          <div style="background:#0f172a; padding:1.25rem; border:1px solid #334155; border-radius:0 0 8px 8px;">
            <div id="cmsEditor" contenteditable="true" style="min-height:280px; max-height:550px; padding:2rem; background:#ffffff; color:#0f172a; border-radius:6px; box-shadow:0 4px 15px rgba(0,0,0,0.3); overflow-y:auto; line-height:1.75; font-size:1rem; outline:none;" placeholder="Escribe el documento o redacta el contenido aquí..."></div>
          </div>
          <textarea id="cmsBody" style="display:none;"></textarea>
        </div>
        <button type="submit" class="btn-primary" id="cmsSubmitBtn">Publicar Página CMS</button>
        <button type="button" class="btn-action" id="cmsCancelBtn" style="display:none; padding:0.75rem 1rem;" onclick="resetCmsForm()">Cancelar</button>
        <div id="cmsMsg" class="msg"></div>
      </form>
      <table>
        <thead><tr><th>Título y URL</th><th>Estado</th><th>Última Actualización</th><th style="text-align:right;">Acciones</th></tr></thead>
        <tbody>${pageRows || '<tr><td colspan="4" style="text-align:center; padding:1rem; color:#94a3b8;">No hay páginas CMS creadas</td></tr>'}</tbody>
      </table>

      <!-- Modal de Confirmación para Eliminar Página -->
      <div id="cmsDeleteModal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; align-items:center; justify-content:center;">
        <div style="background:#1e293b; border:1px solid #334155; border-radius:12px; padding:1.5rem; max-width:420px; width:90%; box-shadow:0 10px 25px rgba(0,0,0,0.5);">
          <h3 style="margin-top:0; color:#f87171;">⚠️ Confirmar Eliminación</h3>
          <p id="cmsDeleteModalText" style="color:#cbd5e1; font-size:0.95rem; margin-bottom:1.5rem;">¿Estás seguro de que deseas eliminar esta página? Esta acción no se puede deshacer.</p>
          <div style="display:flex; gap:0.75rem; justify-content:flex-end;">
            <button type="button" class="btn-action" onclick="closeCmsDeleteModal()" style="background:#475569; color:#fff;">Cancelar</button>
            <button type="button" class="btn-action btn-action-delete" id="cmsConfirmDeleteBtn" onclick="confirmCmsDelete()">Eliminar Definitivamente</button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function escapeJs(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '\\"').replace(/\n/g, '\\n');
}
