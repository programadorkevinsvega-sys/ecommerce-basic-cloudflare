export function renderCollectionFormScript(): string {
  return `
    const selectedCollectionProducts = new Map();
    let collectionSearchTimer, collectionSearchAbort, collectionUploadAbort, collectionSearchPage = 1, collectionSearchHasMore = false;
    const collectionElement = (id) => document.getElementById(id);
    function renderCollectionProductResults(products) {
      const root = collectionElement('collectionProductResults');
      root.replaceChildren();
      const pager = collectionElement('collectionProductPager');
      pager.hidden = !collectionElement('collectionProductSearch').value.trim() || (!collectionSearchHasMore && collectionSearchPage <= 1);
      pager.querySelector('span').textContent = 'Página ' + collectionSearchPage;
      pager.querySelector('[data-product-page="previous"]').disabled = collectionSearchPage <= 1;
      pager.querySelector('[data-product-page="next"]').disabled = !collectionSearchHasMore;
      if (!products.length) { root.textContent = 'No encontramos productos publicados.'; return; }
      products.forEach((product) => {
        const label = document.createElement('label'); label.className = 'collection-product-result';
        const checkbox = document.createElement('input'); checkbox.type = 'checkbox'; checkbox.checked = selectedCollectionProducts.has(product.id);
        checkbox.setAttribute('aria-label', 'Incluir ' + product.name + ' · ' + product.sku);
        checkbox.addEventListener('change', () => {
          if (checkbox.checked) selectedCollectionProducts.set(product.id, product); else selectedCollectionProducts.delete(product.id);
          renderSelectedCollectionProducts();
        });
        const copy = document.createElement('span'); copy.textContent = product.name;
        const sku = document.createElement('small'); sku.textContent = 'SKU: ' + product.sku; copy.append(sku);
        label.append(checkbox, copy); root.append(label);
      });
    }
    function renderSelectedCollectionProducts() {
      const root = collectionElement('collectionSelectedProducts'); root.replaceChildren();
      const count = selectedCollectionProducts.size;
      collectionElement('collectionProductSearchStatus').textContent = count + (count === 1 ? ' producto seleccionado' : ' productos seleccionados');
      selectedCollectionProducts.forEach((product, id) => {
        const chip = document.createElement('span'); chip.className = 'collection-selected-product';
        chip.append(document.createTextNode(product.name + ' · ' + product.sku));
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.setAttribute('aria-label', 'Quitar ' + product.name);
        remove.addEventListener('click', () => { selectedCollectionProducts.delete(id); renderSelectedCollectionProducts(); renderCollectionProductResults(window.lastCollectionProductResults || []); });
        chip.append(remove); root.append(chip);
      });
    }
    async function fetchCollectionProducts(query, ids, page = 1) {
      if (collectionSearchAbort) collectionSearchAbort.abort();
      collectionSearchAbort = new AbortController();
      const params = ids?.length ? 'ids=' + encodeURIComponent(ids.join(',')) : 'q=' + encodeURIComponent(query || '') + '&page=' + page + '&pageSize=25';
      const response = await fetch('/api/v1/admin/collection-products?' + params, { headers: window.adminHeaders(false), signal: collectionSearchAbort.signal });
      const body = await response.json();
      if (!response.ok || !Array.isArray(body.data)) throw new Error(body.error || 'No se pudo buscar productos.');
      return { items: body.data, page: body.page || 1, hasMore: Boolean(body.hasMore) };
    }
    async function searchCollectionProducts(query, page = 1) {
      collectionSearchPage = page;
      const status = collectionElement('collectionProductSearchStatus');
      status.textContent = query && query.length < 2 ? 'Escribe al menos 2 caracteres para buscar.' : 'Buscando productos…';
      if (query && query.length < 2) { if (collectionSearchAbort) collectionSearchAbort.abort(); window.lastCollectionProductResults = []; renderCollectionProductResults([]); return; }
      try {
        const result = await fetchCollectionProducts(query, null, page);
        collectionSearchHasMore = result.hasMore;
        window.lastCollectionProductResults = result.items; renderCollectionProductResults(result.items); renderSelectedCollectionProducts();
      } catch (error) {
        if (error.name !== 'AbortError') status.textContent = error.message || 'No se pudo buscar productos.';
      }
    }
    window.resetCollectionFormControls = () => {
      if (collectionSearchAbort) collectionSearchAbort.abort(); clearTimeout(collectionSearchTimer);
      if (collectionUploadAbort) collectionUploadAbort.abort(); collectionUploadAbort = null;
      selectedCollectionProducts.clear(); window.lastCollectionProductResults = [];
      collectionElement('collectionProductSearch').value = ''; collectionElement('collectionImageId').value = '';
      collectionElement('collectionImageFile').value = ''; collectionElement('collectionImagePreview').hidden = true;
      const saveButton = document.querySelector('#newCollectionForm button[type="submit"]'); if (saveButton) saveButton.disabled = false;
      collectionElement('collectionImagePreview').removeAttribute('src'); collectionElement('collectionImagePlaceholder').hidden = false;
      collectionElement('collectionImageRemove').hidden = true; collectionElement('collectionImageStatus').textContent = '';
      collectionElement('collectionProductResults').replaceChildren(); collectionElement('collectionSelectedProducts').replaceChildren();
      collectionElement('collectionProductSearchStatus').textContent = 'Busca por nombre o SKU para añadir productos.';
    };
    window.openCollectionProductPicker = () => searchCollectionProducts('');
    window.setCollectionProducts = async (ids) => {
      selectedCollectionProducts.clear();
      ids.forEach((id) => selectedCollectionProducts.set(id, { id, name:'Producto no disponible', sku:id }));
      renderSelectedCollectionProducts();
      if (ids.length) {
        try { (await fetchCollectionProducts('', ids)).items.forEach((product) => selectedCollectionProducts.set(product.id, product)); renderSelectedCollectionProducts(); }
        catch (error) { collectionElement('collectionProductSearchStatus').textContent = error.message || 'No se pudieron cargar los productos seleccionados.'; }
      }
      await searchCollectionProducts(collectionElement('collectionProductSearch').value);
    };
    window.getCollectionProductIds = () => [...selectedCollectionProducts.keys()];
    window.setCollectionImage = (mediaId) => {
      const imageId = collectionElement('collectionImageId'), preview = collectionElement('collectionImagePreview');
      imageId.value = mediaId || ''; preview.hidden = !mediaId;
      collectionElement('collectionImagePlaceholder').hidden = Boolean(mediaId);
      collectionElement('collectionImageRemove').hidden = !mediaId;
      if (mediaId) preview.src = '/media/' + encodeURIComponent(mediaId); else preview.removeAttribute('src');
    };
    collectionElement('collectionProductSearch').addEventListener('input', (event) => {
      clearTimeout(collectionSearchTimer);
      if (collectionSearchAbort) collectionSearchAbort.abort();
      const query = event.currentTarget.value.trim();
      if (query.length === 1) { if (collectionSearchAbort) collectionSearchAbort.abort(); window.lastCollectionProductResults = []; renderCollectionProductResults([]); collectionElement('collectionProductSearchStatus').textContent = 'Escribe al menos 2 caracteres para buscar.'; return; }
      collectionSearchTimer = setTimeout(() => searchCollectionProducts(query), 250);
    });
    collectionElement('collectionProductPager').querySelector('[data-product-page="previous"]').addEventListener('click', () => searchCollectionProducts(collectionElement('collectionProductSearch').value.trim(), collectionSearchPage - 1));
    collectionElement('collectionProductPager').querySelector('[data-product-page="next"]').addEventListener('click', () => searchCollectionProducts(collectionElement('collectionProductSearch').value.trim(), collectionSearchPage + 1));
    collectionElement('collectionImageFile').addEventListener('change', async (event) => {
      const input = event.currentTarget, file = input.files?.[0]; if (!file) return;
      const status = collectionElement('collectionImageStatus'); status.textContent = 'Subiendo imagen…';
      if (collectionUploadAbort) collectionUploadAbort.abort();
      collectionUploadAbort = new AbortController(); const upload = collectionUploadAbort;
      const saveButton = document.querySelector('#newCollectionForm button[type="submit"]'); if (saveButton) saveButton.disabled = true;
      const form = new FormData(); form.append('file', file);
      form.append('altText', 'Imagen de colección ' + (collectionElement('collectionName').value.trim() || file.name.replace(/\\.[^/.]+$/, '')));
      form.append('isPrivate', 'false');
      try {
        const response = await fetch('/media/upload', { method:'POST', headers:window.adminHeaders(false), body:form, signal:upload.signal });
        const body = await response.json(); if (!response.ok || typeof body.data?.id !== 'string') throw new Error(body.error || 'No se pudo subir la imagen.');
        window.setCollectionImage(body.data.id); status.textContent = 'Imagen lista para la colección.';
      } catch (error) { if (error.name !== 'AbortError') { status.textContent = error.message || 'No se pudo subir la imagen.'; input.value = ''; } }
      finally { if (collectionUploadAbort === upload) { collectionUploadAbort = null; if (saveButton) saveButton.disabled = false; } }
    });
    collectionElement('collectionImageRemove').addEventListener('click', () => {
      window.setCollectionImage(''); collectionElement('collectionImageFile').value = ''; collectionElement('collectionImageStatus').textContent = 'Imagen quitada. Guarda la colección para aplicar el cambio.';
    });
  `;
}
