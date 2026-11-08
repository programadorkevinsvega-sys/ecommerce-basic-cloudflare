export function renderAdminProductEditScript(): string {
  return `
    async function editProduct(productIdOrJson) {
      try {
        let p = productIdOrJson;
        if (typeof productIdOrJson === 'string') {
          p = (window.__catalogProducts && window.__catalogProducts[productIdOrJson]) ? window.__catalogProducts[productIdOrJson] : JSON.parse(productIdOrJson);
          if (!Array.isArray(p.mediaIds) || !p.salePolicy) {
            const response = await fetch('/api/v1/admin/products/' + encodeURIComponent(p.id), { headers: adminHeaders(), cache: 'no-store' });
            const result = await response.json();
            if (!response.ok || !result.product) throw new Error(result.error || 'No se pudo cargar el producto.');
            p = result.product;
            window.__catalogProducts[p.id] = p;
          }
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
        window.prepareProductStockSyncOption?.(true, p.stockQuantity ?? 10);
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
          for (let i = 0; i < localSelect.options.length; i++) localSelect.options[i].selected = coveredSet.has(localSelect.options[i].value);
        }
        document.getElementById('pSaleMode').value = p.salePolicy?.saleMode || 'both';
        document.getElementById('pDesc').value = p.description || '';
        document.getElementById('pSpecs').value = JSON.stringify(p.specifications || {});
        window.setProductAttributeValues?.(p.specifications || {});
        document.getElementById('pSeoTitle').value = p.seoTitle || '';
        document.getElementById('pCanonical').value = p.canonicalUrl || '';
        document.getElementById('pSeoDesc').value = p.seoDescription || '';
        document.getElementById('pNoindex').checked = Boolean(p.noindex);
        document.getElementById('pElectronicInvoice').checked = Boolean(p.electronicInvoiceEnabled);
        window.currentProductMediaIds = Array.isArray(p.mediaIds) ? [...p.mediaIds] : [];
        window.updateProductMediaGrid?.();
        document.getElementById('pFormTitle').textContent = 'Editar Producto: ' + p.name;
        document.getElementById('pSubmitBtn').textContent = 'Guardar Cambios';
        document.getElementById('pCancelBtn').style.display = 'inline-block';
        updateSerpPreview();
        window.openProductModal?.();
        document.getElementById('newProductForm').scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'No fue posible cargar el producto para editar.';
        alert(message);
      }
    }
  `;
}
