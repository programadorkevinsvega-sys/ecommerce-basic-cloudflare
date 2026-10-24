export function renderProductListScript(): string {
  return `<script>
    let productModalReturnFocus = null;
    function openProductModal() {
      const modal = document.getElementById('product-modal');
      if (!modal) return;
      productModalReturnFocus = document.activeElement;
      modal.hidden = false;
      document.body.style.overflow = 'hidden';
      modal.querySelector('.product-modal-dialog')?.focus();
    }
    function closeProductModal() {
      const modal = document.getElementById('product-modal');
      if (!modal) return;
      modal.hidden = true;
      document.body.style.overflow = '';
      productModalReturnFocus?.focus?.();
    }
    function startCreateProduct() {
      resetProductForm();
      openProductModal();
      document.getElementById('pName')?.focus();
    }
    window.openProductModal = openProductModal;
    window.closeProductModal = closeProductModal;
    window.startCreateProduct = startCreateProduct;
    document.addEventListener('keydown', (event) => {
      const modal = document.getElementById('product-modal');
      if (modal?.hidden) return;
      if (event.key === 'Escape') closeProductModal();
      if (event.key === 'Tab' && modal) {
        const focusable = Array.from(modal.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]'));
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    });
    let activeProductFilter = 'all';
    const productSearch = document.getElementById('products-search');
    let productPage = 1, productRequest = 0;
    async function filterProductList(page = 1) {
      productPage = page;
      const requestId = ++productRequest, body = document.getElementById('products-table-body');
      body.innerHTML = '<tr><td colspan="7" class="products-empty">Cargando productos…</td></tr>';
      const params = new URLSearchParams({ page: String(page), pageSize: '25' });
      const query = (productSearch?.value || '').trim();
      if (query) params.set('q', query);
      if (activeProductFilter !== 'all') params.set('status', activeProductFilter);
      try {
        const response = await fetch('/api/v1/admin/products?' + params, { headers: adminHeaders(), cache: 'no-store' });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'No fue posible cargar los productos.');
        if (requestId !== productRequest) return;
        body.innerHTML = result.rowsHtml || '<tr><td colspan="7" class="products-empty">No hay productos que coincidan con la búsqueda.</td></tr>';
        result.items.forEach((item) => { window.__catalogProducts[item.id] = item; });
        document.getElementById('products-visible-count').textContent = result.total + ' productos · Página ' + result.page + (result.hasMore ? ' · hay más resultados' : ' · última página');
        document.getElementById('products-results-count').textContent = result.total + ' resultados · ' + result.items.length + ' en esta página';
        const nav = document.getElementById('products-pagination');
        nav.innerHTML = '<button type="button" data-product-page="previous">Anterior</button><span>Página ' + result.page + '</span><button type="button" data-product-page="next">Siguiente</button>';
        nav.querySelector('[data-product-page="previous"]').disabled = result.page <= 1;
        nav.querySelector('[data-product-page="next"]').disabled = !result.hasMore;
        nav.querySelector('[data-product-page="previous"]').onclick = () => filterProductList(result.page - 1);
        nav.querySelector('[data-product-page="next"]').onclick = () => filterProductList(result.page + 1);
      } catch (error) {
        if (requestId === productRequest) body.innerHTML = '<tr><td colspan="7" class="products-empty">' + escapeHtml(error.message || 'Error al cargar productos.') + '</td></tr>';
      }
    }
    let productSearchTimer;
    productSearch?.addEventListener('input', () => { clearTimeout(productSearchTimer); productSearchTimer = setTimeout(() => filterProductList(1), 250); });
    document.querySelectorAll('[data-product-filter]').forEach((button) => button.addEventListener('click', () => {
      activeProductFilter = button.dataset.productFilter || 'all';
      document.querySelectorAll('[data-product-filter]').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      filterProductList(1);
    }));
    filterProductList(1);
  </script>`;
}
