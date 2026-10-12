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

    function editBanner(id, title, link, alt, img, placement, desc, bannerType, btnText) {
      const isPromo = bannerType !== 'informative';
      if (isPromo) {
        document.getElementById('pbEditId').value = id;
        document.getElementById('pbTitle').value = title;
        document.getElementById('pbDesc').value = desc || '';
        document.getElementById('pbBtnText').value = btnText || 'Explorar colección';
        document.getElementById('pbLink').value = link;
        document.getElementById('pbAlt').value = alt;
        document.getElementById('pbImg').value = img;
        document.getElementById('pbPlacement').value = placement;
        document.getElementById('pbSubmitBtn').textContent = 'Guardar Cambios';
        document.getElementById('pbCancelBtn').style.display = 'inline-block';
        document.getElementById('newPromoBannerForm').scrollIntoView({ behavior: 'smooth' });
      } else {
        document.getElementById('ibEditId').value = id;
        document.getElementById('ibTitle').value = title;
        document.getElementById('ibDesc').value = desc || '';
        document.getElementById('ibAlt').value = alt;
        document.getElementById('ibImg').value = img;
        document.getElementById('ibPlacement').value = placement;
        document.getElementById('ibSubmitBtn').textContent = 'Guardar Cambios';
        document.getElementById('ibCancelBtn').style.display = 'inline-block';
        document.getElementById('newInfoBannerForm').scrollIntoView({ behavior: 'smooth' });
      }
    }

    function resetPromoBannerForm() {
      document.getElementById('pbEditId').value = '';
      document.getElementById('newPromoBannerForm').reset();
      document.getElementById('pbSubmitBtn').textContent = 'Publicar Banner Promocional';
      document.getElementById('pbCancelBtn').style.display = 'none';
    }

    function resetInfoBannerForm() {
      document.getElementById('ibEditId').value = '';
      document.getElementById('newInfoBannerForm').reset();
      document.getElementById('ibSubmitBtn').textContent = 'Publicar Banner Informativo';
      document.getElementById('ibCancelBtn').style.display = 'none';
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
    window.resetPromoBannerForm = resetPromoBannerForm;
    window.resetInfoBannerForm = resetInfoBannerForm;
    window.setAnnouncementStatus = setAnnouncementStatus;
    window.deleteAnnouncement = deleteAnnouncement;
    window.editAnnouncement = editAnnouncement;
    window.resetAnnouncementForm = resetAnnouncementForm;
  `;
}
