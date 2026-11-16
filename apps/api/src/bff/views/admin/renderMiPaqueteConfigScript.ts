export function renderMiPaqueteConfigScript(): string {
  return `
    const packagePath = '/api/v1/admin/shipping/mipaquete/packages';
    const packageDialog = document.getElementById('mp-package-dialog');
    const packageForm = document.getElementById('mp-package-form');
    const packageFieldNames = ['name','innerWidthCm','innerLengthCm','innerHeightCm','outerWidthCm','outerLengthCm','outerHeightCm','tareWeightGrams','maxWeightGrams'];
    const packageEscape = value => String(value).replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
    const selectedPackageProducts = new Map();
    let packageProductSearchVersion = 0;
    let packageProductSearchTimer;
    async function packageRequest(path, options = {}) {
      const response = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...options });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.error || 'No se pudo completar la operación.');
      return result;
    }
    async function loadCarrierPackages() {
      const { data } = await packageRequest(packagePath);
      document.getElementById('mp-package-rows').innerHTML = data.length ? data.map(packageRow).join('') : '<tr><td colspan="7" class="shipping-empty">No hay empaques registrados.</td></tr>';
    }
    function packageRow(item) {
      const dimensions = (a,b,c) => [a,b,c].join(' × ') + ' cm';
      const usage = item.singleUnitProductIds?.length ? item.singleUnitProductIds.length + ' producto(s)' : 'Pedidos múltiples';
      return '<tr data-package-row="' + packageEscape(item.id) + '"><td><strong>' + packageEscape(item.name) + '</strong></td><td>' + dimensions(item.innerWidthCm,item.innerLengthCm,item.innerHeightCm) + '</td><td>' + dimensions(item.outerWidthCm,item.outerLengthCm,item.outerHeightCm) + '</td><td>' + item.tareWeightGrams + ' g / ' + item.maxWeightGrams + ' g</td><td>' + usage + '</td><td><span class="shipping-badge ' + (item.isActive ? 'active' : 'inactive') + '">' + (item.isActive ? 'Activo' : 'Inactivo') + '</span></td><td><div class="shipping-row-actions"><button class="shipping-action" data-package-action="view">Ver</button><button class="shipping-action" data-package-action="edit">Editar</button><button class="shipping-action" data-package-action="toggle">' + (item.isActive ? 'Desactivar' : 'Activar') + '</button><button class="shipping-action danger" data-package-action="delete">Eliminar</button></div></td></tr>';
    }
    function renderSelectedPackageProducts() {
      const selected = document.getElementById('mp-package-selected-products');
      selected.replaceChildren();
      for (const [id, name] of selectedPackageProducts) {
        const row = document.createElement('span');
        row.className = 'mp-package-product-chip';
        const label = document.createElement('span');
        label.textContent = name + ' · ' + id;
        const remove = document.createElement('button');
        remove.type = 'button'; remove.dataset.removePackageProduct = id;
        remove.textContent = 'Quitar'; remove.disabled = packageForm.dataset.readOnly === 'true';
        row.append(label, remove); selected.append(row);
      }
    }
    async function openPackage(item = null, readOnly = false) {
      packageForm.reset(); document.getElementById('mp-package-id').value = item?.id || '';
      document.getElementById('mp-package-title').textContent = readOnly ? 'Detalle del empaque' : item ? 'Editar empaque' : 'Crear empaque';
      packageFieldNames.forEach(key => { const field = packageForm.querySelector('[data-mp-package="' + key + '"]'); field.value = item?.[key] ?? ''; field.disabled = readOnly; });
      const active = document.getElementById('mp-package-active'); active.value = String(item?.isActive ?? true); active.disabled = readOnly;
      const search = document.getElementById('mp-package-product-search');
      const status = document.getElementById('mp-package-product-status');
      const results = document.getElementById('mp-package-product-results');
      selectedPackageProducts.clear(); packageForm.dataset.readOnly = String(readOnly);
      search.disabled = readOnly; status.textContent = ''; results.replaceChildren(); results.hidden = true;
      const associatedIds = item?.singleUnitProductIds || [];
      for (let index = 0; index < associatedIds.length; index += 5) {
        await Promise.all(associatedIds.slice(index, index + 5).map(async id => {
          try {
            const { product } = await packageRequest('/api/v1/admin/products/' + encodeURIComponent(id));
            selectedPackageProducts.set(id, product.name);
          } catch (error) {
            selectedPackageProducts.set(id, id);
            status.textContent = 'No se pudo cargar el nombre de un producto asociado: ' + (error.message || id);
          }
        }));
      }
      renderSelectedPackageProducts();
      packageForm.querySelector('[type="submit"]').hidden = readOnly; packageDialog.showModal();
    }
    async function searchPackageProducts() {
      const query = document.getElementById('mp-package-product-search').value.trim();
      const results = document.getElementById('mp-package-product-results');
      const status = document.getElementById('mp-package-product-status');
      const version = ++packageProductSearchVersion;
      results.replaceChildren(); results.hidden = true; status.textContent = '';
      if (query.length < 2) return;
      try {
        const { items } = await packageRequest('/api/v1/admin/products?page=1&pageSize=8&q=' + encodeURIComponent(query));
        if (version !== packageProductSearchVersion) return;
        const matches = items.filter(product => !selectedPackageProducts.has(product.id));
        if (!matches.length) { status.textContent = 'No se encontraron productos nuevos para asociar.'; return; }
        for (const product of matches) {
          const option = document.createElement('button');
          option.type = 'button'; option.role = 'option';
          option.textContent = product.name + ' · ' + (product.sku || product.id);
          option.addEventListener('click', () => {
            selectedPackageProducts.set(product.id, product.name);
            document.getElementById('mp-package-product-search').value = '';
            results.replaceChildren(); results.hidden = true; renderSelectedPackageProducts();
          });
          results.append(option);
        }
        results.hidden = false;
      } catch (error) {
        if (version === packageProductSearchVersion) status.textContent = 'No se pudieron buscar productos: ' + (error.message || 'error de conexión');
      }
    }
    document.getElementById('mp-package-product-search')?.addEventListener('input', () => {
      clearTimeout(packageProductSearchTimer);
      packageProductSearchTimer = setTimeout(searchPackageProducts, 250);
    });
    document.getElementById('mp-package-selected-products')?.addEventListener('click', event => {
      const button = event.target.closest('[data-remove-package-product]');
      if (!button || packageForm.dataset.readOnly === 'true') return;
      selectedPackageProducts.delete(button.dataset.removePackageProduct); renderSelectedPackageProducts();
    });
    document.getElementById('mp-package-create')?.addEventListener('click', () => openPackage());
    document.getElementById('mp-package-close')?.addEventListener('click', () => packageDialog.close());
    document.getElementById('mp-package-cancel')?.addEventListener('click', () => packageDialog.close());
    document.getElementById('mp-package-rows')?.addEventListener('click', async event => {
      const button = event.target.closest('[data-package-action]'); if (!button) return;
      const row = button.closest('[data-package-row]'); const id = row.dataset.packageRow; const action = button.dataset.packageAction;
      try {
        if (action === 'delete') { if (!confirm('¿Eliminar este tipo de empaque?')) return; await packageRequest(packagePath + '/' + encodeURIComponent(id), { method: 'DELETE' }); }
        else if (action === 'toggle') { const { data } = await packageRequest(packagePath + '/' + encodeURIComponent(id)); await packageRequest(packagePath + '/' + encodeURIComponent(id) + '/status', { method: 'PATCH', body: JSON.stringify({ active: !data.isActive }) }); }
        else { const { data } = await packageRequest(packagePath + '/' + encodeURIComponent(id)); await openPackage(data, action === 'view'); }
        await loadCarrierPackages();
      } catch (error) { alert(error.message || 'No fue posible completar la acción.'); }
    });
    packageForm?.addEventListener('submit', async event => {
      event.preventDefault(); const id = document.getElementById('mp-package-id').value;
      const payload = Object.fromEntries(packageFieldNames.map(key => { const field = packageForm.querySelector('[data-mp-package="' + key + '"]'); return [key, key === 'name' ? field.value.trim() : Number(field.value)]; }));
      payload.singleUnitProductIds = Array.from(selectedPackageProducts.keys());
      if (!id) payload.isActive = document.getElementById('mp-package-active').value === 'true';
      try { await packageRequest(packagePath + (id ? '/' + encodeURIComponent(id) : ''), { method: id ? 'PUT' : 'POST', body: JSON.stringify(payload) }); packageDialog.close(); await loadCarrierPackages(); }
      catch (error) { alert(error.message || 'No fue posible guardar el empaque.'); }
    });
    document.getElementById('mipaquete-config-form')?.addEventListener('submit', async event => {
      event.preventDefault(); const message = document.getElementById('mipaquete-config-message');
      const payload = { enabled: document.getElementById('mp-enabled').value === 'true', originDaneCode: document.getElementById('mp-origin').value.trim(),
        packageWidthCm: null, packageLengthCm: null, packageHeightCm: null, packageWeightKg: null,
        declaredValueMode: document.getElementById('mp-declared').value, cashOnDeliveryPaymentType: Number(document.getElementById('mp-cod-payment').value),
        requestPickup: document.getElementById('mp-pickup').value === 'true', selectionCriterion: document.getElementById('mp-criterion').value };
      try {
        const headers = await window.adminCriticalHeaders(true);
        if (!headers) return;
        await packageRequest('/api/v1/admin/shipping/mipaquete/config', { method: 'PUT', headers, body: JSON.stringify(payload) });
        message.textContent = 'Configuración guardada.'; await loadMiPaqueteConfigStatus();
      }
      catch (error) { message.textContent = error.message || 'Error de conexión.'; }
    });
    async function loadMiPaqueteConfigStatus() {
      const status = document.getElementById('mipaquete-connection-state'); if (!status) return;
      try { const { credentialsReady, endpointReady } = await packageRequest('/api/v1/admin/shipping/mipaquete/config');
        status.textContent = credentialsReady && endpointReady ? 'La disponibilidad de tarifas depende de la cobertura activa de MiPaquete.' : 'Falta el secreto MI_PAQUETE_TRANSPORTADORA o MI_PAQUETE_API_URL HTTPS válido en Cloudflare.';
        status.classList.toggle('is-ready', credentialsReady && endpointReady);
      } catch { status.textContent = 'No se pudo consultar el estado de la integración.'; }
    }
    loadMiPaqueteConfigStatus(); loadCarrierPackages().catch(error => { document.getElementById('mp-package-rows').innerHTML = '<tr><td colspan="7" class="shipping-empty">' + packageEscape(error.message) + '</td></tr>'; });
  `;
}
