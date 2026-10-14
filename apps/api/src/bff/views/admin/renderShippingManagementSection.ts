import { ShippingZoneDto, DivipolaLocationDto } from '../../gateways/shipping/ShippingGateway.js';
import { renderShippingTableRows } from './renderShippingTableRows.js';

export function renderShippingManagementSection(zones: ShippingZoneDto[], divipolaLocations: DivipolaLocationDto[] = []): string {
  const divipolaMap = new Map<string, string>();
  divipolaLocations.forEach(location => divipolaMap.set(location.daneCode, location.fullName));
  const locationOptions = divipolaLocations.map(location =>
    `<option value="${escapeHtml(location.daneCode)}">${escapeHtml(location.municipality)} (${escapeHtml(location.department)}) [${escapeHtml(location.daneCode)}]</option>`
  ).join('');

  return `<section class="shipping-screen" aria-labelledby="shipping-title">
    <header class="shipping-heading"><div><h1 id="shipping-title">Envíos y cobertura</h1><p>Configura las tarifas, tiempos de entrega y municipios cubiertos.</p></div></header>
    <section class="card shipping-form-card" aria-labelledby="shFormTitle">
      <div class="shipping-section-heading"><div><h2 id="shFormTitle">Crear nueva zona de envío</h2><p>Define cobertura geográfica y disponibilidad de pago contra entrega.</p></div></div>
      <form id="newShippingZoneForm">
        <input type="hidden" id="shEditId" value="" />
        <div class="shipping-form-grid">
          <label for="shName">Nombre de la zona</label><input type="text" id="shName" required placeholder="Ej. Bogotá D.C. & Sabana" />
          <label for="shType">Tipo de zona</label><select id="shType" onchange="onShippingTypeChange()"><option value="city">Ciudad / Área Metropolitana</option><option value="national">Nacional (Todo el país)</option><option value="department">Departamento</option><option value="municipality">Municipio Específico</option></select>
          <label for="shPrice">Tarifa de envío (COP)</label><input type="text" id="shPrice" data-cop-input inputmode="numeric" autocomplete="off" required placeholder="12.000" />
          <label for="shMinDays">Plazo mínimo (días hábiles)</label><input type="number" id="shMinDays" value="1" min="0" required />
          <label for="shMaxDays">Plazo máximo (días hábiles)</label><input type="number" id="shMaxDays" value="3" min="1" required />
          <label for="shAllowsCod">Pago contra entrega</label><select id="shAllowsCod"><option value="1">Permitido (efectivo al recibir)</option><option value="0">No permitido (solo pago anticipado)</option></select>
          <label for="shIsActive">Estado inicial</label><select id="shIsActive"><option value="1">Activa</option><option value="0">Inactiva</option></select>
        </div>
        <div id="shLocationsWrapper" class="shipping-locations">
          <label for="shLocSearch">Municipios / ciudades cubiertas (DANE)</label>
          <p>Busca y selecciona los municipios. Usa Ctrl o Cmd para elegir varios.</p>
          <input type="search" id="shLocSearch" placeholder="Buscar municipio o departamento" oninput="filterShippingLocations()" />
          <select id="shLocationsSelect" multiple size="6">${locationOptions}</select>
          <div id="shSelectedCount" class="shipping-selected-count" aria-live="polite">0 municipios seleccionados</div>
        </div>
        <div class="shipping-form-actions"><button type="submit" class="btn-primary" id="shSubmitBtn">Crear zona de envío</button><button type="button" class="btn-action" id="shCancelBtn" style="display:none" onclick="resetShippingZoneForm()">Cancelar edición</button></div>
        <div id="shMsg" class="msg" role="status"></div>
      </form>
    </section>
    <section class="card shipping-zones-card" aria-labelledby="shipping-zones-title">
      <div class="shipping-section-heading"><div><h2 id="shipping-zones-title">Zonas de cobertura y tarifas</h2><p>${zones.length} zonas configuradas</p></div></div>
      <div class="shipping-table-scroll"><table class="shipping-table"><thead><tr><th>Zona / cobertura</th><th>Tipo</th><th>Tarifa</th><th>Plazo</th><th>Condiciones</th><th>Acciones</th></tr></thead><tbody id="shippingZonesTableBody">${renderShippingTableRows(zones, divipolaMap)}</tbody></table></div>
    </section>
    <div id="shippingDetailsModal" class="shipping-modal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="modalShTitle">
      <button class="shipping-modal-backdrop" type="button" aria-label="Cerrar detalles de zona" onclick="closeShippingDetailsModal()"></button>
      <section class="shipping-modal-dialog"><header><h2 id="modalShTitle">Detalles de zona de envío</h2><button type="button" class="shipping-modal-close" aria-label="Cerrar" onclick="closeShippingDetailsModal()">×</button></header><div id="modalShContent" class="shipping-modal-content"></div><footer><button type="button" class="btn-primary" onclick="closeShippingDetailsModal()">Cerrar</button></footer></section>
    </div>
  </section>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
