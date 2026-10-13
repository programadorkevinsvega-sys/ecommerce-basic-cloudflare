export function getCheckoutLocationScript(): string {
  return `<script>(() => {
    const zoneSelect = document.getElementById('dest-zone');
    const cityInput = document.getElementById('addr-city');
    const departmentInput = document.getElementById('addr-dept');
    const daneInput = document.getElementById('addr-dane-code');
    const municipalityInput = document.getElementById('addr-municipality');
    const suggestions = document.getElementById('addr-city-suggestions');
    const help = document.getElementById('addr-city-help');
    let matches = [];
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
    const selectedZoneCodes = () => {
      try { return JSON.parse(zoneSelect.selectedOptions[0]?.dataset.locations || '[]'); }
      catch { return []; }
    };
    const searchLocations = async () => {
      const query = cityInput.value.trim();
      const requestId = ++requestNumber;
      suggestions.replaceChildren();
      matches = [];
      if (!zoneSelect.value || query.length < 2) return;
      try {
        const response = await fetch('/api/v1/shipping/locations?q=' + encodeURIComponent(query) + '&limit=50');
        if (!response.ok) throw new Error('No fue posible buscar municipios.');
        const result = await response.json();
        if (requestId !== requestNumber) return;
        const allowedCodes = selectedZoneCodes();
        matches = (result.data || []).filter((location) => !allowedCodes.length || allowedCodes.includes(location.daneCode));
        for (const location of matches) {
          const option = document.createElement('option');
          option.value = location.fullName;
          suggestions.append(option);
        }
        help.textContent = matches.length
          ? 'Selecciona una sugerencia para validar la cobertura de este municipio.'
          : 'No encontramos municipios cubiertos por esta zona. Revisa la zona de envío o consulta con la tienda.';
      } catch {
        if (requestId === requestNumber) help.textContent = 'No fue posible buscar municipios. Intenta de nuevo.';
      }
    };
    const selectLocation = async () => {
      clearSelection();
      const location = matches.find((item) => item.fullName === cityInput.value.trim());
      if (!location) {
        help.textContent = 'Elige un municipio de las sugerencias para validar su cobertura.';
        return;
      }
      const allowedCodes = selectedZoneCodes();
      if (allowedCodes.length && !allowedCodes.includes(location.daneCode)) return;
      const currentSelection = selectionNumber;
      help.textContent = 'Verificando cobertura para ' + location.fullName + '…';
      try {
        const response = await fetch('/api/v1/shipping/coverage?daneCode=' + encodeURIComponent(location.daneCode));
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
    cityInput.addEventListener('change', selectLocation);
    zoneSelect.addEventListener('change', () => {
      requestNumber++;
      cityInput.value = '';
      suggestions.replaceChildren();
      matches = [];
      clearSelection();
      help.textContent = zoneSelect.value
        ? 'Escribe el municipio cubierto por esta zona y selecciónalo de las sugerencias.'
        : 'Selecciona primero tu zona y luego el municipio sugerido para verificar la cobertura.';
    });
  })();</script>`;
}
