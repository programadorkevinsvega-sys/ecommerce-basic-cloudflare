export function renderTaxonomyFormsScript(): string {
  return `
    const catalogPageCopy = {
      categories:['Categorías','Organiza los productos en categorías independientes.'],
      brands:['Marcas','Administra marcas y su información pública.'],
      providers:['Proveedores','Registra y consulta los proveedores de tus productos.'],
      attributes:['Atributos','Define características que se pueden asignar a los productos.'],
      variants:['Variantes','Administra SKU, opciones, precio y stock por variante.'],
      collections:['Colecciones','Organiza productos publicados en páginas con dirección propia.'],
      tags:['Etiquetas','Crea y administra etiquetas para asignarlas desde el formulario de cada producto.']
    };
    const taxonomyPages = Object.create(null), taxonomyEndpoints = { categories:'categories',brands:'brands',providers:'suppliers',attributes:'attributes',variants:'product-variants',collections:'collections',tags:'product-tags' };
    window.catalogPageCopy=catalogPageCopy; window.catalogTaxonomyPages=taxonomyPages;
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
      loadCatalogPage(key, taxonomyPages[key]?.page || 1);
    };
    async function loadCatalogPage(key, page) {
      const body = document.getElementById('taxonomy-body-' + key);
      if (!body) return; body.innerHTML = '<tr><td colspan="8" class="taxonomy-empty">Cargando registros…</td></tr>';
      try {
        const response = await fetch('/api/v1/admin/' + taxonomyEndpoints[key] + '?page=' + page, { headers: adminHeaders() }); const result = await response.json();
        if (!response.ok || !result.success || !Array.isArray(result.data)) throw new Error(result.error || 'No fue posible cargar esta página.');
        taxonomyPages[key] = { page: result.page, hasMore: result.hasMore, records: result.data };
        if (!result.data.length && result.page > 1) return loadCatalogPage(key, result.page - 1);
        body.innerHTML = result.data.length ? result.data.map((item) => window.renderCatalogTaxonomyRow(key, item)).join('') : '<tr><td colspan="8" class="taxonomy-empty">No hay registros para mostrar.</td></tr>';
        const pager = document.getElementById('taxonomy-pagination-' + key);
        pager.hidden = false;
        pager.querySelector('span').textContent = result.total + ' registros · Página ' + result.page;
        pager.querySelector('[data-page-direction="previous"]').disabled = result.page <= 1;
        pager.querySelector('[data-page-direction="next"]').disabled = !result.hasMore;
        pager.querySelector('[data-page-direction="previous"]').onclick = () => loadCatalogPage(key, result.page - 1);
        pager.querySelector('[data-page-direction="next"]').onclick = () => loadCatalogPage(key, result.page + 1);
        const count = document.getElementById('taxonomy-count-' + key);
        if (count) count.textContent = result.total + ' registros · página ' + result.page + ' · ' + result.data.length + ' en esta página';
      } catch (error) {
        body.innerHTML = '<tr><td colspan="8" class="taxonomy-empty">' + escapeHtml(error.message || 'Error al cargar registros.') + '</td></tr>';
      }
    }
    window.loadCatalogPage = loadCatalogPage;

    let taxonomyFocus = null, taxonomyEditing = null;
    window.setVariantAttributeValues = (values = {}) => {
      const stored = document.getElementById('variantOptions');
      if (stored) stored.value = JSON.stringify(values);
      document.querySelectorAll('[data-variant-option]').forEach((field) => {
        const value = values[field.dataset.variantOption] ?? '';
        if (field.tagName === 'SELECT' && value && !Array.from(field.options).some((option) => option.value === String(value))) {
          const legacyOption = document.createElement('option');
          legacyOption.value = String(value); legacyOption.textContent = String(value) + ' (valor existente)';
          field.append(legacyOption);
        }
        field.value = value;
      });
    };
    window.openTaxonomyModal = (key, item) => {
      const modal = document.getElementById('taxonomy-modal-' + key);
      if (!modal) return;
      taxonomyEditing = item ? { key, id:item.id } : null;
      modal.dataset.editId = item?.id || '';
      modal.querySelector('h2').textContent = item ? 'Editar ' + (catalogPageCopy[key]?.[0] || 'registro').toLowerCase() : modal.dataset.createTitle;
      modal.querySelector('form')?.reset();
      if (key === 'collections') window.resetCollectionFormControls();
      if (key === 'brands') window.setBrandImage('');
      modal.querySelectorAll('input[id$="Slug"]').forEach((field) => { delete field.dataset.edited; if (item) field.dataset.edited = 'true'; });
      if (item) fillTaxonomyForm(key, item);
      if (key === 'collections' && !item) window.openCollectionProductPicker();
      taxonomyFocus = document.activeElement;
      modal.hidden = false;
      modal.querySelector('.taxonomy-modal-dialog')?.focus();
      modal.querySelector('input,select,textarea')?.focus();
    };
    function fillTaxonomyForm(key, item) {
      const fields = {
        categories:{catName:item.name,catSlug:item.slug,catDesc:item.description}, brands:{brandName:item.name,brandSlug:item.slug,brandDescription:item.description,brandWeb:item.websiteUrl},
        providers:{supplierName:item.name,supplierTaxId:item.taxId,supplierEmail:item.email,supplierPhone:item.phone,supplierWebsite:item.websiteUrl,supplierNotes:item.notes,supplierStatus:item.status},
        attributes:{attrName:item.name,attrCode:item.code,attrType:item.type,attrOptions:(item.options || []).join(', ')},
        variants:{variantProduct:item.productId,variantName:item.name,variantSku:item.sku,variantOptions:JSON.stringify(item.options || {},null,2),variantStock:item.stockQuantity,variantStatus:item.status},
        tags:{tagName:item.name,tagDescription:item.description,tagStatus:item.status},
        collections:{collectionName:item.name,collectionSlug:item.slug,collectionDescription:item.description,collectionStatus:item.status,collectionSeoTitle:item.seoTitle,collectionSeoDescription:item.seoDescription},
      }[key] || {};
      Object.entries(fields).forEach(([id,value]) => { const field = document.getElementById(id); if (field) field.value = value ?? ''; });
      if (key === 'variants') window.setVariantAttributeValues?.(item.options || {});
      if (key === 'variants') window.setCopInputValue('variantPrice', item.priceInCents == null ? '' : Math.round(item.priceInCents / 100));
      if (key === 'collections') { window.setCollectionProducts(item.productIds || []); window.setCollectionImage(item.imageMediaId || ''); }
      if (key === 'brands') window.setBrandImage(item.imageMediaId || '');
    }
    window.closeTaxonomyModal = (key) => {
      const modal = document.getElementById('taxonomy-modal-' + key);
      if (modal) { modal.hidden = true; modal.dataset.editId=''; modal.querySelector('form')?.reset(); modal.querySelector('h2').textContent = modal.dataset.createTitle; if (key === 'collections') window.resetCollectionFormControls(); }
      taxonomyEditing = null;
      taxonomyFocus?.focus?.();
    };
    window.saveBrandDescription = async (id) => {
      const description = document.getElementById('brand-description-' + id)?.value || '', response = await fetch('/api/v1/admin/brands/' + encodeURIComponent(id) + '/description', {method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({description})});
      if (response.ok) window.location.reload(); else window.alert('No se pudo guardar la descripción de la marca.');
    };
    document.addEventListener('keydown',(event) => {
      const modal = document.querySelector('.taxonomy-modal:not([hidden])');
      if (!modal) return; if (event.key === 'Escape') window.closeTaxonomyModal(modal.id.replace('taxonomy-modal-',''));
      if (event.key === 'Tab') {
        const focusable = [...modal.querySelectorAll('button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled])')];
        const first = focusable[0], last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });

    const slugify = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
    [['catName','catSlug'],['brandName','brandSlug'],['collectionName','collectionSlug']].forEach(([nameId,slugId]) => {
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
        const editing = taxonomyEditing?.key === key ? taxonomyEditing : null;
        const targetUrl = editing ? (key === 'collections' ? '/api/v1/admin/collections/' : key === 'tags' ? '/api/v1/admin/product-tags/' : '/api/v1/admin/catalog/' + key + '/') + encodeURIComponent(editing.id) : url;
        const payload = makePayload();
        if (key === 'brands' && editing) payload.imageMediaId = optional('brandImageId') || null;
        const response = await fetch(targetUrl,{method:editing ? 'PUT' : 'POST',headers:adminHeaders(true),body:JSON.stringify(payload)});
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'No se pudo guardar. Revisa los datos e inténtalo otra vez.');
        }
        window.location.reload();
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : 'No se pudo guardar.'; button.disabled = false;
      }
    }
    document.getElementById('newCategoryForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'categories','/api/v1/admin/categories',() => ({ name:document.getElementById('catName').value.trim(),slug:document.getElementById('catSlug').value || undefined,description:document.getElementById('catDesc').value.trim() || undefined })));
    document.getElementById('newBrandForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'brands','/api/v1/admin/brands',() => ({ name:document.getElementById('brandName').value.trim(),slug:document.getElementById('brandSlug').value || undefined,description:document.getElementById('brandDescription').value.trim() || undefined,websiteUrl:document.getElementById('brandWeb').value || undefined,imageMediaId:optional('brandImageId') })));
    document.getElementById('newAttributeForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'attributes','/api/v1/admin/attributes',() => ({
      name:document.getElementById('attrName').value.trim(),code:document.getElementById('attrCode').value.trim(),type:document.getElementById('attrType').value,options:document.getElementById('attrOptions').value.split(',').map((v) => v.trim()).filter(Boolean)
    })));
    document.getElementById('newSupplierForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'providers','/api/v1/admin/suppliers',() => ({
      name:document.getElementById('supplierName').value.trim(),taxId:optional('supplierTaxId'),email:optional('supplierEmail'),phone:optional('supplierPhone'),websiteUrl:optional('supplierWebsite'),notes:optional('supplierNotes'),status:document.getElementById('supplierStatus').value
    })));
    document.getElementById('newVariantForm')?.addEventListener('submit',(event) => submitCatalogForm(event,'variants','/api/v1/admin/product-variants',() => {
      const priceInput = document.getElementById('variantPrice').value.trim();
      const price = priceInput ? window.copPesosToCents('variantPrice') : taxonomyEditing?.key === 'variants' ? null : undefined;
      const options = JSON.parse(document.getElementById('variantOptions').value || '{}');
      document.querySelectorAll('[data-variant-option]').forEach((field) => {
        if (field.value === '') delete options[field.dataset.variantOption];
        else options[field.dataset.variantOption] = field.value;
      });
      return {productId:document.getElementById('variantProduct').value,name:document.getElementById('variantName').value.trim(),sku:document.getElementById('variantSku').value.trim(),options,priceInCents:price,stockQuantity:Number(document.getElementById('variantStock').value),status:document.getElementById('variantStatus').value};
    }));
    document.getElementById('newCollectionForm')?.addEventListener('submit',(event)=>submitCatalogForm(event,'collections','/api/v1/admin/collections',()=>({name:document.getElementById('collectionName').value.trim(),slug:document.getElementById('collectionSlug').value.trim(),description:document.getElementById('collectionDescription').value.trim(),imageMediaId:optional('collectionImageId')||null,status:document.getElementById('collectionStatus').value,productIds:window.getCollectionProductIds(),seoTitle:optional('collectionSeoTitle'),seoDescription:optional('collectionSeoDescription')})));
    document.getElementById('newProductTagForm')?.addEventListener('submit',(event)=>submitCatalogForm(event,'tags','/api/v1/admin/product-tags',()=>({name:document.getElementById('tagName').value.trim(),description:document.getElementById('tagDescription').value.trim(),status:document.getElementById('tagStatus').value})));
    function optional(id) { return document.getElementById(id).value.trim() || undefined; }

  `;
}
