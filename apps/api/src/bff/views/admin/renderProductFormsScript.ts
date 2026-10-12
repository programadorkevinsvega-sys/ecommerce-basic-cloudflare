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
        mediaIds: document.getElementById('pMediaId')?.value ? [document.getElementById('pMediaId').value] : [],
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

    function onProductScopeChange() {
      const scope = document.getElementById('pScope')?.value;
      const wrap = document.getElementById('pLocalZonesWrapper');
      if (wrap) {
        wrap.style.display = scope === 'local' ? 'block' : 'none';
      }
    }

    async function handleProductImageSelected(input) {
      if (!input.files || input.files.length === 0) return;
      const file = input.files[0];
      const statusSpan = document.getElementById('pImageUploadStatus');
      const previewImg = document.getElementById('pImagePreview');
      const placeholder = document.getElementById('pImagePlaceholder');
      const mediaIdInput = document.getElementById('pMediaId');
      const altText = document.getElementById('pName')?.value || file.name.replace(/\\.[^/.]+$/, '');

      if (statusSpan) {
        statusSpan.textContent = '⏳ Subiendo imagen a R2...';
        statusSpan.style.color = '#38bdf8';
      }

      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', altText);
      formData.append('isPrivate', 'false');

      try {
        const headers = window.adminHeaders ? window.adminHeaders(false) : {};
        const res = await fetch('/media/upload', {
          method: 'POST',
          headers,
          body: formData
        });
        const json = await res.json();
        if (res.ok && json.data?.id) {
          mediaIdInput.value = json.data.id;
          if (previewImg && placeholder) {
            previewImg.src = '/media/' + json.data.id;
            previewImg.style.display = 'block';
            placeholder.style.display = 'none';
          }
          if (statusSpan) {
            statusSpan.textContent = '✅ Imagen subida y lista';
            statusSpan.style.color = '#34d399';
          }
        } else {
          if (statusSpan) {
            statusSpan.textContent = '❌ ' + (json.error || 'Error al subir');
            statusSpan.style.color = '#f87171';
          }
        }
      } catch (err) {
        if (statusSpan) {
          statusSpan.textContent = '❌ Error de conexión al subir';
          statusSpan.style.color = '#f87171';
        }
      }
    }

    window.onProductScopeChange = onProductScopeChange;
    window.handleProductImageSelected = handleProductImageSelected;
  `;
}
