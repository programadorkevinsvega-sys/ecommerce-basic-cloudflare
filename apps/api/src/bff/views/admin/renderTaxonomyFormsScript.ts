export function renderTaxonomyFormsScript(): string {
  return `
    const catalogPageCopy = {
      categories:['Categorías','Organiza los productos en categorías independientes.'],
      brands:['Marcas','Administra marcas y su información pública.'],
      providers:['Proveedores','Registra y consulta los proveedores de tus productos.'],
      attributes:['Atributos','Define características que se pueden asignar a los productos.'],
      variants:['Variantes','Administra SKU, opciones, precio y stock por variante.'],
      collections:['Colecciones','Organiza productos publicados en páginas con dirección propia.']
    };
    const taxonomyPages = Object.create(null), taxonomyEndpoints = { categories:'categories',brands:'brands',providers:'suppliers',attributes:'attributes',variants:'product-variants',collections:'collections' };
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
        body.innerHTML = result.data.length ? result.data.map((item) => renderCatalogTaxonomyRow(key, item)).join('') : '<tr><td colspan="8" class="taxonomy-empty">No hay registros para mostrar.</td></tr>';
        const pager = document.getElementById('taxonomy-pagination-' + key);
        pager.hidden = false;
        pager.querySelector('span').textContent = 'Página ' + result.page;
        pager.querySelector('[data-page-direction="previous"]').disabled = result.page <= 1;
        pager.querySelector('[data-page-direction="next"]').disabled = !result.hasMore;
        pager.querySelector('[data-page-direction="previous"]').onclick = () => loadCatalogPage(key, result.page - 1);
        pager.querySelector('[data-page-direction="next"]').onclick = () => loadCatalogPage(key, result.page + 1);
        const count = document.getElementById('taxonomy-count-' + key);
        if (count) count.textContent = result.data.length + ' registros por página · página ' + result.page;
      } catch (error) {
        body.innerHTML = '<tr><td colspan="8" class="taxonomy-empty">' + escapeHtml(error.message || 'Error al cargar registros.') + '</td></tr>';
      }
    }
    function renderCatalogTaxonomyRow(key, item) {
      const e = escapeHtml;
      if (key === 'categories') return '<tr><td><strong>' + e(item.name) + '</strong><small>' + e(item.description || '') + '</small></td><td><code>' + e(item.slug) + '</code></td><td>' + e(item.status || 'active') + '</td><td class="taxonomy-row-actions">' + taxonomyRowActions(key, item.id) + '</td></tr>';
      if (key === 'brands') return '<tr><td><strong>' + e(item.name) + '</strong></td><td><code>' + e(item.slug) + '</code></td><td>' + e(item.description || '—') + '</td><td>' + e(item.websiteUrl || '—') + '</td><td>' + e(item.status || 'active') + '</td><td class="taxonomy-row-actions">' + taxonomyRowActions(key, item.id) + '</td></tr>';
      if (key === 'providers') return '<tr><td><strong>' + e(item.name) + '</strong><small>' + e(item.notes || '') + '</small></td><td>' + e(item.taxId || '—') + '</td><td>' + e([item.email,item.phone].filter(Boolean).join(' · ') || '—') + '</td><td>' + e(item.status) + '</td><td class="taxonomy-row-actions">' + taxonomyRowActions(key, item.id, item.status) + '</td></tr>';
      if (key === 'attributes') return '<tr><td><strong>' + e(item.name) + '</strong></td><td><code>' + e(item.code) + '</code></td><td>' + e(item.type) + '</td><td>' + e((item.options || []).join(', ') || '—') + '</td><td>' + e(item.status || 'active') + '</td><td class="taxonomy-row-actions">' + taxonomyRowActions(key, item.id) + '</td></tr>';
      if (key === 'collections') return '<tr><td>' + (item.imageMediaId ? '<img class="collection-row-image" src="/media/' + e(item.imageMediaId) + '" alt="" loading="lazy">' : '') + '<strong>' + e(item.name) + '</strong><small>/colecciones/' + e(item.slug) + '</small></td><td>' + Number(item.productIds?.length||0) + '</td><td>' + e(item.status) + '</td><td class="taxonomy-row-actions">' + taxonomyRowActions(key,item.id,item.status) + '</td></tr>';
      return '<tr><td><strong>' + e(item.name) + '</strong><small>' + e(JSON.stringify(item.options || {})) + '</small></td><td><code>' + e(item.productId) + '</code></td><td><code>' + e(item.sku) + '</code></td><td>' + e(item.priceInCents == null ? 'Heredado' : '$ ' + (item.priceInCents / 100).toLocaleString('es-CO')) + '</td><td>' + Number(item.stockQuantity) + '</td><td>' + e(item.status) + '</td><td class="taxonomy-row-actions">' + taxonomyRowActions(key, item.id, item.status) + '</td></tr>';
    }
    function taxonomyRowActions(key, id, status) {
      const safeId = escapeHtml(String(id));
      return '<button class="taxonomy-secondary" type="button" data-taxonomy-action="view" data-taxonomy-id="' + safeId + '" data-taxonomy-key="' + key + '">Ver</button><button class="taxonomy-secondary" type="button" data-taxonomy-action="edit" data-taxonomy-id="' + safeId + '" data-taxonomy-key="' + key + '">Editar</button><button class="taxonomy-secondary" type="button" data-taxonomy-action="status" data-taxonomy-id="' + safeId + '" data-taxonomy-key="' + key + '" data-taxonomy-status="' + (status === 'inactive' ? 'active' : 'inactive') + '">' + (status === 'inactive' ? 'Mostrar' : 'Ocultar') + '</button><button class="taxonomy-danger" type="button" data-taxonomy-action="delete" data-taxonomy-id="' + safeId + '" data-taxonomy-key="' + key + '">Eliminar</button>';
    }
    document.addEventListener('click',(event) => {
      const button = event.target.closest('[data-taxonomy-action]');
      if (!button) return;
      const { taxonomyAction, taxonomyId, taxonomyKey, taxonomyStatus } = button.dataset;
      if (taxonomyAction === 'view') window.viewTaxonomyItem(taxonomyId,taxonomyKey);
      if (taxonomyAction === 'edit') window.editTaxonomyItem(taxonomyId,taxonomyKey);
      if (taxonomyAction === 'status') window.setTaxonomyStatus(taxonomyId,taxonomyKey,taxonomyStatus);
      if (taxonomyAction === 'delete') window.deleteTaxonomyItem(taxonomyId,taxonomyKey);
    });
    window.loadCatalogPage = loadCatalogPage; window.viewTaxonomyItem = (id, key) => {
      const item = taxonomyPages[key]?.records?.find((record) => record.id === id);
      if (!item) return;
      let dialog = document.getElementById('taxonomy-view-dialog');
      if (!dialog) {
        dialog = document.createElement('dialog'); dialog.id = 'taxonomy-view-dialog'; dialog.className = 'taxonomy-view-dialog';
        dialog.innerHTML = '<form method="dialog"><button class="taxonomy-modal-close" aria-label="Cerrar">×</button></form><h2></h2><pre></pre>';
        document.body.append(dialog);
      }
      dialog.setAttribute('aria-labelledby', 'taxonomy-view-title');
      dialog.querySelector('h2').id = 'taxonomy-view-title';
      dialog.querySelector('h2').textContent = (catalogPageCopy[key] || ['Registro'])[0];
      dialog.querySelector('pre').textContent = JSON.stringify(item, null, 2);
      dialog.showModal();
    };
    window.editTaxonomyItem = (id, key) => {
      const item = taxonomyPages[key]?.records?.find((record) => record.id === id);
      if (item) window.openTaxonomyModal(key, item);
    };
    window.setTaxonomyStatus = async (id, key, status) => {
      if (!confirm(status === 'inactive' ? '¿Ocultar este registro de la tienda y formularios?' : '¿Volver a mostrar este registro?')) return;
      const response = key === 'collections' ? await fetch('/api/v1/admin/collections/' + encodeURIComponent(id),{method:'PUT',headers:adminHeaders(true),body:JSON.stringify({status})}) : await fetch('/api/v1/admin/catalog/' + key + '/' + encodeURIComponent(id) + '/status', { method:'PATCH', headers:adminHeaders(true), body:JSON.stringify({ status }) });
      if (!response.ok) return alert('No se pudo cambiar el estado. Verifica el permiso catalog:edit.');
      loadCatalogPage(key, taxonomyPages[key].page);
    };
    window.deleteTaxonomyItem = async (id, key) => {
      if (!confirm('¿Eliminar definitivamente este registro? Esta acción no se puede deshacer.')) return;
      const response = await fetch((key === 'collections' ? '/api/v1/admin/collections/' : '/api/v1/admin/catalog/' + key + '/') + encodeURIComponent(id), { method:'DELETE', headers:adminHeaders(true) });
      if (!response.ok) {
        const result = await response.json().catch(() => ({}));
        return alert(result.error || 'No se pudo eliminar. Verifica dependencias y permiso catalog:delete.');
      }
      loadCatalogPage(key, taxonomyPages[key].page);
    };
    window.showCatalogPage('categories',document.querySelector('.admin-nav-link[data-tab="taxonomies"]'));

    let taxonomyFocus = null, taxonomyEditing = null;
    window.openTaxonomyModal = (key, item) => {
      const modal = document.getElementById('taxonomy-modal-' + key);
      if (!modal) return;
      taxonomyEditing = item ? { key, id:item.id } : null;
      modal.querySelector('h2').textContent = item ? 'Editar ' + (catalogPageCopy[key]?.[0] || 'registro').toLowerCase() : modal.dataset.createTitle;
      modal.querySelector('form')?.reset();
      if (key === 'collections') window.resetCollectionFormControls();
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
        collections:{collectionName:item.name,collectionSlug:item.slug,collectionDescription:item.description,collectionStatus:item.status,collectionSeoTitle:item.seoTitle,collectionSeoDescription:item.seoDescription},
      }[key] || {};
      Object.entries(fields).forEach(([id,value]) => { const field = document.getElementById(id); if (field) field.value = value ?? ''; });
      if (key === 'variants') window.setCopInputValue('variantPrice', item.priceInCents == null ? '' : Math.round(item.priceInCents / 100));
      if (key === 'collections') { window.setCollectionProducts(item.productIds || []); window.setCollectionImage(item.imageMediaId || ''); }
    }
    window.closeTaxonomyModal = (key) => {
      const modal = document.getElementById('taxonomy-modal-' + key);
      if (modal) { modal.hidden = true; modal.querySelector('form')?.reset(); modal.querySelector('h2').textContent = modal.dataset.createTitle; if (key === 'collections') window.resetCollectionFormControls(); }
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
        const targetUrl = editing ? (key === 'collections' ? '/api/v1/admin/collections/' : '/api/v1/admin/catalog/' + key + '/') + encodeURIComponent(editing.id) : url;
        const response = await fetch(targetUrl,{method:editing ? 'PUT' : 'POST',headers:adminHeaders(true),body:JSON.stringify(makePayload())});
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error || 'No se pudo guardar. Revisa los datos e inténtalo otra vez.');
        }
        window.location.reload();
      } catch (error) {
        message.textContent = error instanceof Error ? error.message : 'No se pudo guardar.'; button.disabled = false;
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
      const price = priceInput ? window.copPesosToCents('variantPrice') : taxonomyEditing?.key === 'variants' ? null : undefined;
      const options = JSON.parse(document.getElementById('variantOptions').value || '{}');
      return {productId:document.getElementById('variantProduct').value,name:document.getElementById('variantName').value.trim(),sku:document.getElementById('variantSku').value.trim(),options,priceInCents:price,stockQuantity:Number(document.getElementById('variantStock').value),status:document.getElementById('variantStatus').value};
    }));
    document.getElementById('newCollectionForm')?.addEventListener('submit',(event)=>submitCatalogForm(event,'collections','/api/v1/admin/collections',()=>({name:document.getElementById('collectionName').value.trim(),slug:document.getElementById('collectionSlug').value.trim(),description:document.getElementById('collectionDescription').value.trim(),imageMediaId:optional('collectionImageId')||null,status:document.getElementById('collectionStatus').value,productIds:window.getCollectionProductIds(),seoTitle:optional('collectionSeoTitle'),seoDescription:optional('collectionSeoDescription')})));
    function optional(id) { return document.getElementById(id).value.trim() || undefined; }
  `;
}
