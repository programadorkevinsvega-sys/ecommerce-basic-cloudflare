import { CatalogProductDto } from '../gateways/catalog/CatalogGateway.js';

export function renderProductShippingWidget(product: CatalogProductDto): string {
  const scope = product.salePolicy.shippingScope;
  const localZones = (product.salePolicy.localCoverageZones || []).join(',');
  const productCod = product.salePolicy.allowsCashOnDelivery;

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
          onclick="checkProductShippingCoverage('${escapeHtml(scope)}', '${escapeHtml(localZones)}', ${productCod ? 'true' : 'false'})"
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
              dl.replaceChildren(...json.data.map(l => {
                const option = document.createElement('option');
                option.value = String(l.daneCode || '');
                option.label = String(l.municipality || '') + ' (' + String(l.department || '') + ')';
                option.textContent = String(l.municipality || '') + ', ' + String(l.department || '');
                return option;
              }));
            }
          } catch (e) {}
        }, 300);
      }

      async function checkProductShippingCoverage(scope, localZones, allowsCod) {
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
              style: 'currency', currency: 'COP', maximumFractionDigits: 0
            });
            const isLocal = cov.zoneType === 'city' || cov.zoneType === 'region';
            let shippingNote = '';
            if (isLocal) {
              shippingNote = allowsCod
                ? '🛵 <strong>Domicilio local de la tienda:</strong> El envío se cobra incluido o contra entrega al recibir el pedido.'
                : '🛵 <strong>Domicilio local de la tienda:</strong> Entregas en tu ciudad con nuestra propia flota.';
            } else {
              shippingNote = allowsCod
                ? '📦 <strong>Envío nacional por transportadora:</strong> Flete cancelado a la transportadora en contra entrega, o liquidado en tu compra con tarjeta.'
                : '📦 <strong>Envío nacional por transportadora:</strong> Cobertura a todo el país vía transportadora certificada.';
            }

            resultDiv.style.background = '#064e3b';
            resultDiv.style.color = '#a7f3d0';
            const title = document.createElement('div');
            title.style.cssText = 'font-weight:700;font-size:0.95rem;margin-bottom:0.25rem;';
            title.textContent = '✓ ¡Envío disponible a ' + String(cov.locationName || daneCode) + '!';
            const detail = document.createElement('div');
            detail.textContent = 'Tarifa estimada: ' + priceFmt + ' | Tiempo: ' + Number(cov.minEstimatedDays) + ' a ' + Number(cov.maxEstimatedDays) + ' días hábiles';
            const note = document.createElement('div');
            note.style.cssText = 'margin-top:0.35rem;font-size:0.83rem;line-height:1.45;border-top:1px dashed rgba(255,255,255,0.2);padding-top:0.35rem;';
            note.textContent = shippingNote.replace(/<[^>]*>/g, '');
            resultDiv.replaceChildren(title, detail, note);
          } else {
            resultDiv.style.background = '#7f1d1d';
            resultDiv.style.color = '#fecaca';
            const title = document.createElement('div');
            title.style.fontWeight = '700';
            title.style.marginBottom = '0.25rem';
            title.textContent = '✕ Sin cobertura para este destino';
            const reason = document.createElement('div');
            reason.textContent = String(cov.reason || 'Este producto no está disponible para envíos a esta zona.');
            resultDiv.replaceChildren(title, reason);
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
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
