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

      try {
        const res = await fetch('/api/v1/admin/cms/pages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = '¡Página CMS publicada con éxito!';
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

    window.deleteCmsPage = deleteCmsPage;
  `;
}
