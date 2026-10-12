export function renderProductFormsScript(): string {
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
        localCoverageZones: document.getElementById('pScope').value === 'local' && document.getElementById('pLocalZones')
          ? Array.from(document.getElementById('pLocalZones').selectedOptions).map(opt => opt.value)
          : [],
        saleMode: document.getElementById('pSaleMode').value,
        description: document.getElementById('pDesc').value,
        status: 'published'
      };

      const editId = document.getElementById('pEditId')?.value;
      const url = editId ? '/api/v1/admin/products/' + editId : '/api/v1/admin/products';
      const method = editId ? 'PUT' : 'POST';

      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok) {
          msg.textContent = editId ? '✅ Producto actualizado con éxito' : '✅ Producto creado con éxito';
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

    function onProductScopeChange() {
      const scope = document.getElementById('pScope')?.value;
      const wrap = document.getElementById('pLocalZonesWrapper');
      if (wrap) {
        wrap.style.display = scope === 'local' ? 'block' : 'none';
      }
    }
    window.onProductScopeChange = onProductScopeChange;
  `;
}
