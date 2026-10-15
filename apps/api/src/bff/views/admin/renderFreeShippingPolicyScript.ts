export function renderFreeShippingPolicyScript(): string {
  return `<script>
    document.getElementById('free-shipping-policy-form')?.addEventListener('submit', async event => {
      event.preventDefault();
      const message = document.getElementById('free-shipping-policy-message');
      const threshold = Number(document.getElementById('free-shipping-threshold').value);
      if (!Number.isSafeInteger(threshold) || threshold < 0) { message.textContent = 'Indica un monto válido.'; return; }
      message.textContent = 'Guardando…';
      try {
        const response = await fetch('/api/v1/admin/shipping/free-shipping-policy', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: document.getElementById('free-shipping-enabled').checked, thresholdCents: threshold * 100 }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'No fue posible guardar la regla.');
        message.textContent = 'Regla actualizada.';
      } catch (error) { message.textContent = error.message || 'No fue posible guardar la regla.'; }
    });
  </script>`;
}
