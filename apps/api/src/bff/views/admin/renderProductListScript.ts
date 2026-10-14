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
    function filterProductList() {
      const query = (productSearch?.value || '').trim().toLocaleLowerCase();
      const rows = Array.from(document.querySelectorAll('#products-table-body .products-row'));
      let visible = 0;
      rows.forEach((row) => {
        const matches = (!query || row.dataset.search.includes(query)) && (activeProductFilter === 'all' || row.dataset.status === activeProductFilter);
        row.hidden = !matches;
        if (matches) visible++;
      });
      const empty = document.getElementById('products-no-results');
      if (empty) empty.hidden = visible > 0 || rows.length === 0;
      const count = document.getElementById('products-visible-count');
      if (count) count.textContent = 'Mostrando ' + visible + ' de ' + rows.length + ' productos';
      const result = document.getElementById('products-results-count');
      if (result) result.textContent = visible + (visible === 1 ? ' producto' : ' productos');
    }
    productSearch?.addEventListener('input', filterProductList);
    document.querySelectorAll('[data-product-filter]').forEach((button) => button.addEventListener('click', () => {
      activeProductFilter = button.dataset.productFilter || 'all';
      document.querySelectorAll('[data-product-filter]').forEach((item) => {
        const selected = item === button;
        item.classList.toggle('selected', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      filterProductList();
    }));
  </script>`;
}
