import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';

export function renderProductShippingWidget(product: CatalogProductDto): string {
  const scope = product.salePolicy.shippingScope;
  const localZones = (product.salePolicy.localCoverageZones || []).join(',');

  return `
    <div class="shipping-coverage-widget" style="margin-top: 1.5rem; padding: 1.25rem; background: var(--bg); border: 1px solid var(--border); border-radius: 8px;">
      <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom: 0.5rem;">
        <span style="font-size: 1.3rem;">🚚</span>
        <h3 style="font-size: 1.1rem; margin: 0; font-weight:700;">¿Llega a tu ciudad o municipio?</h3>
      </div>
      <p style="font-size: 0.875rem; color: var(--muted); margin-bottom: 0.75rem;">
        Verifica al instante la cobertura, tarifa de transporte y tiempo estimado de entrega para tu destino en Colombia.
      </p>

      <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
        <input
          type="text"
          id="shipLocationInput"
          list="divipolaDatalist"
          placeholder="Escribe tu ciudad (ej. Medellín, Bogotá, Cali)..."
          style="flex: 1; min-width: 220px; padding: 0.6rem 0.75rem; border: 1px solid var(--border); border-radius: 6px; font-size: 0.95rem; background: var(--card-bg, #1e293b); color: var(--text, #fff);"
          oninput="onShippingLocationInputChanged()"
        />
        <datalist id="divipolaDatalist">
          <option value="11001" label="Bogotá, D.C. (Bogotá D.C.)">Bogotá, D.C.</option>
          <option value="05001" label="Medellín (Antioquia)">Medellín</option>
          <option value="76001" label="Cali (Valle del Cauca)">Cali</option>
          <option value="08001" label="Barranquilla (Atlántico)">Barranquilla</option>
          <option value="13001" label="Cartagena de Indias (Bolívar)">Cartagena</option>
          <option value="68001" label="Bucaramanga (Santander)">Bucaramanga</option>
          <option value="66001" label="Pereira (Risaralda)">Pereira</option>
          <option value="54001" label="Cúcuta (Norte de Santander)">Cúcuta</option>
          <option value="17001" label="Manizales (Caldas)">Manizales</option>
          <option value="73001" label="Ibagué (Tolima)">Ibagué</option>
          <option value="47001" label="Santa Marta (Magdalena)">Santa Marta</option>
          <option value="50001" label="Villavicencio (Meta)">Villavicencio</option>
          <option value="52001" label="Pasto (Nariño)">Pasto</option>
          <option value="41001" label="Neiva (Huila)">Neiva</option>
          <option value="63001" label="Armenia (Quindío)">Armenia</option>
          <option value="20001" label="Valledupar (Cesar)">Valledupar</option>
          <option value="23001" label="Montería (Córdoba)">Montería</option>
          <option value="70001" label="Sincelejo (Sucre)">Sincelejo</option>
          <option value="19001" label="Popayán (Cauca)">Popayán</option>
          <option value="15001" label="Tunja (Boyacá)">Tunja</option>
        </datalist>
        <button
          type="button"
          onclick="checkProductShippingCoverage('${escapeHtml(scope)}', '${escapeHtml(localZones)}')"
          style="padding: 0.6rem 1.2rem; background: var(--accent); color: #fff; border: none; border-radius: 6px; font-weight: 600; cursor: pointer;"
        >
          Verificar
        </button>
      </div>

      <div id="shipCoverageResult" style="display:none; margin-top: 0.85rem; padding: 0.75rem 1rem; border-radius: 6px; font-size: 0.9rem; line-height: 1.5;"></div>
    </div>

    <script>
      let searchTimeout = null;
      async function onShippingLocationInputChanged() {
        const val = document.getElementById('shipLocationInput').value.trim();
        if (val.length < 2) return;
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(async () => {
          try {
            const res = await fetch('/api/v1/shipping/locations?q=' + encodeURIComponent(val));
            const json = await res.json();
            if (json.data && json.data.length > 0) {
              const dl = document.getElementById('divipolaDatalist');
              dl.innerHTML = json.data.map(l =>
                '<option value="' + l.daneCode + '" label="' + l.municipality + ' (' + l.department + ')">' + l.municipality + ', ' + l.department + '</option>'
              ).join('');
            }
          } catch (e) {}
        }, 300);
      }

      async function checkProductShippingCoverage(scope, localZones) {
        const inputVal = document.getElementById('shipLocationInput').value.trim();
        const resultDiv = document.getElementById('shipCoverageResult');
        if (!inputVal) {
          resultDiv.style.display = 'block';
          resultDiv.style.background = '#7f1d1d';
          resultDiv.style.color = '#fecaca';
          resultDiv.textContent = 'Por favor ingresa o selecciona un municipio.';
          return;
        }

        resultDiv.style.display = 'block';
        resultDiv.style.background = '#1e293b';
        resultDiv.style.color = '#94a3b8';
        resultDiv.textContent = 'Consultando cobertura y tarifas...';

        try {
          let daneCode = inputVal;
          const options = Array.from(document.getElementById('divipolaDatalist').options);
          const matchOpt = options.find(o => o.value === inputVal || o.textContent.toLowerCase().includes(inputVal.toLowerCase()) || (o.label && o.label.toLowerCase().includes(inputVal.toLowerCase())));
          if (matchOpt) {
            daneCode = matchOpt.value;
          }

          let url = '/api/v1/shipping/coverage?daneCode=' + encodeURIComponent(daneCode);
          if (scope) url += '&shippingScope=' + encodeURIComponent(scope);
          if (localZones) url += '&allowedZoneIds=' + encodeURIComponent(localZones);

          const res = await fetch(url);
          const json = await res.json();

          if (!res.ok || !json.data) {
            resultDiv.style.background = '#7f1d1d';
            resultDiv.style.color = '#fecaca';
            resultDiv.textContent = json.error || 'No se pudo verificar la cobertura';
            return;
          }

          const cov = json.data;
          if (cov.isCovered) {
            const priceFmt = (cov.priceInCents / 100).toLocaleString('es-CO', {
              style: 'currency',
              currency: 'COP',
              maximumFractionDigits: 0
            });
            const codText = cov.allowsCashOnDelivery
              ? '✅ Admite pago contra entrega'
              : 'ℹ️ Requiere pago en línea con Wompi';

            resultDiv.style.background = '#064e3b';
            resultDiv.style.color = '#a7f3d0';
            resultDiv.innerHTML = [
              '<div style="font-weight:700; font-size:0.95rem; margin-bottom:0.25rem;">✓ ¡Envío disponible a ' + (cov.locationName || daneCode) + '!</div>',
              '<div><strong>Tarifa estimada:</strong> ' + priceFmt + ' | <strong>Tiempo:</strong> ' + cov.minEstimatedDays + ' a ' + cov.maxEstimatedDays + ' días hábiles</div>',
              '<div style="margin-top:0.2rem; font-size:0.85rem;">' + codText + ' (Zona: ' + cov.zoneName + ')</div>'
            ].join('');
          } else {
            resultDiv.style.background = '#7f1d1d';
            resultDiv.style.color = '#fecaca';
            resultDiv.innerHTML = [
              '<div style="font-weight:700; margin-bottom:0.25rem;">✕ Sin cobertura para este destino</div>',
              '<div>' + (cov.reason || 'Este producto no está disponible para envíos a esta zona.') + '</div>'
            ].join('');
          }
        } catch (e) {
          resultDiv.style.background = '#7f1d1d';
          resultDiv.style.color = '#fecaca';
          resultDiv.textContent = 'Error de conexión al consultar cobertura.';
        }
      }
    </script>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
