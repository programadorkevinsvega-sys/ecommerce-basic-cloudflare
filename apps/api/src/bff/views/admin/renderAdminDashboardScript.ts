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

    document.getElementById('newProductForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('pMsg');
      let specs = {};
      try {
        const rawSpecs = document.getElementById('pSpecs').value;
        if (rawSpecs.trim()) specs = JSON.parse(rawSpecs);
      } catch {
        msg.textContent = '❌ Formato JSON inválido en especificaciones';
        msg.style.background = '#7f1d1d';
        msg.style.display = 'block';
        return;
      }

      const tags = document.getElementById('pTags').value
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const payload = {
        name: document.getElementById('pName').value,
        slug: document.getElementById('pSlug').value,
        sku: document.getElementById('pSku').value,
        priceInCents: Math.round(Number(document.getElementById('pPrice').value) * 100),
        stockQuantity: Number(document.getElementById('pStock').value),
        condition: document.getElementById('pCondition').value,
        brand: document.getElementById('pBrand').value || undefined,
        productType: document.getElementById('pType').value || undefined,
        barcodeGtin: document.getElementById('pGtin').value || undefined,
        seoTitle: document.getElementById('pSeoTitle').value || undefined,
        seoDescription: document.getElementById('pSeoDesc').value || undefined,
        canonicalUrl: document.getElementById('pCanonical').value || undefined,
        noindex: document.getElementById('pNoindex').checked,
        specifications: specs,
        tags,
        allowsCashOnDelivery: document.getElementById('pCod').value === 'true',
        shippingScope: document.getElementById('pScope').value,
        saleMode: document.getElementById('pSaleMode').value,
        description: document.getElementById('pDesc').value,
        status: 'published'
      };

      try {
        const res = await fetch('/api/v1/admin/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = '✅ Producto creado con éxito';
          msg.style.background = '#065f46';
          msg.style.display = 'block';
          setTimeout(() => window.location.reload(), 1000);
        } else {
          msg.textContent = '❌ ' + (data.error || 'Error al guardar');
          msg.style.background = '#7f1d1d';
          msg.style.display = 'block';
        }
      } catch {
        msg.textContent = '❌ Error de conexión';
        msg.style.display = 'block';
      }
    });

    document.getElementById('newBannerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('bMsg');
      const payload = {
        title: document.getElementById('bTitle').value,
        linkUrl: document.getElementById('bLink').value,
        altText: document.getElementById('bAlt').value,
        imageUrl: '/media/banner-default.webp',
        placement: 'home'
      };
      const res = await fetch('/api/v1/admin/storefront/banners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Banner publicado con éxito';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
      }
    });

    document.getElementById('newAnnouncementForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('aMsg');
      const payload = {
        message: document.getElementById('aMsgText').value,
        linkUrl: document.getElementById('aLink').value || undefined,
        placement: 'top_bar'
      };
      const res = await fetch('/api/v1/admin/storefront/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Anuncio superior publicado';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
      }
    });

    document.getElementById('settingsForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('sMsg');
      const payload = {
        storeName: document.getElementById('sName').value,
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
