export function renderCmsFormsScript(): string {
  return `
    document.getElementById('cmsTitle')?.addEventListener('input', (e) => {
      const slugInput = document.getElementById('cmsSlug');
      if (slugInput && !slugInput.dataset.manual) {
        slugInput.value = e.target.value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
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
      const bodyText = document.getElementById('cmsBody').value.trim();

      const payload = {
        title,
        slug,
        status,
        seoTitle,
        seoDescription,
        blocks: [
          {
            id: 'block-' + Date.now(),
            type: 'rich_text',
            content: { html: '<p>' + bodyText.replace(/\\n/g, '<br/>') + '</p>' },
            sortOrder: 0
          }
        ]
      };

      const url = editId ? '/api/v1/admin/cms/pages/' + editId : '/api/v1/admin/cms/pages';
      const method = editId ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = editId ? '¡Página CMS actualizada con éxito!' : '¡Página CMS publicada con éxito!';
          msg.className = 'msg success';
          setTimeout(() => window.location.reload(), 1000);
        } else {
          msg.textContent = data.error || 'Error al guardar la página';
          msg.className = 'msg error';
          submitBtn.disabled = false;
        }
      } catch (err) {
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
      document.getElementById('cmsBody').value = bodyText;

      document.getElementById('cmsSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('cmsCancelBtn').style.display = 'inline-block';
      document.getElementById('newCmsPageForm').scrollIntoView({ behavior: 'smooth' });
    }

    function resetCmsForm() {
      document.getElementById('cmsEditId').value = '';
      document.getElementById('newCmsPageForm').reset();
      const slugInput = document.getElementById('cmsSlug');
      if (slugInput) delete slugInput.dataset.manual;
      document.getElementById('cmsSubmitBtn').textContent = 'Publicar Página CMS';
      document.getElementById('cmsCancelBtn').style.display = 'none';
    }

    async function toggleCmsPageStatus(id, newStatus) {
      const actionName = newStatus === 'published' ? 'publicar' : 'ocultar';
      if (!confirm('¿Deseas ' + actionName + ' esta página?')) return;
      try {
        const res = await fetch('/api/v1/admin/cms/pages/' + id, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (res.ok) {
          window.location.reload();
        } else {
          const data = await res.json();
          alert(data.error || 'Error al actualizar estado');
        }
      } catch {
        alert('Error de conexión al actualizar estado');
      }
    }

    async function deleteCmsPage(id) {
      if (!confirm('¿Deseas eliminar permanentemente esta página CMS?')) return;
      try {
        const res = await fetch('/api/v1/admin/cms/pages/' + id, { method: 'DELETE' });
        if (res.ok) {
          window.location.reload();
        } else {
          const data = await res.json();
          alert(data.error || 'Error al eliminar página');
        }
      } catch {
        alert('Error de conexión al eliminar');
      }
    }

    window.editCmsPage = editCmsPage;
    window.resetCmsForm = resetCmsForm;
    window.toggleCmsPageStatus = toggleCmsPageStatus;
    window.deleteCmsPage = deleteCmsPage;
  `;
}
