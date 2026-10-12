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

    document.getElementById('pName')?.addEventListener('input', () => {
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

    document.getElementById('pSlug')?.addEventListener('input', (e) => {
      e.target.dataset.manual = 'true';
      updateSerpPreview();
    });
    document.getElementById('pSeoTitle')?.addEventListener('input', updateSerpPreview);
    document.getElementById('pDesc')?.addEventListener('input', updateSerpPreview);
    document.getElementById('pSeoDesc')?.addEventListener('input', updateSerpPreview);

    document.getElementById('logoutBtn')?.addEventListener('click', async () => {
      await fetch('/api/v1/admin/auth/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    });

    async function setProductStatus(id, status) {
      if (!confirm('¿Deseas cambiar el estado del producto?')) return;
      const res = await fetch('/api/v1/admin/products/' + id, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) window.location.reload();
      else alert('Error al actualizar estado');
    }

    async function deleteProduct(id) {
      if (!confirm('¿Seguro que deseas eliminar este producto permanentemente?')) return;
      const res = await fetch('/api/v1/admin/products/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar producto');
    }

    function editProduct(productIdOrJson) {
      try {
        let p = productIdOrJson;
        if (typeof productIdOrJson === 'string') {
          if (window.__catalogProducts && window.__catalogProducts[productIdOrJson]) {
            p = window.__catalogProducts[productIdOrJson];
          } else {
            p = JSON.parse(productIdOrJson);
          }
        }
        document.getElementById('pEditId').value = p.id;
        document.getElementById('pName').value = p.name || '';
        document.getElementById('pSlug').value = p.slug || '';
        document.getElementById('pSku').value = p.sku || '';
        document.getElementById('pPrice').value = Math.round((p.priceInCents || 0) / 100);
        document.getElementById('pStock').value = p.stockQuantity ?? 10;
        document.getElementById('pCondition').value = p.condition || 'new';
        document.getElementById('pBrand').value = p.brand || '';
        document.getElementById('pType').value = p.productType || '';
        document.getElementById('pGtin').value = p.barcodeGtin || '';
        document.getElementById('pTags').value = (p.tags || []).join(', ');
        document.getElementById('pCod').value = p.salePolicy?.allowsCashOnDelivery ? 'true' : 'false';
        const scope = p.salePolicy?.shippingScope || 'national';
        document.getElementById('pScope').value = scope;
        const wrap = document.getElementById('pLocalZonesWrapper');
        if (wrap) wrap.style.display = scope === 'local' ? 'block' : 'none';
        const localSelect = document.getElementById('pLocalZones');
        if (localSelect) {
          const coveredSet = new Set(p.salePolicy?.localCoverageZones || []);
          for (let i = 0; i < localSelect.options.length; i++) {
            localSelect.options[i].selected = coveredSet.has(localSelect.options[i].value);
          }
        }
        document.getElementById('pSaleMode').value = p.salePolicy?.saleMode || 'both';
        document.getElementById('pDesc').value = p.description || '';
        document.getElementById('pSpecs').value = JSON.stringify(p.specifications || {});
        document.getElementById('pSeoTitle').value = p.seoTitle || '';
        document.getElementById('pCanonical').value = p.canonicalUrl || '';
        document.getElementById('pSeoDesc').value = p.seoDescription || '';
        document.getElementById('pNoindex').checked = Boolean(p.noindex);

        // Soporte de imagen asociada
        const mediaId = p.mediaIds && p.mediaIds.length > 0 ? p.mediaIds[0] : '';
        document.getElementById('pMediaId').value = mediaId;
        const previewImg = document.getElementById('pImagePreview');
        const placeholder = document.getElementById('pImagePlaceholder');
        if (mediaId && previewImg && placeholder) {
          previewImg.src = '/media/' + mediaId;
          previewImg.style.display = 'block';
          placeholder.style.display = 'none';
        } else if (previewImg && placeholder) {
          previewImg.src = '';
          previewImg.style.display = 'none';
          placeholder.style.display = 'block';
        }

        document.getElementById('pFormTitle').textContent = 'Editar Producto: ' + p.name;
        document.getElementById('pSubmitBtn').textContent = 'Guardar Cambios';
        document.getElementById('pCancelBtn').style.display = 'inline-block';
        updateSerpPreview();
        document.getElementById('newProductForm').scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        console.error('Error loading product for edit', err);
      }
    }

    function resetProductForm() {
      document.getElementById('pEditId').value = '';
      document.getElementById('newProductForm').reset();
      const wrap = document.getElementById('pLocalZonesWrapper');
      if (wrap) wrap.style.display = 'none';
      document.getElementById('pMediaId').value = '';
      const previewImg = document.getElementById('pImagePreview');
      const placeholder = document.getElementById('pImagePlaceholder');
      if (previewImg) { previewImg.src = ''; previewImg.style.display = 'none'; }
      if (placeholder) { placeholder.style.display = 'block'; }
      const statusSpan = document.getElementById('pImageUploadStatus');
      if (statusSpan) statusSpan.textContent = '';
      document.getElementById('pFormTitle').textContent = 'Crear Nuevo Producto';
      document.getElementById('pSubmitBtn').textContent = 'Guardar Producto';
      document.getElementById('pCancelBtn').style.display = 'none';
      updateSerpPreview();
    }

    async function deleteCategory(id) {
      if (!confirm('¿Deseas eliminar esta categoría?')) return;
      const res = await fetch('/api/v1/admin/categories/' + id, { method: 'DELETE' });
      if (res.ok) window.location.reload();
      else alert('Error al eliminar categoría');
    }

    window.switchTab = switchTab;
    window.setProductStatus = setProductStatus;
    window.deleteProduct = deleteProduct;
    window.editProduct = editProduct;
    window.resetProductForm = resetProductForm;
    window.deleteCategory = deleteCategory;
  `;
}
