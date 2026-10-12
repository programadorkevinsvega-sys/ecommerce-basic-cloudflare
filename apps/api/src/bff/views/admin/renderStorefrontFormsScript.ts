export function renderStorefrontFormsScript(): string {
  return `
    document.getElementById('newBannerForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('bMsg');
      const editId = document.getElementById('bEditId')?.value;
      const payload = {
        title: document.getElementById('bTitle').value,
        description: document.getElementById('bDesc')?.value?.trim() || undefined,
        linkUrl: document.getElementById('bLink').value,
        altText: document.getElementById('bAlt').value,
        imageUrl: document.getElementById('bImg').value || '/media/banner-default.webp',
        placement: document.getElementById('bPlacement').value
      };

      const url = editId ? '/api/v1/admin/storefront/banners/' + editId : '/api/v1/admin/storefront/banners';
      const method = editId ? 'PUT' : 'POST';

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
    });

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
