export function renderProductFormsScript(): string {
  return `
    function readOptionalInteger(id) { const value = document.getElementById(id).value.trim(); return value ? Number(value) : null; }
    window.currentProductMediaIds = [];
    window.originalCatalogStockQuantity = null;
    window.prepareProductStockSyncOption = (editing, stockQuantity) => {
      const input = document.getElementById('pStock');
      if (input && stockQuantity !== undefined) input.value = stockQuantity;
      window.originalCatalogStockQuantity = editing && stockQuantity !== undefined ? Number(stockQuantity) : null;
      const option = document.getElementById('pStockSyncOption');
      if (option) option.style.display = editing ? 'block' : 'none';
      const confirmSync = document.getElementById('pSyncStockToInventory');
      if (confirmSync) confirmSync.checked = false;
    };
    window.setProductAttributeValues = (specifications = {}) => {
      document.querySelectorAll('[data-product-attribute]').forEach((field) => {
        const value = specifications[field.dataset.productAttribute] ?? '';
        if (field.tagName === 'SELECT' && value && !Array.from(field.options).some((option) => option.value === String(value))) {
          const legacyOption = document.createElement('option');
          legacyOption.value = String(value); legacyOption.textContent = String(value) + ' (valor existente)';
          field.append(legacyOption);
        }
        field.value = value;
      });
    };

    function updateProductMediaGrid() {
      const grid = document.getElementById('pMediaGrid');
      const hiddenInput = document.getElementById('pMediaIdsJson');
      if (hiddenInput) hiddenInput.value = JSON.stringify(window.currentProductMediaIds || []);
      if (!grid) return;
      grid.innerHTML = '';
      const list = window.currentProductMediaIds || [];
      if (list.length === 0) {
        grid.innerHTML = '<div style="font-size:0.8rem; color:#64748b; padding:0.5rem 0;">No hay imágenes cargadas aún.</div>';
        return;
      }
      list.forEach((mId, index) => {
        const item = document.createElement('div');
        item.style.cssText = 'position:relative; width:80px; height:80px; border-radius:8px; overflow:hidden; border:2px solid ' + (index === 0 ? '#315b43' : '#d8ded8') + '; background:#f3f5f2;';
        item.innerHTML = '<img src="/media/' + mId + '" style="width:100%; height:100%; object-fit:cover;" />' +
          (index === 0 ? '<span style="position:absolute; bottom:0; left:0; right:0; background:rgba(49,91,67,0.92); color:#fff; font-size:0.6rem; text-align:center; font-weight:bold; padding:2px 0;">Principal</span>' : '') +
          '<button type="button" onclick="removeProductMedia(' + index + ')" style="position:absolute; top:2px; right:2px; width:20px; height:20px; border-radius:50%; background:rgba(0,0,0,0.7); color:#fff; border:none; cursor:pointer; font-size:12px; line-height:1; display:flex; align-items:center; justify-content:center;">&times;</button>';
        grid.appendChild(item);
      });
    }

    function removeProductMedia(index) {
      if (window.currentProductMediaIds) {
        window.currentProductMediaIds.splice(index, 1);
        updateProductMediaGrid();
      }
    }

    document.getElementById('pStock')?.addEventListener('input', () => {
      if (document.getElementById('pEditId')?.value) {
        const confirmSync = document.getElementById('pSyncStockToInventory');
        if (confirmSync) confirmSync.checked = Number(document.getElementById('pStock').value) !== window.originalCatalogStockQuantity;
      }
    });

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

      document.querySelectorAll('[data-product-attribute]').forEach((field) => {
        if (field.value !== '') specs[field.dataset.productAttribute] = field.type === 'number' ? Number(field.value) : field.value;
        else delete specs[field.dataset.productAttribute];
      });

      const tags = Array.from(document.getElementById('pTags').selectedOptions).map(option => option.value);
      const relatedBlogPostIds = Array.from(document.getElementById('pRelatedBlogPosts').selectedOptions).map(option => option.value);
      const editId = document.getElementById('pEditId')?.value;
      const payload = {
        name: document.getElementById('pName').value,
        slug: document.getElementById('pSlug').value,
        sku: document.getElementById('pSku').value,
        priceInCents: window.copPesosToCents('pPrice'),
        supplierCostCents: window.copPesosToCents('pCost'),
        pricingTargetType: document.getElementById('pTargetType').value,
        targetMarginBasisPoints: Math.round(Number(document.getElementById('pMargin').value) * 100),
        targetProfitCents: document.getElementById('pTargetType').value === 'profit' ? window.copPesosToCents('pTargetProfit') : null,
        packedWidthCm: readOptionalInteger('pPackedWidth'),
        packedLengthCm: readOptionalInteger('pPackedLength'),
        packedHeightCm: readOptionalInteger('pPackedHeight'),
        packedWeightGrams: readOptionalInteger('pPackedWeight'),
        allowedPaymentMethods: [
          ...(document.getElementById('pPayWompi').checked ? ['wompi'] : []),
          ...(document.getElementById('pCod').value === 'true' ? ['cash_on_delivery'] : [])
        ],
        stockQuantity: Number(document.getElementById('pStock').value),
        ...(editId ? { syncStockToInventory: document.getElementById('pSyncStockToInventory')?.checked === true } : {}),
        condition: document.getElementById('pCondition').value,
        brand: document.getElementById('pBrand').value || undefined,
        productType: document.getElementById('pType').value || undefined,
        barcodeGtin: document.getElementById('pGtin').value || undefined,
        seoTitle: document.getElementById('pSeoTitle').value || undefined,
        seoDescription: document.getElementById('pSeoDesc').value || undefined,
        canonicalUrl: document.getElementById('pCanonical').value || undefined,
        noindex: document.getElementById('pNoindex').checked,
        electronicInvoiceEnabled: document.getElementById('pElectronicInvoice').checked,
        specifications: specs,
        tags,
        guideTitle: document.getElementById('pGuideTitle').value.trim(),
        guideContent: document.getElementById('pGuideContent').value.trim(),
        relatedBlogPostIds,
        allowsCashOnDelivery: document.getElementById('pCod').value === 'true',
        shippingScope: document.getElementById('pScope').value,
        localCoverageZones: document.getElementById('pScope').value === 'local' && document.getElementById('pLocalZones')
          ? Array.from(document.getElementById('pLocalZones').selectedOptions).map(opt => opt.value)
          : [],
        saleMode: document.getElementById('pSaleMode').value,
        description: document.getElementById('pDesc').value,
        mediaIds: (window.currentProductMediaIds || []).slice(0, 5),
        status: 'published'
      };

      if (payload.allowedPaymentMethods.length === 0) {
        msg.textContent = '❌ Activa al menos Wompi o permite el pago contra entrega para este producto.';
        msg.style.background = '#7f1d1d';
        msg.style.display = 'block';
        return;
      }

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
      if (wrap) wrap.style.display = scope === 'local' ? 'block' : 'none';
    }

    async function handleProductImageSelected(input) {
      if (!input.files || input.files.length === 0) return;
      if (!window.currentProductMediaIds) window.currentProductMediaIds = [];
      const files = Array.from(input.files);
      const remainingSlots = 5 - window.currentProductMediaIds.length;
      if (remainingSlots <= 0) {
        alert('Ya has alcanzado el máximo de 5 imágenes permitidas para este producto.');
        input.value = '';
        return;
      }
      const filesToUpload = files.slice(0, remainingSlots);
      const statusSpan = document.getElementById('pImageUploadStatus');
      if (statusSpan) {
        statusSpan.textContent = '⏳ Subiendo ' + filesToUpload.length + ' imagen(es) a R2...';
        statusSpan.style.color = '#56675b';
      }
      for (const file of filesToUpload) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('altText', document.getElementById('pName')?.value || file.name.replace(/\\.[^/.]+$/, ''));
        formData.append('isPrivate', 'false');
        try {
          const headers = window.adminHeaders ? window.adminHeaders(false) : {};
          const res = await fetch('/media/upload', { method: 'POST', headers, body: formData });
          const json = await res.json();
          if (res.ok && json.data?.id) {
            window.currentProductMediaIds.push(json.data.id);
            updateProductMediaGrid();
          }
        } catch {}
      }
      input.value = '';
      if (statusSpan) {
        statusSpan.textContent = '✅ Imágenes listas (' + window.currentProductMediaIds.length + '/5)';
        statusSpan.style.color = '#18764b';
      }
    }

    window.updateProductMediaGrid = updateProductMediaGrid;
    window.removeProductMedia = removeProductMedia;
    window.onProductScopeChange = onProductScopeChange;
    window.handleProductImageSelected = handleProductImageSelected;
    window.updateRecommendedProductPrice = updateRecommendedProductPrice;
  `;
}
