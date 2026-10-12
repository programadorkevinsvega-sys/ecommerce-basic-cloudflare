export function renderStorefrontFormsScript(): string {
  return `
    async function handleBannerSubmit(e, bannerType) {
      e.preventDefault();
      const isPromo = bannerType === 'promotional';
      const prefix = isPromo ? 'pb' : 'ib';
      const msg = document.getElementById(prefix + 'Msg');
      const editId = document.getElementById(prefix + 'EditId')?.value;
      const title = document.getElementById(prefix + 'Title').value;
      const desc = document.getElementById(prefix + 'Desc')?.value?.trim() || undefined;
      const img = document.getElementById(prefix + 'Img').value || '/media/banner-default.webp';
      const alt = document.getElementById(prefix + 'Alt').value;
      const placement = document.getElementById(prefix + 'Placement').value;

      const payload = {
        title,
        description: desc,
        bannerType,
        imageUrl: img,
        altText: alt,
        placement,
        linkUrl: isPromo ? (document.getElementById('pbLink')?.value || '/productos') : '#',
        buttonText: isPromo ? (document.getElementById('pbBtnText')?.value || 'Explorar colección') : undefined
      };

      const url = editId ? '/api/v1/admin/storefront/banners/' + editId : '/api/v1/admin/storefront/banners';
      const method = editId ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          msg.textContent = editId ? '✅ Banner actualizado con éxito' : '✅ Banner publicado con éxito';
          msg.style.background = '#065f46';
          msg.style.display = 'block';
          setTimeout(() => window.location.reload(), 800);
        } else {
          const data = await res.json();
          msg.textContent = '❌ ' + (data.error || 'Error al guardar banner');
          msg.style.background = '#7f1d1d';
          msg.style.display = 'block';
        }
      } catch (err) {
        msg.textContent = '❌ Error de conexión';
        msg.style.background = '#7f1d1d';
        msg.style.display = 'block';
      }
    }
    window.handleBannerSubmit = handleBannerSubmit;

    document.getElementById('newAnnouncementForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('aMsg');
      const editId = document.getElementById('aEditId')?.value;
      const payload = {
        message: document.getElementById('aMsgText').value,
        linkUrl: document.getElementById('aLink').value || undefined,
        placement: document.getElementById('aPlacement')?.value || 'top_bar'
      };

      const url = editId ? '/api/v1/admin/storefront/announcements/' + editId : '/api/v1/admin/storefront/announcements';
      const method = editId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = editId ? '✅ Anuncio actualizado con éxito' : '✅ Anuncio superior publicado';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
        setTimeout(() => window.location.reload(), 800);
      } else {
        const data = await res.json();
        msg.textContent = '❌ ' + (data.error || 'Error al guardar anuncio');
        msg.style.background = '#7f1d1d';
        msg.style.display = 'block';
      }
    });

    document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('sMsg');
      const payload = {
        storeName: document.getElementById('sName').value,
        companyNit: document.getElementById('sNit')?.value || undefined,
        companyLegalName: document.getElementById('sLegal')?.value || undefined,
        companyAddress: document.getElementById('sAddress')?.value || undefined,
        taxRatePercent: Number(document.getElementById('sTax').value),
        supportEmail: document.getElementById('sEmail').value || undefined,
        supportPhone: document.getElementById('sPhone').value || undefined
      };
      const res = await fetch('/api/v1/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Configuración actualizada con éxito';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
      }
    });
  `;
}
