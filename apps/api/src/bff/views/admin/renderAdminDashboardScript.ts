export function renderAdminDashboardScript(): string {
  return `
    function switchTab(tabId, navButton) {
      document.querySelectorAll('.tab-btn').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
      });
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const selected = navButton || document.querySelector('[data-tab="' + tabId + '"]');
      selected?.classList.add('active');
      selected?.setAttribute('aria-current', 'page');
      window.saveAdminNavigationState?.(selected);
      const summary = document.getElementById('tab-summary');
      const legacy = document.getElementById('admin-legacy-tabs');
      const section = document.getElementById('tab-' + tabId);
      legacy?.classList.toggle('orders-mode', tabId === 'orders');
      document.querySelector('.admin-main')?.classList.toggle('orders-page-active', tabId === 'orders');
      document.querySelector('.admin-main')?.classList.toggle('summary-page-active', tabId === 'summary');
      legacy?.classList.toggle('inventory-mode', tabId === 'inventory');
      document.querySelector('.admin-main')?.classList.toggle('inventory-page-active', tabId === 'inventory');
      legacy?.classList.toggle('payments-mode', tabId === 'payments');
      document.querySelector('.admin-main')?.classList.toggle('payments-page-active', tabId === 'payments');
      legacy?.classList.toggle('shipping-mode', tabId === 'shipping');
      document.querySelector('.admin-main')?.classList.toggle('shipping-page-active', tabId === 'shipping');
      legacy?.classList.toggle('invoices-mode', tabId === 'invoices');
      document.querySelector('.admin-main')?.classList.toggle('invoices-page-active', tabId === 'invoices');
      legacy?.classList.toggle('taxonomies-mode', tabId === 'taxonomies');
      document.querySelector('.admin-main')?.classList.toggle('taxonomies-page-active', tabId === 'taxonomies');
      legacy?.classList.toggle('cms-mode', tabId === 'cms'); legacy?.classList.toggle('menus-mode', tabId === 'menus'); legacy?.classList.toggle('blog-mode', tabId === 'blog'); legacy?.classList.toggle('reviews-mode', tabId === 'reviews');
      document.querySelector('.admin-main')?.classList.toggle('blog-page-active', tabId === 'blog');
      legacy?.classList.toggle('storefront-mode', tabId === 'storefront');
      legacy?.classList.toggle('promotions-mode', tabId === 'promotions');
      legacy?.classList.toggle('products-mode', tabId === 'products');
      document.querySelector('.admin-main')?.classList.toggle('products-page-active', tabId === 'products');
      if (tabId === 'payments' && !navButton && typeof window.showAdminPaymentPage === 'function') window.showAdminPaymentPage('collections'); if (tabId === 'shipping' && !navButton && typeof window.showAdminShippingPage === 'function') window.showAdminShippingPage('zones');
      if (tabId === 'summary') {
        summary?.classList.add('active');
        if (legacy) legacy.hidden = true;
      } else if (section) {
        section.classList.add('active');
        if (legacy) legacy.hidden = false;
      }
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
          .toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
      updateSerpPreview();
      const canon = document.getElementById('pCanonical');
      if (canon && !canon.dataset.manual) {
        canon.value = window.location.origin + '/productos/' + slugInput.value;
      }
    });

    document.getElementById('pSlug')?.addEventListener('input', (e) => {
      e.target.dataset.manual = 'true';
      updateSerpPreview();
      const canon = document.getElementById('pCanonical');
      if (canon && !canon.dataset.manual) {
        canon.value = window.location.origin + '/productos/' + e.target.value;
      }
    });

    document.getElementById('pCanonical')?.addEventListener('input', (e) => { e.target.dataset.manual = 'true'; });
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
        method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status })
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
          p = (window.__catalogProducts && window.__catalogProducts[productIdOrJson]) ? window.__catalogProducts[productIdOrJson] : JSON.parse(productIdOrJson);
        }
        document.getElementById('pEditId').value = p.id;
        document.getElementById('pName').value = p.name || '';
        document.getElementById('pSlug').value = p.slug || '';
        document.getElementById('pSku').value = p.sku || '';
        window.setCopInputValue('pPrice', Math.round((p.priceInCents || 0) / 100));
        window.setCopInputValue('pCost', p.supplierCostCents == null ? '' : Math.round(p.supplierCostCents / 100));
        document.getElementById('pMargin').value = Number(p.targetMarginBasisPoints || 2000) / 100;
        document.getElementById('pTargetType').value = p.pricingTargetType || 'margin';
        window.setCopInputValue('pTargetProfit', p.targetProfitCents == null ? '' : Math.round(p.targetProfitCents / 100));
        [['pPackedWidth', p.packedWidthCm], ['pPackedLength', p.packedLengthCm], ['pPackedHeight', p.packedHeightCm], ['pPackedWeight', p.packedWeightGrams]].forEach(([id, value]) => { document.getElementById(id).value = value ?? ''; });
        const paymentMethods = p.allowedPaymentMethods || ['wompi', 'cash_on_delivery']; document.getElementById('pPayWompi').checked = paymentMethods.includes('wompi');
        window.updateProductPricingTargetFields?.();
        window.updateRecommendedProductPrice?.();
        document.getElementById('pStock').value = p.stockQuantity ?? 10;
        document.getElementById('pCondition').value = p.condition || 'new';
        document.getElementById('pBrand').value = p.brand || '';
        document.getElementById('pType').value = p.productType || '';
        document.getElementById('pGtin').value = p.barcodeGtin || '';
        window.setProductEditorialFields?.(p);
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
        window.setProductAttributeValues?.(p.specifications || {});
        document.getElementById('pSeoTitle').value = p.seoTitle || '';
        document.getElementById('pCanonical').value = p.canonicalUrl || '';
        document.getElementById('pSeoDesc').value = p.seoDescription || '';
        document.getElementById('pNoindex').checked = Boolean(p.noindex);

        // Soporte de hasta 5 imágenes en edición
        if (Array.isArray(p.mediaIds)) {
          window.currentProductMediaIds = [...p.mediaIds];
        } else {
          window.currentProductMediaIds = [];
        }
        if (typeof window.updateProductMediaGrid === 'function') {
          window.updateProductMediaGrid();
        }

        document.getElementById('pFormTitle').textContent = 'Editar Producto: ' + p.name;
        document.getElementById('pSubmitBtn').textContent = 'Guardar Cambios';
        document.getElementById('pCancelBtn').style.display = 'inline-block';
        updateSerpPreview();
      window.openProductModal?.();
        document.getElementById('newProductForm').scrollIntoView({ behavior: 'smooth' });
      } catch (err) {
        console.error('No fue posible cargar el producto para editar');
      }
    }

    function resetProductForm() {
      document.getElementById('pEditId').value = '';
      document.getElementById('newProductForm').reset();
      window.updateProductPricingTargetFields?.();
      window.updateRecommendedProductPrice?.();
      const wrap = document.getElementById('pLocalZonesWrapper');
      if (wrap) wrap.style.display = 'none';
      window.currentProductMediaIds = [];
      if (typeof window.updateProductMediaGrid === 'function') {
        window.updateProductMediaGrid();
      }
      const statusSpan = document.getElementById('pImageUploadStatus');
      if (statusSpan) statusSpan.textContent = '';
      document.getElementById('pFormTitle').textContent = 'Crear Nuevo Producto';
      document.getElementById('pSubmitBtn').textContent = 'Guardar Producto';
      document.getElementById('pCancelBtn').style.display = 'none';
      updateSerpPreview();
      window.closeProductModal?.();
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
