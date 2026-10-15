import { ShippingZoneDto, DivipolaLocationDto } from '../../gateways/shipping/ShippingGateway.js';
import { renderShippingTableRows } from './renderShippingTableRows.js';
import { renderShippingLocationRows } from './renderShippingLocationRows.js';
import { CarrierIntegrationConfigDto } from '../../gateways/shipping/ShippingGateway.js';
import { renderMiPaqueteConfigSection } from './renderMiPaqueteConfigSection.js';

export function renderShippingManagementSection(zones: ShippingZoneDto[], divipolaLocations: DivipolaLocationDto[] = [], carrierConfig?: CarrierIntegrationConfigDto): string {
  const divipolaMap = new Map<string, string>();
  divipolaLocations.forEach(location => divipolaMap.set(location.daneCode, location.fullName));
  return `<section class="shipping-screen" aria-labelledby="shipping-title">
    <header class="shipping-heading" data-shipping-heading><div><h1 id="shipping-title">Envíos y cobertura</h1><p>Configura las tarifas, tiempos de entrega y municipios cubiertos.</p></div><button class="btn-primary" type="button" onclick="openShippingZoneModal()">Crear zona de envío</button></header>
    <section class="shipping-page-panel" data-shipping-panel="zones" aria-labelledby="shipping-zones-title">
      <div class="card shipping-zones-card"><div class="shipping-section-heading"><div><h2 id="shipping-zones-title">Zonas de cobertura y tarifas</h2><p>${zones.length} zonas configuradas</p></div></div>
        <div class="shipping-table-scroll"><table class="shipping-table"><thead><tr><th>Zona / cobertura</th><th>Tipo</th><th>Tarifa</th><th>Plazo</th><th>Condiciones</th><th>Acciones</th></tr></thead><tbody id="shippingZonesTableBody">${renderShippingTableRows(zones, divipolaMap)}</tbody></table></div>
      </div>
    </section>
    <section class="shipping-page-panel" data-shipping-panel="carriers" aria-labelledby="shipping-carriers-title" hidden>
      <header class="shipping-heading shipping-carriers-heading"><div><h1 id="shipping-carriers-title">Transportadoras</h1><p>Configura cada integración de transporte por separado.</p></div></header>
      <div class="shipping-carrier-integrations">
        <div class="shipping-carrier-group-heading"><h2>Integraciones</h2><p>Cada transportadora conserva sus propios datos y reglas operativas.</p></div>
        ${carrierConfig ? renderMiPaqueteConfigSection(carrierConfig) : '<section class="card shipping-carrier-config-card"><h2>MiPaquete</h2><p>No se pudo cargar su configuración.</p></section>'}
      </div>
    </section>
    <section class="shipping-page-panel" data-shipping-panel="locations" aria-labelledby="shipping-locations-title" hidden>
        <div class="card shipping-locations-page-card"><div class="shipping-section-heading"><div><h2 id="shipping-locations-title">Municipios DANE</h2><p id="shipping-location-count">Cargando municipios…</p><small class="shipping-catalog-note">El catálogo cargado contiene municipios principales; no incluye todos los municipios de DIVIPOLA. La cobertura nacional se muestra por separado.</small></div></div>
        <label class="shipping-location-search" for="shipping-location-search">Buscar municipio, departamento o código</label><input id="shipping-location-search" type="search" placeholder="Ej. Medellín o 05001" oninput="filterShippingDirectory()" />
        <div class="shipping-table-scroll"><table class="shipping-table"><thead><tr><th>Municipio</th><th>Departamento</th><th>Código DANE</th><th>Cobertura actual</th><th>Acciones</th></tr></thead><tbody id="shippingLocationsTableBody">${renderShippingLocationRows(divipolaLocations, zones)}</tbody></table></div>
        <nav class="admin-pagination" id="shipping-locations-pagination" aria-label="Paginación de municipios DANE"><button class="admin-page-button" type="button" data-page-direction="previous" disabled>Anterior</button><span aria-live="polite">Página 1</span><button class="admin-page-button" type="button" data-page-direction="next" disabled>Siguiente</button></nav>
      </div>
    </section>
    <div id="shippingZoneModal" class="shipping-modal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="shFormTitle">
      <button class="shipping-modal-backdrop" type="button" aria-label="Cerrar formulario de zona" onclick="closeShippingZoneModal()"></button>
      <section class="shipping-modal-dialog shipping-zone-dialog"><header><div><h2 id="shFormTitle">Crear nueva zona de envío</h2><p>Define cobertura, tarifa, entrega y disponibilidad contra entrega.</p></div><button type="button" class="shipping-modal-close" aria-label="Cerrar" onclick="closeShippingZoneModal()">×</button></header>
        <form id="newShippingZoneForm"><input type="hidden" id="shEditId" value="" />
          <div class="shipping-form-grid">
            <label for="shName">Nombre de la zona</label><input type="text" id="shName" required placeholder="Ej. Bogotá D.C. & Sabana" />
            <label for="shType">Tipo de zona</label><select id="shType" onchange="onShippingTypeChange()"><option value="city">Ciudad / Área Metropolitana</option><option value="national">Nacional (Todo el país)</option><option value="department">Departamento</option><option value="municipality">Municipio Específico</option></select>
            <label for="shPrice">Tarifa de envío (COP)</label><input type="text" id="shPrice" data-cop-input inputmode="numeric" autocomplete="off" required placeholder="12.000" />
            <label for="shMinDays">Plazo mínimo (días hábiles)</label><input type="number" id="shMinDays" value="1" min="0" required />
            <label for="shMaxDays">Plazo máximo (días hábiles)</label><input type="number" id="shMaxDays" value="3" min="1" required />
            <label for="shAllowsCod">Pago contra entrega</label><select id="shAllowsCod"><option value="1">Permitido (efectivo al recibir)</option><option value="0">No permitido (solo pago anticipado)</option></select>
            <label for="shIsActive">Estado inicial</label><select id="shIsActive"><option value="1">Activa</option><option value="0">Inactiva</option></select>
          </div>
          <div id="shLocationsWrapper" class="shipping-locations"><label for="shLocSearch">Municipios / ciudades cubiertas (DANE)</label><p>Busca y marca los municipios que pertenecen a esta zona.</p><input type="search" id="shLocSearch" placeholder="Buscar municipio o departamento" oninput="filterShippingLocations()" /><select id="shLocationsSelect" multiple size="6"></select><div id="shSelectedCount" class="shipping-selected-count" aria-live="polite">0 municipios seleccionados</div></div>
          <div class="shipping-form-actions"><button type="submit" class="btn-primary" id="shSubmitBtn">Crear zona de envío</button><button type="button" class="shipping-cancel-button" id="shCancelBtn" style="display:none" onclick="resetShippingZoneForm()">Cancelar edición</button><button type="button" class="shipping-cancel-button" onclick="closeShippingZoneModal()">Cerrar</button></div><div id="shMsg" class="msg" role="status"></div>
        </form>
      </section>
    </div>
    <dialog id="shipping-location-detail" class="shipping-detail-dialog" aria-labelledby="shipping-location-detail-title">
      <header><h2 id="shipping-location-detail-title">Municipio DANE</h2><form method="dialog"><button class="shipping-modal-close" aria-label="Cerrar">×</button></form></header>
      <dl><div><dt>Municipio</dt><dd id="shipping-detail-name"></dd></div><div><dt>Departamento</dt><dd id="shipping-detail-department"></dd></div><div><dt>Código DANE</dt><dd id="shipping-detail-code"></dd></div><div><dt>Tipo</dt><dd id="shipping-detail-type"></dd></div></dl>
    </dialog>
    <div id="shippingDetailsModal" class="shipping-modal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="modalShTitle"><button class="shipping-modal-backdrop" type="button" aria-label="Cerrar detalles de zona" onclick="closeShippingDetailsModal()"></button><section class="shipping-modal-dialog"><header><h2 id="modalShTitle">Detalles de zona de envío</h2><button type="button" class="shipping-modal-close" aria-label="Cerrar" onclick="closeShippingDetailsModal()">×</button></header><div id="modalShContent" class="shipping-modal-content"></div><footer><button type="button" class="btn-primary" onclick="closeShippingDetailsModal()">Cerrar</button></footer></section></div>
  </section>`;
}
