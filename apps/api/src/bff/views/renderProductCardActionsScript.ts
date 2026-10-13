export const renderProductCardActionsScript = String.raw`<script>
  document.querySelectorAll('[data-add-to-cart]').forEach(button => button.addEventListener('click', async () => {
    const original = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch('/api/v1/cart/items', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: button.dataset.productId, quantity: 1, unitPriceCents: Number(button.dataset.priceCents) })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'No se pudo agregar al carrito.');
      button.textContent = '¡Añadido!';
      const feedback = document.getElementById('catalog-cart-feedback');
      if (feedback) { feedback.hidden = false; feedback.textContent = 'Producto agregado al carrito.'; }
      window.setTimeout(() => { button.innerHTML = original; button.disabled = false; button.removeAttribute('aria-busy'); }, 1600);
    } catch (error) {
      const feedback = document.getElementById('catalog-cart-feedback');
      if (feedback) { feedback.hidden = false; feedback.textContent = error.message || 'No se pudo agregar al carrito.'; }
      else window.alert(error.message || 'No se pudo agregar al carrito.');
      button.disabled = false;
      button.removeAttribute('aria-busy');
    }
  }));
</script>`;
