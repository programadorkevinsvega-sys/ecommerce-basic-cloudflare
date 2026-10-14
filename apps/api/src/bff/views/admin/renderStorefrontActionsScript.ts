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

    async function duplicateBanner(id) {
      const response = await fetch('/api/v1/admin/storefront/banners/' + id + '/duplicate', { method: 'POST' });
      if (response.ok) window.location.reload();
      else alert('No se pudo duplicar el banner');
    }

    function filterBanners(card) {
      const [search, placement, state, type] = card.querySelector('.banner-filters').querySelectorAll('input, select');
      const body = card.querySelector('tbody');
      const matchesFilter = (row) => {
        const matches = row.dataset.title.includes(search.value.toLowerCase()) &&
          (!placement.value || row.dataset.placement === placement.value) && (!state.value || row.dataset.active === state.value) && (!type.value || row.dataset.type === type.value);
        return matches;
      };
      const template = document.createElement('template');
      const rows = window.getStaticAdminTableRows(body).filter((markup) => {
        template.innerHTML = markup;
        return template.content.firstElementChild?.matches('[data-banner-row="1"]') && matchesFilter(template.content.firstElementChild);
      });
      const key = body?.dataset.paginationKey;
      window.resetAdminTablePage(key);
      window.paginateAdminTable(key, body, rows, (markup) => markup, 4, 'No hay banners que coincidan con los filtros.');
    }

    function previewBanner(prefix, bannerType) {
      const title = document.getElementById(prefix + 'Title').value;
      const description = document.getElementById(prefix + 'Desc').value;
      const image = document.getElementById(prefix + 'Img').value;
      const alt = document.getElementById(prefix + 'Alt').value;
      const dialog = document.getElementById('banner-preview-dialog');
      dialog.querySelector('h2').textContent = title || 'Vista previa';
      dialog.querySelector('p').textContent = description;
      const picture = dialog.querySelector('img'); picture.src = image; picture.alt = alt; picture.hidden = !image;
      const action = dialog.querySelector('a');
      action.hidden = bannerType === 'informative';
      action.textContent = document.getElementById('pbBtnText')?.value || 'Explorar colección';
      if (!dialog.open) dialog.showModal();
    }

    function editBanner(id, title, link, alt, img, placement, desc, bannerType, btnText, startsAt, endsAt, sortOrder) {
      const isPromo = bannerType !== 'informative';
      if (isPromo) {
        document.getElementById('pbEditId').value = id;
        document.getElementById('pbTitle').value = title;
        document.getElementById('pbDesc').value = desc || '';
        document.getElementById('pbBtnText').value = btnText || 'Explorar colección';
        document.getElementById('pbLink').value = link;
        document.getElementById('pbAlt').value = alt;
        document.getElementById('pbImg').value = img;
        const pImgPreview = document.getElementById('pbImgPreview');
        if (pImgPreview) { pImgPreview.src = img; pImgPreview.hidden = !img; if (pImgPreview.nextElementSibling) pImgPreview.nextElementSibling.hidden = Boolean(img); }
        document.getElementById('pbPlacement').value = placement;
        document.getElementById('pbStartsAt').value = startsAt ? startsAt.slice(0, 16) : '';
        document.getElementById('pbEndsAt').value = endsAt ? endsAt.slice(0, 16) : '';
        document.getElementById('pbSortOrder').value = sortOrder || 0;
        document.getElementById('pbSubmitBtn').textContent = 'Guardar Cambios';
        document.getElementById('pbCancelBtn').style.display = 'inline-block';
        window.openMarketingModal('promo-banners');
      } else {
        document.getElementById('ibEditId').value = id;
        document.getElementById('ibTitle').value = title;
        document.getElementById('ibDesc').value = desc || '';
        document.getElementById('ibAlt').value = alt;
        document.getElementById('ibImg').value = img;
        const iImgPreview = document.getElementById('ibImgPreview');
        if (iImgPreview) { iImgPreview.src = img; iImgPreview.hidden = !img; if (iImgPreview.nextElementSibling) iImgPreview.nextElementSibling.hidden = Boolean(img); }
        document.getElementById('ibPlacement').value = placement;
        document.getElementById('ibStartsAt').value = startsAt ? startsAt.slice(0, 16) : '';
        document.getElementById('ibEndsAt').value = endsAt ? endsAt.slice(0, 16) : '';
        document.getElementById('ibSortOrder').value = sortOrder || 0;
        document.getElementById('ibSubmitBtn').textContent = 'Guardar Cambios';
        document.getElementById('ibCancelBtn').style.display = 'inline-block';
        window.openMarketingModal('info-banners');
      }
    }

    function resetPromoBannerForm() {
      document.getElementById('pbEditId').value = '';
      document.getElementById('newPromoBannerForm').reset();
      document.getElementById('pbSubmitBtn').textContent = 'Publicar Banner Promocional';
      document.getElementById('pbCancelBtn').style.display = 'none';
      const pImgPreview = document.getElementById('pbImgPreview');
      if (pImgPreview) { pImgPreview.removeAttribute('src'); pImgPreview.hidden = true; if (pImgPreview.nextElementSibling) pImgPreview.nextElementSibling.hidden = false; }
      const pStatus = document.getElementById('pbUploadStatus');
      if (pStatus) pStatus.textContent = 'Sube PNG/JPEG a Cloudflare R2 o pega cualquier enlace web.';
    }

    function resetInfoBannerForm() {
      document.getElementById('ibEditId').value = '';
      document.getElementById('newInfoBannerForm').reset();
      document.getElementById('ibSubmitBtn').textContent = 'Publicar Banner Informativo';
      document.getElementById('ibCancelBtn').style.display = 'none';
      const iImgPreview = document.getElementById('ibImgPreview');
      if (iImgPreview) { iImgPreview.removeAttribute('src'); iImgPreview.hidden = true; if (iImgPreview.nextElementSibling) iImgPreview.nextElementSibling.hidden = false; }
      const iStatus = document.getElementById('ibUploadStatus');
      if (iStatus) iStatus.textContent = 'Sube PNG/JPEG a Cloudflare R2 o pega cualquier enlace web.';
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
      window.openMarketingModal('announcements');
    }

    function resetAnnouncementForm() {
      document.getElementById('aEditId').value = '';
      document.getElementById('newAnnouncementForm').reset();
      document.getElementById('aSubmitBtn').textContent = 'Publicar Anuncio';
      document.getElementById('aCancelBtn').style.display = 'none';
    }

    window.setBannerStatus = setBannerStatus;
    window.duplicateBanner = duplicateBanner;
    window.filterBanners = filterBanners;
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
