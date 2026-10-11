export function renderAdminFormsScript(): string {
  return `
    document.getElementById('newProductForm')?.addEventListener('submit', async (e) => {
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

    document.getElementById('newCategoryForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('catMsg');
      const payload = {
        name: document.getElementById('catName').value,
        slug: document.getElementById('catSlug').value || undefined,
        description: document.getElementById('catDesc').value || undefined
      };
      const res = await fetch('/api/v1/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Categoría creada';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
        setTimeout(() => window.location.reload(), 800);
      }
    });

    document.getElementById('newBrandForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('brandMsg');
      const payload = {
        name: document.getElementById('brandName').value,
        slug: document.getElementById('brandSlug').value || undefined,
        websiteUrl: document.getElementById('brandWeb').value || undefined
      };
      const res = await fetch('/api/v1/admin/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Marca / Proveedor guardado';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
        setTimeout(() => window.location.reload(), 800);
      }
    });

    document.getElementById('newAttributeForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('attrMsg');
      const options = document.getElementById('attrOptions').value
        .split(',')
        .map(o => o.trim())
        .filter(Boolean);
      const payload = {
        name: document.getElementById('attrName').value,
        code: document.getElementById('attrCode').value,
        type: document.getElementById('attrType').value,
        options
      };
      const res = await fetch('/api/v1/admin/attributes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        msg.textContent = '✅ Atributo configurado';
        msg.style.background = '#065f46';
        msg.style.display = 'block';
        setTimeout(() => window.location.reload(), 800);
      }
    });

    document.getElementById('newBannerForm')?.addEventListener('submit', async (e) => {
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
        setTimeout(() => window.location.reload(), 800);
      }
    });

    document.getElementById('newAnnouncementForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = document.getElementById('aMsg');
      const payload = {
        message: document.getElementById('aMsgText').value,
        linkUrl: document.getElementById('aLink').value || undefined,
        placement: document.getElementById('aPlacement')?.value || 'top_bar'
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
        setTimeout(() => window.location.reload(), 800);
      }
    });


    document.getElementById('settingsForm')?.addEventListener('submit', async (e) => {
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
