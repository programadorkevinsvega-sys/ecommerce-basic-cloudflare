import { CmsPageDto } from '../../gateways/cms/CmsGateway.js';

export function renderCmsPageRows(pages: CmsPageDto[]): string {
  if (!pages.length) return '<tr><td colspan="4" class="admin-empty">No hay páginas en esta página.</td></tr>';
  return pages.map((page) => {
    const content = page.blocks?.[0]?.content as { html?: string; text?: string } | undefined;
    const body = content?.html || content?.text || '';
    const publish = page.status === 'published';
    return `<tr><td class="cms-page-title-cell">${e(page.title)}<div class="cms-page-url">/p/${e(page.slug)} · v${page.currentVersion}</div></td>
      <td>${publish ? '<span class="badge badge-published">Publicado</span>' : '<span class="badge badge-draft">Borrador</span>'}</td><td>${e(page.updatedAt.substring(0,10))}</td>
      <td class="cms-page-actions"><a class="btn-action btn-action-view" href="/p/${e(page.slug)}" target="_blank" rel="noopener noreferrer">Ver</a>
      <button class="btn-action" onclick="editCmsPage('${e(page.id)}','${js(page.title)}','${js(page.slug)}','${e(page.status)}','${js(page.seoTitle || '')}','${js(page.seoDescription || '')}','${js(body)}')">Editar</button>
      <button class="btn-action" onclick="toggleCmsPageStatus('${e(page.id)}','${publish ? 'draft' : 'published'}')">${publish ? 'Ocultar' : 'Publicar'}</button>
      <button class="btn-action btn-action-delete" onclick="deleteCmsPage('${e(page.id)}')">Eliminar</button></td></tr>`;
  }).join('');
}
function e(value: string): string { return value.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#039;'); }
function js(value: string): string { return value.replace(/\\/g,'\\\\').replace(/'/g,"\\'").replace(/"/g,'\\"').replace(/\n/g,'\\n'); }
