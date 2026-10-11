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

    document.getElementById('pName')?.addEventListener('input', () => {
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

    document.getElementById('pSlug')?.addEventListener('input', (e) => {
      e.target.dataset.manual = 'true';
      updateSerpPreview();
    });
    document.getElementById('pSeoTitle')?.addEventListener('input', updateSerpPreview);
    document.getElementById('pDesc')?.addEventListener('input', updateSerpPreview);
    document.getElementById('pSeoDesc')?.addEventListener('input', updateSerpPreview);

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
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

    async function setBannerStatus(id, isActive) {
      const action = isActive ? 'publicar' : 'ocultar';
      if (!confirm('¿Deseas ' + action + ' este banner?')) return;
      const res = await fetch('/api/v1/admin/storefront/banners/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (res.ok) window.location.reload();
      else alert('Error al actualizar banner');
    }

    async function deleteBanner(id) {
      if (!confirm('¿Deseas eliminar este banner?')) return;
      const res = await fetch('/api/v1/admin/storefront/banners/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar banner');
    }

    function editBanner(id, title, link, alt, img, placement) {
      document.getElementById('bEditId').value = id;
      document.getElementById('bTitle').value = title;
      document.getElementById('bLink').value = link;
      document.getElementById('bAlt').value = alt;
      document.getElementById('bImg').value = img;
      document.getElementById('bPlacement').value = placement;
      document.getElementById('bSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('bCancelBtn').style.display = 'inline-block';
      document.getElementById('newBannerForm').scrollIntoView({ behavior: 'smooth' });
    }

    function resetBannerForm() {
      document.getElementById('bEditId').value = '';
      document.getElementById('newBannerForm').reset();
      document.getElementById('bSubmitBtn').textContent = 'Publicar Banner';
      document.getElementById('bCancelBtn').style.display = 'none';
    }

    async function setAnnouncementStatus(id, isActive) {
      const action = isActive ? 'publicar' : 'ocultar';
      if (!confirm('¿Deseas ' + action + ' este anuncio?')) return;
      const res = await fetch('/api/v1/admin/storefront/announcements/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive })
      });
      if (res.ok) window.location.reload();
      else alert('Error al actualizar anuncio');
    }

    async function deleteAnnouncement(id) {
      if (!confirm('¿Deseas eliminar este anuncio?')) return;
      const res = await fetch('/api/v1/admin/storefront/announcements/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar anuncio');
    }

    function editAnnouncement(id, message, link, placement) {
      document.getElementById('aEditId').value = id;
      document.getElementById('aMsgText').value = message;
      document.getElementById('aLink').value = link;
      document.getElementById('aPlacement').value = placement;
      document.getElementById('aSubmitBtn').textContent = 'Guardar Cambios';
      document.getElementById('aCancelBtn').style.display = 'inline-block';
      document.getElementById('newAnnouncementForm').scrollIntoView({ behavior: 'smooth' });
    }

    function resetAnnouncementForm() {
      document.getElementById('aEditId').value = '';
      document.getElementById('newAnnouncementForm').reset();
      document.getElementById('aSubmitBtn').textContent = 'Publicar Anuncio';
      document.getElementById('aCancelBtn').style.display = 'none';
    }

    window.switchTab = switchTab;
    window.setProductStatus = setProductStatus;
    window.deleteProduct = deleteProduct;
    window.deleteCategory = deleteCategory;
    window.setBannerStatus = setBannerStatus;
    window.deleteBanner = deleteBanner;
    window.editBanner = editBanner;
    window.resetBannerForm = resetBannerForm;
    window.setAnnouncementStatus = setAnnouncementStatus;
    window.deleteAnnouncement = deleteAnnouncement;
    window.editAnnouncement = editAnnouncement;
    window.resetAnnouncementForm = resetAnnouncementForm;
  `;
}
