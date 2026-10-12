export function renderStorefrontActionsScript(): string {
  return `
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

    function editBanner(id, title, link, alt, img, placement, desc) {
      document.getElementById('bEditId').value = id;
      document.getElementById('bTitle').value = title;
      document.getElementById('bDesc').value = desc || '';
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
      if (document.getElementById('bDesc')) document.getElementById('bDesc').value = '';
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
