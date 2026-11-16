import { LEGAL_TEMPLATES } from './cmsTemplates.js';
export function renderCmsFormsScript(): string {
  const templatesJson = JSON.stringify(LEGAL_TEMPLATES);
  return `
    window.__CMS_TEMPLATES = ${templatesJson};
    let _cmsPendingDeleteId = null;
    let _cmsPage = 1;
    async function loadCmsPageList(page = 1) {
      const response = await fetch('/api/v1/admin/cms/pages?page=' + page + '&pageSize=25', { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'No fue posible cargar las páginas.');
      _cmsPage = result.page;
      document.getElementById('cms-pages-body').innerHTML = result.rowsHtml;
      const pager = document.getElementById('cms-pages-pagination');
      pager.querySelector('span').textContent = result.total + ' registros · Página ' + result.page + (result.hasMore ? ' · hay más páginas' : ' · última página');
      pager.querySelector('[data-cms-page="previous"]').disabled = result.page <= 1;
      pager.querySelector('[data-cms-page="next"]').disabled = !result.hasMore;
    }
    document.getElementById('cms-pages-pagination')?.addEventListener('click', event => {
      const button = event.target instanceof Element ? event.target.closest('[data-cms-page]') : null;
      if (!button || button.disabled) return;
      loadCmsPageList(_cmsPage + (button.dataset.cmsPage === 'next' ? 1 : -1));
    });
    document.addEventListener('click', event => {
      const control = event.target instanceof Element ? event.target.closest('[data-cms-control], [data-cms-command], [data-cms-template]') : null;
      if (!control) return;
      if (control.dataset.cmsTemplate) return window.loadCmsTemplate(control.dataset.cmsTemplate);
      if (control.dataset.cmsCommand) return window.cmsFormat(control.dataset.cmsCommand);
      switch (control.dataset.cmsControl) {
        case 'start': startCmsPage(); break;
        case 'reset': resetCmsForm(); break;
        case 'create-link': cmsCreateLink(); break;
        case 'close-delete': closeCmsDeleteModal(); break;
        case 'confirm-delete': confirmCmsDelete(); break;
      }
    });
    document.addEventListener('change', event => {
      const control = event.target;
      switch (control.dataset.cmsControl) {
        case 'format-block': if (control.value) cmsFormatBlock(control.value); control.selectedIndex = 0; break;
        case 'font-size': if (control.value) cmsFontSize(control.value); control.selectedIndex = 0; break;
        case 'font-color': cmsFontColor(control.value); break;
        case 'highlight-color': cmsHighlightColor(control.value); break;
      }
    });
    loadCmsPageList().catch(error => { document.getElementById('cms-pages-body').innerHTML = '<tr><td colspan="4">' + escapeHtml(error.message) + '</td></tr>'; });
    document.getElementById('cms-pages-body')?.addEventListener('click', event => {
      const button = event.target instanceof Element ? event.target.closest('[data-cms-action]') : null;
      if (!button) return;
      const { cmsAction, cmsId, cmsTitle, cmsSlug, cmsStatus, cmsSeoTitle, cmsSeoDescription, cmsBody } = button.dataset;
      if (cmsAction === 'edit') editCmsPage(cmsId, cmsTitle, cmsSlug, cmsStatus, cmsSeoTitle, cmsSeoDescription, cmsBody);
      if (cmsAction === 'status') toggleCmsPageStatus(cmsId, cmsStatus);
      if (cmsAction === 'delete') deleteCmsPage(cmsId);
    });
    function updateCmsSeoCounters() {
      const tInput = document.getElementById('cmsSeoTitle');
      const dInput = document.getElementById('cmsSeoDesc');
      const tCount = document.getElementById('cmsSeoTitleCount');
      const dCount = document.getElementById('cmsSeoDescCount');
      if (tInput && tCount) {
        const len = tInput.value.length;
        tCount.textContent = len + '/60';
        tCount.style.color = len > 60 ? '#f87171' : '#94a3b8';
      }
      if (dInput && dCount) {
        const len = dInput.value.length;
        dCount.textContent = len + '/155';
        dCount.style.color = len > 155 ? '#f87171' : '#94a3b8';
      }
    }
    window.updateCmsSeoCounters = updateCmsSeoCounters;
    document.getElementById('cmsSeoTitle')?.addEventListener('input', updateCmsSeoCounters);
    document.getElementById('cmsSeoDesc')?.addEventListener('input', updateCmsSeoCounters);
    document.getElementById('cmsTitle')?.addEventListener('input', (e) => {
      const slugInput = document.getElementById('cmsSlug');
      if (slugInput && !slugInput.dataset.manual) {
        slugInput.value = e.target.value.toLowerCase().normalize('NFD')
          .replace(/[\\u0300-\\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
    });
    document.getElementById('cmsSlug')?.addEventListener('input', (e) => {
      e.target.dataset.manual = 'true';
    });
    document.getElementById('newCmsPageForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('cmsMsg');
      const submitBtn = document.getElementById('cmsSubmitBtn');
      msg.textContent = 'Guardando página...';
      msg.className = 'msg';
      submitBtn.disabled = true;
      const editId = document.getElementById('cmsEditId').value;
      const title = document.getElementById('cmsTitle').value.trim();
      const slug = document.getElementById('cmsSlug').value.trim();
      const status = document.getElementById('cmsStatus').value;
      const seoTitle = document.getElementById('cmsSeoTitle').value.trim() || undefined;
      const seoDescription = document.getElementById('cmsSeoDesc').value.trim() || undefined;
      const editorHtml = document.getElementById('cmsEditor').innerHTML.trim();
      const payload = {
        title, slug, status, seoTitle, seoDescription,
        blocks: [{ id: 'block-' + Date.now(), type: 'rich_text', content: { html: editorHtml }, sortOrder: 0 }]
      };
      const url = editId ? '/api/v1/admin/cms/pages/' + editId : '/api/v1/admin/cms/pages';
      const method = editId ? 'PUT' : 'POST';
      try {
        const res = await fetch(url, {
          method,
          headers: adminHeaders(true),
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = editId ? '¡Página actualizada con éxito!' : '¡Página publicada con éxito!';
          msg.className = 'msg success';
          setTimeout(() => window.location.reload(), 1000);
        } else {
          msg.textContent = data.error || 'Error al guardar';
          msg.className = 'msg error';
          submitBtn.disabled = false;
        }
      } catch {
        msg.textContent = 'Error de conexión';
        msg.className = 'msg error';
        submitBtn.disabled = false;
      }
    });
    function editCmsPage(id, title, slug, status, seoTitle, seoDesc, bodyText) {
      document.getElementById('cmsEditId').value = id;
      document.getElementById('cmsTitle').value = title;
      const slugInput = document.getElementById('cmsSlug');
      slugInput.value = slug;
      slugInput.dataset.manual = 'true';
      document.getElementById('cmsStatus').value = status;
      document.getElementById('cmsSeoTitle').value = seoTitle;
      document.getElementById('cmsSeoDesc').value = seoDesc;
      document.getElementById('cmsEditor').innerHTML = bodyText;
      updateCmsSeoCounters();
      document.getElementById('cmsSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('newCmsPageForm').hidden = false;
      document.getElementById('cms-editor-heading').textContent = 'Editar página';
      document.getElementById('newCmsPageForm').scrollIntoView({ behavior: 'smooth' });
    }
    function startCmsPage() {
      resetCmsForm();
      document.getElementById('newCmsPageForm').hidden = false;
      document.getElementById('cms-editor-heading').textContent = 'Nueva página';
      document.getElementById('newCmsPageForm').scrollIntoView({ behavior: 'smooth' });
      document.getElementById('cmsTitle').focus();
    }
    function resetCmsForm() {
      document.getElementById('cmsEditId').value = '';
      document.getElementById('newCmsPageForm').reset();
      document.getElementById('cmsEditor').innerHTML = '';
      const slugInput = document.getElementById('cmsSlug');
      if (slugInput) delete slugInput.dataset.manual;
      document.getElementById('cmsSubmitBtn').textContent = 'Publicar Página CMS';
      document.getElementById('newCmsPageForm').hidden = true;
      document.getElementById('cms-editor-heading').textContent = 'Nueva página';
      updateCmsSeoCounters();
    }
    async function toggleCmsPageStatus(id, newStatus) {
      const actionName = newStatus === 'published' ? 'publicar' : 'ocultar';
      if (!confirm('¿Deseas ' + actionName + ' esta página?')) return;
      try {
        const res = await fetch('/api/v1/admin/cms/pages/' + id, {
          method: 'PUT',
          headers: adminHeaders(true),
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) window.location.reload();
        else { const d = await res.json(); alert(d.error || 'Error al actualizar estado'); }
      } catch { alert('Error de conexión'); }
    }

    function deleteCmsPage(id) {
      _cmsPendingDeleteId = id;
      document.getElementById('cmsDeleteModal').style.display = 'flex';
    }

    function closeCmsDeleteModal() {
      _cmsPendingDeleteId = null;
      document.getElementById('cmsDeleteModal').style.display = 'none';
    }

    async function confirmCmsDelete() {
      if (!_cmsPendingDeleteId) return;
      const id = _cmsPendingDeleteId;
      closeCmsDeleteModal();
      try {
        const res = await fetch('/api/v1/admin/cms/pages/' + id, {
          method: 'DELETE',
          headers: adminHeaders()
        });
        if (res.ok) window.location.reload();
        else { const d = await res.json(); alert(d.error || 'Error al eliminar'); }
      } catch { alert('Error de conexión'); }
    }

    window.editCmsPage = editCmsPage; window.startCmsPage = startCmsPage; window.resetCmsForm = resetCmsForm; window.toggleCmsPageStatus = toggleCmsPageStatus; window.deleteCmsPage = deleteCmsPage; window.closeCmsDeleteModal = closeCmsDeleteModal; window.confirmCmsDelete = confirmCmsDelete;
  `;
}
