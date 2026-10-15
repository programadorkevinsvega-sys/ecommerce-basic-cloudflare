export function getCheckoutLocationScript(): string {
  return `<script>(() => {
    const zoneSelect = document.getElementById('dest-zone');
    const cityInput = document.getElementById('addr-city');
    const departmentInput = document.getElementById('addr-dept');
    const daneInput = document.getElementById('addr-dane-code');
    const municipalityInput = document.getElementById('addr-municipality');
    const suggestions = document.getElementById('addr-city-suggestions');
    const help = document.getElementById('addr-city-help');
    let requestNumber = 0;
    let selectionNumber = 0;
    let searchTimer;

    const clearSelection = () => {
      selectionNumber++;
      daneInput.value = '';
      municipalityInput.value = '';
      departmentInput.value = '';
      document.dispatchEvent(new Event('checkout-location-change'));
    };
    const searchLocations = async () => {
      const query = (cityInput.dataset.restoreLocation === 'true' ? cityInput.value.split(',')[0] : cityInput.value).trim();
      const requestId = ++requestNumber;
      suggestions.replaceChildren();
      suggestions.hidden = true;
      if (!zoneSelect.value || query.length < 2) return;
      try {
        const response = await fetch('/api/v1/shipping/locations?q=' + encodeURIComponent(query) + '&limit=50');
        if (!response.ok) throw new Error('No fue posible buscar municipios.');
        const result = await response.json();
        if (requestId !== requestNumber) return;
        const locations = result.data || [];
        if (cityInput.dataset.restoreLocation === 'true') {
          delete cityInput.dataset.restoreLocation;
          const normalize = (value) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
          const restoredName = cityInput.value;
          const restored = locations.find((location) => normalize(location.fullName) === normalize(restoredName) || normalize(location.municipality) === normalize(restoredName));
          if (restored) { await selectLocation(restored); return; }
        }
        for (const location of locations) {
          const option = document.createElement('button');
          option.type = 'button';
          option.className = 'checkout-location-option';
          option.setAttribute('role', 'option');
          option.textContent = location.fullName;
          option.addEventListener('click', () => selectLocation(location));
          suggestions.append(option);
        }
        suggestions.hidden = locations.length === 0;
        help.textContent = locations.length
          ? 'Selecciona una sugerencia para validar la cobertura de este municipio.'
          : 'No encontramos ese municipio. Prueba con otro nombre o verifica la zona de envío.';
      } catch {
        if (requestId === requestNumber) help.textContent = 'No fue posible buscar municipios. Intenta de nuevo.';
      }
    };
    const selectLocation = async (location) => {
      cityInput.value = location.fullName;
      suggestions.hidden = true;
      clearSelection();
      const currentSelection = selectionNumber;
      help.textContent = 'Verificando cobertura para ' + location.fullName + '…';
      try {
        const response = await fetch('/api/v1/shipping/coverage?daneCode=' + encodeURIComponent(location.daneCode) + '&zoneId=' + encodeURIComponent(zoneSelect.value));
        const result = await response.json();
        if (currentSelection !== selectionNumber) return;
        const coverage = result.data;
        if (!response.ok || !coverage?.isCovered || coverage.zoneId !== zoneSelect.value) {
          const correctZone = coverage?.zoneName ? ' La zona disponible es ' + coverage.zoneName + '.' : '';
          help.textContent = 'No hay cobertura para esta combinación de municipio y zona.' + correctZone;
          return;
        }
      } catch {
        help.textContent = 'No fue posible verificar la cobertura. Intenta de nuevo.';
        return;
      }
      daneInput.value = location.daneCode;
      municipalityInput.value = location.municipality;
      departmentInput.value = location.department;
      help.textContent = 'Destino verificado: ' + location.fullName + '.';
      document.dispatchEvent(new Event('checkout-location-change'));
    };

    cityInput.addEventListener('input', () => {
      clearSelection();
      help.textContent = 'Buscando municipios de la zona seleccionada…';
      window.clearTimeout(searchTimer);
      searchTimer = window.setTimeout(searchLocations, 250);
    });
    zoneSelect.addEventListener('change', () => {
      requestNumber++;
      cityInput.value = '';
      suggestions.replaceChildren();
      suggestions.hidden = true;
      clearSelection();
      help.textContent = zoneSelect.value
        ? 'Escribe el municipio cubierto por esta zona y selecciónalo de las sugerencias.'
        : 'Selecciona primero tu zona y luego el municipio sugerido para verificar la cobertura.';
    });
  })();</script>`;
}
