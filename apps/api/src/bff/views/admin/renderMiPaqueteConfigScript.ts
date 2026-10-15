export function renderMiPaqueteConfigScript(): string {
  return `
    async function loadMiPaqueteConfigStatus() {
      const status = document.getElementById('mipaquete-connection-state');
      if (!status) return;
      try {
        const response = await fetch('/api/v1/admin/shipping/mipaquete/config');
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error('No se pudo verificar la configuración.');
        status.textContent = result.credentialsReady && result.endpointReady
          ? 'Secreto y host HTTPS aceptados. Valida credenciales con una cotización antes de activar el despacho.'
          : 'Falta el secreto MI_PAQUETE_TRANSPORTADORA o MI_PAQUETE_API_URL HTTPS válido en Cloudflare.';
        status.classList.toggle('is-ready', result.credentialsReady && result.endpointReady);
      } catch {
        status.textContent = 'No se pudo consultar el estado de la integración.';
      }
    }

    const mpConfigForm = document.getElementById('mipaquete-config-form');
    mpConfigForm?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = document.getElementById('mipaquete-config-message');
      const getNumber = (id) => Number(document.getElementById(id).value);
      const payload = {
        enabled: document.getElementById('mp-enabled').value === 'true',
        originDaneCode: document.getElementById('mp-origin').value.trim(),
        packageWidthCm: getNumber('mp-width'), packageLengthCm: getNumber('mp-length'),
        packageHeightCm: getNumber('mp-height'), packageWeightKg: getNumber('mp-weight'),
        declaredValueMode: document.getElementById('mp-declared').value,
        cashOnDeliveryPaymentType: getNumber('mp-cod-payment'),
        requestPickup: document.getElementById('mp-pickup').value === 'true',
        selectionCriterion: document.getElementById('mp-criterion').value,
      };
      try {
        const response = await fetch('/api/v1/admin/shipping/mipaquete/config', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok || !result.success) throw new Error(result.error || 'No fue posible guardar.');
        message.textContent = 'Configuración guardada.';
        await loadMiPaqueteConfigStatus();
      } catch (error) {
        message.textContent = error.message || 'Error de conexión.';
      }
    });
    loadMiPaqueteConfigStatus();
  `;
}
