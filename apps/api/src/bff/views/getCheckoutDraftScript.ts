export function getCheckoutDraftScript(): string {
  return `<script>(() => {
    const storageKey = 'vega.checkout.draft.v1';
    const lifetimeMs = 2 * 60 * 60 * 1000;
    const fields = ['cust-name', 'cust-phone', 'cust-email', 'cust-tax-id', 'addr-line'];
    const zone = document.getElementById('dest-zone');
    const city = document.getElementById('addr-city');
    const payment = () => document.querySelector('input[name="payment-method"]:checked')?.value || 'wompi';
    let restoring = true;
    let saveTimer;

    const save = () => {
      if (restoring) return;
      const draft = Object.fromEntries(fields.map((id) => [id, document.getElementById(id).value]));
      draft.zone = zone.value;
      draft.city = city.value;
      draft.payment = payment();
      try { sessionStorage.setItem(storageKey, JSON.stringify({ savedAt: Date.now(), draft })); }
      catch { /* El checkout sigue funcionando si el navegador bloquea el almacenamiento de sesión. */ }
    };
    try {
      const saved = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
      if (saved?.draft && Date.now() - saved.savedAt < lifetimeMs) {
        for (const id of fields) {
          if (typeof saved.draft[id] === 'string') document.getElementById(id).value = saved.draft[id];
        }
        if ([...zone.options].some((option) => option.value === saved.draft.zone)) {
          zone.value = saved.draft.zone;
          zone.dispatchEvent(new Event('change'));
          if (typeof saved.draft.city === 'string' && saved.draft.city) {
            city.value = saved.draft.city;
            city.dataset.restoreLocation = 'true';
            city.dispatchEvent(new Event('input'));
          }
        }
        if (saved.draft.payment === 'cash_on_delivery') document.getElementById('radio-cod').checked = true;
      } else {
        sessionStorage.removeItem(storageKey);
      }
    } catch {
      try { sessionStorage.removeItem(storageKey); } catch { /* Almacenamiento no disponible. */ }
    }
    restoring = false;
    for (const id of fields) {
      document.getElementById(id).addEventListener('input', () => {
        window.clearTimeout(saveTimer);
        saveTimer = window.setTimeout(save, 300);
      });
    }
    zone.addEventListener('change', save);
    city.addEventListener('input', save);
    document.addEventListener('checkout-location-change', save);
    document.querySelectorAll('input[name="payment-method"]').forEach((input) => input.addEventListener('change', save));
    window.addEventListener('pagehide', save);
    window.clearCheckoutDraft = () => { try { sessionStorage.removeItem(storageKey); } catch { /* No bloquear la compra. */ } };
    save();
  })();</script>`;
}
