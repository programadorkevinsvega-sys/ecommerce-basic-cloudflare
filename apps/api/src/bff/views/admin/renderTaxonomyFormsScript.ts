export function renderTaxonomyFormsScript(): string {
  return `
    const catalogPageCopy = {
      categories:['Categorías','Organiza los productos en categorías independientes.'],
      brands:['Marcas','Administra marcas y su información pública.'],
      providers:['Proveedores','Registra y consulta los proveedores de tus productos.'],
      attributes:['Atributos','Define características que se pueden asignar a los productos.'],
      variants:['Variantes','Administra SKU, opciones, precio y stock por variante.']
    };
    window.showCatalogPage = (key, navButton) => {
      document.querySelectorAll('[data-taxonomy-page]').forEach((page) => { page.hidden = page.dataset.taxonomyPage !== key; });
      document.querySelectorAll('.admin-nav-link[data-tab="taxonomies"]').forEach((button) => {
        const selected = button === navButton;
        button.classList.toggle('active', selected);
        if (selected) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
      });
      const copy = catalogPageCopy[key] || catalogPageCopy.categories;
      document.getElementById('taxonomy-page-title').textContent = copy[0];
      document.getElementById('taxonomy-page-description').textContent = document.querySelector('[data-taxonomy-page="' + key + '"]')?.dataset.taxonomyDescription || copy[1];
    };
    window.showCatalogPage('categories',document.querySelector('.admin-nav-link[data-tab="taxonomies"]'));

    let taxonomyFocus = null;
    window.openTaxonomyModal = (key) => {
      const modal = document.getElementById('taxonomy-modal-' + key);
      if (!modal) return;
      taxonomyFocus = document.activeElement;
      modal.hidden = false;
      modal.querySelector('.taxonomy-modal-dialog')?.focus();
      modal.querySelector('input,select,textarea')?.focus();
    };
    window.closeTaxonomyModal = (key) => {
      const modal = document.getElementById('taxonomy-modal-' + key);
      if (modal) modal.hidden = true;
      taxonomyFocus?.focus?.();
    };
    window.saveBrandDescription = async (id) => {
      const description = document.getElementById('brand-description-' + id)?.value || '';
      const response = await fetch('/api/v1/admin/brands/' + encodeURIComponent(id) + '/description', {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({description})});
      if (response.ok) window.location.reload();
      else window.alert('No se pudo guardar la descripción de la marca.');
    };
    document.addEventListener('keydown',(event) => {
      const modal = document.querySelector('.taxonomy-modal:not([hidden])');
      if (!modal) return;
      if (event.key === 'Escape') window.closeTaxonomyModal(modal.id.replace('taxonomy-modal-',''));
      if (event.key === 'Tab') {
        const focusable = [...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });

    const slugify = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    [['catName','catSlug'],['brandName','brandSlug']].forEach(([nameId,slugId]) => {
      const name = document.getElementById(nameId), slug = document.getElementById(slugId);
      name?.addEventListener('input',() => { if (slug && !slug.dataset.edited) slug.value = slugify(name.value); });
      slug?.addEventListener('input',() => { slug.dataset.edited = slug.value ? 'true' : ''; });
    });

    async function submitCatalogForm(event,key,url,makePayload) {
      event.preventDefault();
      const form = event.currentTarget, button = form.querySelector('button[type="submit"]');
      const message = document.getElementById(key + 'Msg');
      message.textContent = '';
      button.disabled = true;
      try {
        const response = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(makePayload())});
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'No se pudo guardar. Revisa los datos e inténtalo otra vez.');
        }
        window.location.reload();
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : 'No se pudo guardar.';
        button.disabled = false;
      }
    }
    document.getElementById('newCategoryForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'categories','/api/v1/admin/categories',() => ({
      name:document.getElementById('catName').value.trim(),slug:document.getElementById('catSlug').value || undefined,description:document.getElementById('catDesc').value.trim() || undefined
    })));
    document.getElementById('newBrandForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'brands','/api/v1/admin/brands',() => ({
      name:document.getElementById('brandName').value.trim(),slug:document.getElementById('brandSlug').value || undefined,description:document.getElementById('brandDescription').value.trim() || undefined,websiteUrl:document.getElementById('brandWeb').value || undefined
    })));
    document.getElementById('newAttributeForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'attributes','/api/v1/admin/attributes',() => ({
      name:document.getElementById('attrName').value.trim(),code:document.getElementById('attrCode').value.trim(),type:document.getElementById('attrType').value,options:document.getElementById('attrOptions').value.split(',').map((v) => v.trim()).filter(Boolean)
    })));
    document.getElementById('newSupplierForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'providers','/api/v1/admin/suppliers',() => ({
      name:document.getElementById('supplierName').value.trim(),taxId:optional('supplierTaxId'),email:optional('supplierEmail'),phone:optional('supplierPhone'),websiteUrl:optional('supplierWebsite'),notes:optional('supplierNotes'),status:document.getElementById('supplierStatus').value
    })));
    document.getElementById('newVariantForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'variants','/api/v1/admin/product-variants',() => {
      const priceInput = document.getElementById('variantPrice').value.trim();
      const price = priceInput ? window.copPesosToCents('variantPrice') : undefined;
      const options = JSON.parse(document.getElementById('variantOptions').value || '{}');
      return {productId:document.getElementById('variantProduct').value,name:document.getElementById('variantName').value.trim(),sku:document.getElementById('variantSku').value.trim(),options,priceInCents:price,stockQuantity:Number(document.getElementById('variantStock').value),status:document.getElementById('variantStatus').value};
    }));

    function optional(id) { return document.getElementById(id).value.trim() || undefined; }
  `;
}
