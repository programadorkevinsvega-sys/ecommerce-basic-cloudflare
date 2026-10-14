import { LEGAL_TEMPLATES } from './cmsTemplates.js';

export function renderCmsFormsScript(): string {
  const templatesJson = JSON.stringify(LEGAL_TEMPLATES);

  return `
    window.__CMS_TEMPLATES = ${templatesJson};
    let _cmsPendingDeleteId = null;

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
      document.getElementById('cmsCancelBtn').style.display = 'inline-block';
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
      document.getElementById('cmsCancelBtn').style.display = 'none';
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

    window.editCmsPage = editCmsPage;
    window.startCmsPage = startCmsPage;
    window.resetCmsForm = resetCmsForm;
    window.toggleCmsPageStatus = toggleCmsPageStatus;
    window.deleteCmsPage = deleteCmsPage;
    window.closeCmsDeleteModal = closeCmsDeleteModal;
    window.confirmCmsDelete = confirmCmsDelete;
  `;
}
