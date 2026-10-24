export function renderStorefrontActionsScript(): string {
  return `
    async function loadStorefrontPage(kind, page = 1) {
      const banners = kind === 'promo' || kind === 'info';
      const type = kind === 'info' ? 'informative' : 'promotional';
      const card = document.querySelector('[data-marketing-page="' + (kind === 'promo' ? 'promo-banners' : kind === 'info' ? 'info-banners' : 'announcements') + '"]');
      const path = banners ? '/api/v1/admin/storefront/banners?page=' + page + '&pageSize=25&type=' + type + '&q=' + encodeURIComponent(card?.querySelector('input[type="search"]')?.value.trim() || '') + '&placement=' + encodeURIComponent(card?.querySelector('[aria-label="Filtrar ubicación"]')?.value || '') + '&active=' + encodeURIComponent(({active:'true',inactive:'false'})[card?.querySelector('[aria-label="Filtrar estado"]')?.value] || '') : '/api/v1/admin/storefront/announcements?page=' + page + '&pageSize=25';
      const response = await fetch(path, { cache: 'no-store' }), result = await response.json();
      if (!response.ok || !result.success) throw new Error(result.error || 'No fue posible cargar esta página.');
      const bodyId = kind === 'promo' ? 'promo-banners-body' : kind === 'info' ? 'info-banners-body' : 'announcements-body';
      const navId = kind === 'promo' ? 'promo-banners-pagination' : kind === 'info' ? 'info-banners-pagination' : 'announcements-pagination';
      document.getElementById(bodyId).innerHTML = result.rowsHtml;
      const nav = document.getElementById(navId);
      nav.querySelector('span').textContent = result.total + ' registros · Página ' + result.page + ' de ' + Math.max(1, Math.ceil(result.total / result.pageSize));
      nav.querySelector('[data-storefront-page="previous"]').disabled = result.page <= 1;
      nav.querySelector('[data-storefront-page="next"]').disabled = !result.hasMore;
      nav.querySelector('[data-storefront-page="previous"]').onclick = () => loadStorefrontPage(kind, result.page - 1);
      nav.querySelector('[data-storefront-page="next"]').onclick = () => loadStorefrontPage(kind, result.page + 1);
    }
    loadStorefrontPage('promo').catch(() => {}); loadStorefrontPage('info').catch(() => {}); loadStorefrontPage('announcements').catch(() => {});
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

    let bannerFilterTimer;
    function filterBanners(card) {
      clearTimeout(bannerFilterTimer);
      bannerFilterTimer = setTimeout(() => loadStorefrontPage(card.dataset.marketingPage === 'info-banners' ? 'info' : 'promo', 1).catch(() => {}), 250);
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
