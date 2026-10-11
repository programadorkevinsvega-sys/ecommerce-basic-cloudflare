export function renderAdminDashboardScript(): string {
  return `
    function switchTab(tabId) {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      event.target.classList.add('active');
      document.getElementById('tab-' + tabId).classList.add('active');
    }

    function updateSerpPreview() {
      const name = document.getElementById('pName').value;
      const seoTitle = document.getElementById('pSeoTitle').value;
      const slug = document.getElementById('pSlug').value;
      const desc = document.getElementById('pDesc').value;
      const seoDesc = document.getElementById('pSeoDesc').value;

      const title = (seoTitle || name || 'Título del Producto').trim();
      const previewSlug = (slug || 'producto-slug').trim();
      const description = (seoDesc || desc || 'Descripción que aparecerá en los resultados de Google...').trim();

      document.getElementById('serpTitle').textContent = title.substring(0, 70);
      document.getElementById('serpUrl').textContent = 'https://tienda.com/productos/' + previewSlug;
      document.getElementById('serpDesc').textContent = description.substring(0, 160);

      const titleCount = document.getElementById('titleCount');
      titleCount.textContent = title.length + '/70 car.';
      titleCount.style.color = title.length > 70 ? '#f87171' : '#94a3b8';

      const descCount = document.getElementById('descCount');
      descCount.textContent = description.length + '/160 car.';
      descCount.style.color = description.length > 160 ? '#f87171' : '#94a3b8';
    }

    document.getElementById('pName').addEventListener('input', () => {
      const slugInput = document.getElementById('pSlug');
      if (!slugInput.dataset.manual) {
        slugInput.value = document.getElementById('pName').value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      }
      updateSerpPreview();
    });

    document.getElementById('pSlug').addEventListener('input', (e) => {
      e.target.dataset.manual = 'true';
      updateSerpPreview();
    });
    document.getElementById('pSeoTitle').addEventListener('input', updateSerpPreview);
    document.getElementById('pDesc').addEventListener('input', updateSerpPreview);
    document.getElementById('pSeoDesc').addEventListener('input', updateSerpPreview);

    document.getElementById('logoutBtn').addEventListener('click', async () => {
      await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    });

    async function setProductStatus(id, status) {
      if (!confirm('¿Deseas cambiar el estado del producto?')) return;
      const res = await fetch('/api/v1/admin/products/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) window.location.reload();
      else alert('Error al actualizar estado');
    }

    async function deleteProduct(id) {
      if (!confirm('¿Seguro que deseas eliminar este producto permanentemente?')) return;
      const res = await fetch('/api/v1/admin/products/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar producto');
    }

    async function deleteCategory(id) {
      if (!confirm('¿Deseas eliminar esta categoría?')) return;
      const res = await fetch('/api/v1/admin/categories/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar categoría');
    }

    async function deleteBanner(id) {
      if (!confirm('¿Deseas eliminar este banner?')) return;
      const res = await fetch('/api/v1/admin/storefront/banners/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar banner');
    }

    async function deleteAnnouncement(id) {
      if (!confirm('¿Deseas eliminar este anuncio?')) return;
      const res = await fetch('/api/v1/admin/storefront/announcements/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar anuncio');
    }

    window.switchTab = switchTab;
    window.setProductStatus = setProductStatus;
    window.deleteProduct = deleteProduct;
    window.deleteCategory = deleteCategory;
    window.deleteBanner = deleteBanner;
    window.deleteAnnouncement = deleteAnnouncement;
  `;
}

