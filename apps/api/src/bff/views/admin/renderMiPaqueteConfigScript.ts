export function renderMiPaqueteConfigScript(): string {
  return `
    function addMiPaqueteProfile() {
      const profile = document.createElement('fieldset');
      profile.className = 'shipping-package-profile'; profile.dataset.packageProfile = ''; profile.dataset.id = crypto.randomUUID();
      profile.innerHTML = '<legend>Nuevo empaque</legend><div class="shipping-package-grid">' +
        packageField('name', 'Nombre', 'text') + packageField('innerWidthCm', 'Ancho interno (cm)') +
        packageField('innerLengthCm', 'Largo interno (cm)') + packageField('innerHeightCm', 'Alto interno (cm)') +
        packageField('outerWidthCm', 'Ancho externo (cm)') + packageField('outerLengthCm', 'Largo externo (cm)') +
        packageField('outerHeightCm', 'Alto externo (cm)') + packageField('tareWeightGrams', 'Peso de caja (g)') +
        packageField('maxWeightGrams', 'Peso máximo total (g)') + '<label>Estado<select data-profile-field="isActive"><option value="true">Activo</option><option value="false">Inactivo</option></select></label></div>' +
        '<button type="button" class="shipping-action danger" onclick="this.closest(\'[data-package-profile]\').remove()">Quitar</button>';
      document.getElementById('mp-package-profiles').append(profile);
    }
    function packageField(key, label, type = 'number') { return '<label>' + label + '<input data-profile-field="' + key + '" type="' + type + '" min="1" step="1" required></label>'; }
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
        packageWidthCm: null, packageLengthCm: null, packageHeightCm: null, packageWeightKg: null,
        packageProfiles: Array.from(document.querySelectorAll('[data-package-profile]')).map((card) => {
          const profile = { id: card.dataset.id, isActive: card.querySelector('[data-profile-field="isActive"]').value === 'true',
            createdAt: card.dataset.createdAt || new Date().toISOString() };
          card.querySelectorAll('[data-profile-field]').forEach((field) => {
            const key = field.dataset.profileField;
            if (key !== 'isActive') profile[key] = key === 'name' ? field.value.trim() : Number(field.value);
          });
          return profile;
        }),
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
    window.addMiPaqueteProfile = addMiPaqueteProfile;
  `;
}
