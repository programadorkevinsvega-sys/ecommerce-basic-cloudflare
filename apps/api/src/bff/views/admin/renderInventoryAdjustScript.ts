export function renderInventoryAdjustScript(): string {
  return `
    let inventoryAdjustmentStock = null;
    let inventoryAdjustReturnFocus = null;
    let inventoryPreviousOverflow = '';
    const movementReasons = {
      entry: [['restock', 'Compra a proveedor'], ['return', 'Devolución de cliente'], ['manual_adjustment', 'Otra entrada']],
      exit: [['damage', 'Merma o daño'], ['manual_adjustment', 'Salida manual']],
      correction: [['correction', 'Conteo físico'], ['manual_adjustment', 'Corrección manual']],
    };

    function openInventoryAdjust(productId, trigger) {
      inventoryAdjustmentStock = (window._adminInventoryItems || []).find(item => item.productId === productId);
      if (!inventoryAdjustmentStock) return;
      inventoryAdjustReturnFocus = trigger || document.activeElement;
      const product = window._adminInventoryProducts[productId] || {};
      document.getElementById('inv-modal-product-name').textContent = product.name || 'Producto';
      document.getElementById('inv-modal-product-meta').textContent = (product.sku || productId) + ' · Stock total ' + inventoryAdjustmentStock.quantity + ' · Reservado ' + inventoryAdjustmentStock.reservedQuantity + ' · Disponible ' + availableStock(inventoryAdjustmentStock);
      document.getElementById('inv-adjust-note').value = '';
      document.getElementById('inv-adjust-quantity').value = '';
      document.querySelector('#inventory-adjust-form input[value="entry"]').checked = true;
      updateInventoryMovementType();
      updateInventoryAdjustmentPreview();
      const modal = document.getElementById('inv-adjust-modal');
      inventoryPreviousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      modal.hidden = false;
      document.getElementById('inv-adjust-quantity').focus();
    }

    function closeInventoryAdjust() {
      const modal = document.getElementById('inv-adjust-modal');
      if (!modal || modal.hidden) return;
      modal.hidden = true;
      document.body.style.overflow = inventoryPreviousOverflow;
      inventoryAdjustmentStock = null;
      inventoryAdjustReturnFocus?.focus();
      inventoryAdjustReturnFocus = null;
    }

    function selectedInventoryMovementType() {
      return document.querySelector('input[name="inventory-movement-type"]:checked')?.value || 'entry';
    }

    function updateInventoryMovementType() {
      const type = selectedInventoryMovementType();
      document.querySelectorAll('.inventory-type-option').forEach(label => label.classList.toggle('selected', label.querySelector('input').value === type));
      const label = document.getElementById('inv-qty-label');
      const input = document.getElementById('inv-adjust-quantity');
      label.textContent = type === 'correction' ? 'Stock contado' : 'Cantidad de unidades';
      input.min = type === 'correction' ? '0' : '1';
      input.placeholder = type === 'correction' ? 'Unidades contadas' : 'Cantidad';
      const reasons = movementReasons[type];
      const reasonSelect = document.getElementById('inv-adjust-reason');
      reasonSelect.innerHTML = reasons.map(reason => '<option value="' + reason[0] + '">' + reason[1] + '</option>').join('');
      document.getElementById('inv-qty-help').textContent = type === 'correction' ? 'Ingresa el total contado, incluso 0 si no hay existencias.' : 'Ingresa un número entero mayor a cero.';
      updateInventoryAdjustmentPreview();
    }

    function updateInventoryAdjustmentPreview() {
      const stock = inventoryAdjustmentStock;
      const quantity = document.getElementById('inv-adjust-quantity');
      const type = selectedInventoryMovementType();
      const raw = quantity.value;
      const value = Number(raw);
      const isInteger = raw !== '' && Number.isSafeInteger(value);
      let target = null;
      if (stock && isInteger) target = type === 'entry' ? stock.quantity + value : type === 'exit' ? stock.quantity - value : value;
      let error = '';
      if (raw !== '' && !isInteger) error = 'Ingresa una cantidad entera válida.';
      else if (isInteger && type !== 'correction' && value < 1) error = 'La cantidad debe ser 1 o más.';
      else if (target !== null && target < 0) error = 'La salida no puede dejar el stock en negativo.';
      else if (target !== null && target < Number(stock?.reservedQuantity || 0)) error = 'El stock nuevo no puede ser menor que las unidades reservadas.';
      else if (target !== null && target > 100000) error = 'El stock nuevo supera el límite permitido de 100.000 unidades.';
      else if (target !== null && !Number.isSafeInteger(target)) error = 'El resultado excede el rango permitido.';
      document.getElementById('inv-preview-current').textContent = stock ? stock.quantity + ' uds' : '—';
      document.getElementById('inv-preview-delta').textContent = target === null ? '—' : type === 'correction' ? 'Fijar en ' + value + ' uds' : (type === 'entry' ? '+' + value : '−' + value) + ' uds';
      document.getElementById('inv-preview-new').textContent = target === null ? '—' : target + ' uds';
      document.getElementById('inv-adjust-error').textContent = error;
      document.getElementById('inv-adjust-error').hidden = !error;
      quantity.setAttribute('aria-invalid', String(Boolean(error)));
      document.getElementById('inv-adjust-submit').disabled = !stock || !isInteger || Boolean(error);
      document.getElementById('inv-qty-help').style.color = error ? '#a8231b' : '#636b7b';
    }

    async function submitInventoryAdjustment(event) {
      event.preventDefault();
      if (!inventoryAdjustmentStock) return;
      updateInventoryAdjustmentPreview();
      const submit = document.getElementById('inv-adjust-submit');
      if (submit.disabled) return;
      const type = selectedInventoryMovementType();
      const quantity = Number(document.getElementById('inv-adjust-quantity').value);
      const targetQuantity = type === 'entry' ? inventoryAdjustmentStock.quantity + quantity : type === 'exit' ? inventoryAdjustmentStock.quantity - quantity : quantity;
      const baseReason = document.getElementById('inv-adjust-reason').value;
      const note = document.getElementById('inv-adjust-note').value.trim();
      const reason = (baseReason + (note ? ': ' + note : '')).slice(0, 200);
      submit.disabled = true;
      submit.textContent = 'Guardando…';
      try {
        // El endpoint recibe el stock total objetivo; no un delta.
        const response = await fetch('/api/v1/admin/inventory/adjust', {
          method: 'POST', headers: adminHeaders(true),
          body: JSON.stringify({ productId: inventoryAdjustmentStock.productId, targetQuantity, reason }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'No se pudo ajustar el stock.');
        const productName = document.getElementById('inv-modal-product-name').textContent;
        closeInventoryAdjust();
        const refreshed = await loadAdminInventory();
        if (refreshed) showInventoryMessage('Movimiento registrado. ' + productName + ' ahora tiene ' + targetQuantity + ' unidades.', false);
      } catch (error) {
        document.getElementById('inv-adjust-error').textContent = error.message || 'No se pudo ajustar el stock.';
        document.getElementById('inv-adjust-error').hidden = false;
        submit.disabled = false;
      } finally {
        submit.textContent = 'Registrar movimiento';
      }
    }

    function handleInventoryModalKeydown(event) {
      if (event.key === 'Escape') { event.preventDefault(); closeInventoryAdjust(); return; }
      if (event.key !== 'Tab') return;
      const dialog = document.querySelector('.inventory-modal-dialog');
      const focusable = [...dialog.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled)')];
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }

    document.getElementById('inventory-table-body')?.addEventListener('click', event => {
      const button = event.target.closest('[data-inventory-adjust]');
      if (button) openInventoryAdjust(button.dataset.inventoryAdjust, button);
    });
    document.querySelectorAll('[data-inventory-modal-close]').forEach(button => button.addEventListener('click', closeInventoryAdjust));
    document.querySelectorAll('input[name="inventory-movement-type"]').forEach(input => input.addEventListener('change', updateInventoryMovementType));
    document.getElementById('inv-adjust-quantity')?.addEventListener('input', updateInventoryAdjustmentPreview);
    document.getElementById('inventory-adjust-form')?.addEventListener('submit', submitInventoryAdjustment);
    document.querySelector('.inventory-modal-dialog')?.addEventListener('keydown', handleInventoryModalKeydown);
    window.openInventoryAdjust = openInventoryAdjust;
    window.closeInventoryAdjust = closeInventoryAdjust;
  `;
}
