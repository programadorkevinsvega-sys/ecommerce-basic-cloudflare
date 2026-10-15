import { ShippingZoneDto, DivipolaLocationDto } from '../../gateways/shipping/ShippingGateway.js';
import { renderShippingTableRows } from './renderShippingTableRows.js';
import { renderShippingLocationRows } from './renderShippingLocationRows.js';
import { CarrierIntegrationConfigDto } from '../../gateways/shipping/ShippingGateway.js';
import { renderMiPaqueteConfigSection } from './renderMiPaqueteConfigSection.js';
import { renderShippingPackagesSection } from './renderShippingPackagesSection.js';
import { renderShippingLabelsAdminSection } from './renderShippingLabelsAdminSection.js';
import { renderFreeShippingPolicySection } from './renderFreeShippingPolicySection.js';
import { FreeShippingPolicyDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderShippingManagementSection(zones: ShippingZoneDto[], divipolaLocations: DivipolaLocationDto[] = [], carrierConfig?: CarrierIntegrationConfigDto, freeShippingPolicy: FreeShippingPolicyDto = { enabled: true, thresholdCents: 15000000, updatedAt: '' }): string {
  const localZones = zones.filter((zone) => zone.type !== 'national');
  const divipolaMap = new Map<string, string>();
  const packageConfig = carrierConfig || { enabled: false, originDaneCode: null, packageWidthCm: null, packageLengthCm: null,
    packageHeightCm: null, packageWeightKg: null, declaredValueMode: null, cashOnDeliveryPaymentType: null,
    requestPickup: null, selectionCriterion: null, packageProfiles: [], updatedAt: '' };
  divipolaLocations.forEach(location => divipolaMap.set(location.daneCode, location.fullName));
  return `<section class="shipping-screen" aria-labelledby="shipping-title">
    <header class="shipping-heading" data-shipping-heading><div><h1 id="shipping-title">Envíos y cobertura</h1><p>Administra entregas locales del comercio. Los destinos nacionales se cotizan con MiPaquete.</p></div><button class="btn-primary" type="button" onclick="openShippingZoneModal()">Crear zona local</button></header>
    <section class="shipping-page-panel" data-shipping-panel="zones" aria-labelledby="shipping-zones-title">
      <div class="card shipping-zones-card"><div class="shipping-section-heading"><div><h2 id="shipping-zones-title">Entrega local del comercio</h2><p>${localZones.filter((zone) => zone.isActive).length} zonas locales activas · Medellín y Valle de Aburrá</p></div></div>
        <div class="shipping-table-scroll"><table class="shipping-table"><thead><tr><th>Zona local / municipios</th><th>Tipo</th><th>Tarifa</th><th>Plazo</th><th>Condiciones</th><th>Acciones</th></tr></thead><tbody id="shippingZonesTableBody">${renderShippingTableRows(localZones, divipolaMap)}</tbody></table></div>
      </div>
    </section>
    <section class="shipping-page-panel" data-shipping-panel="carriers" aria-labelledby="shipping-carriers-title" hidden>
      <header class="shipping-heading shipping-carriers-heading"><div><h1 id="shipping-carriers-title">Transportadoras</h1><p>Configura cada integración de transporte por separado.</p></div></header>
      <div class="shipping-carrier-integrations">
        <div class="shipping-carrier-group-heading"><h2>Integraciones</h2><p>Cada transportadora conserva sus propios datos y reglas operativas.</p></div>
        ${carrierConfig ? renderMiPaqueteConfigSection(carrierConfig) : '<section class="card shipping-carrier-config-card"><h2>MiPaquete</h2><p>No se pudo cargar su configuración.</p></section>'}
      </div>
    </section>
    <section class="shipping-page-panel" data-shipping-panel="packages" aria-labelledby="shipping-packages-title" hidden>
      ${renderShippingPackagesSection(packageConfig)}
    </section>
    <section class="shipping-page-panel" data-shipping-panel="locations" aria-labelledby="shipping-locations-title" hidden>
        <div class="card shipping-locations-page-card"><div class="shipping-section-heading"><div><h2 id="shipping-locations-title">Municipios con entrega local</h2><p id="shipping-location-count">Cargando cobertura local…</p><small class="shipping-catalog-note">Esta lista muestra solo municipios asignados a zonas locales. Los destinos nacionales y sus tarifas los determina MiPaquete.</small></div><button class="btn-primary" type="button" onclick="openShippingZoneModal()">Agregar municipios locales</button></div>
        <label class="shipping-location-search" for="shipping-location-search">Buscar municipio, departamento o código</label><input id="shipping-location-search" type="search" placeholder="Ej. Medellín o 05001" oninput="filterShippingDirectory()" />
        <div class="shipping-table-scroll"><table class="shipping-table"><thead><tr><th>Municipio</th><th>Departamento</th><th>Código DANE</th><th>Cobertura actual</th><th>Acciones</th></tr></thead><tbody id="shippingLocationsTableBody">${renderShippingLocationRows(divipolaLocations, zones)}</tbody></table></div>
        <nav class="admin-pagination" id="shipping-locations-pagination" aria-label="Paginación de municipios DANE"><button class="admin-page-button" type="button" data-page-direction="previous" disabled>Anterior</button><span aria-live="polite">Página 1</span><button class="admin-page-button" type="button" data-page-direction="next" disabled>Siguiente</button></nav>
      </div>
    </section>
    <section class="shipping-page-panel" data-shipping-panel="print-labels" hidden>${renderShippingLabelsAdminSection()}</section>
    ${renderFreeShippingPolicySection(freeShippingPolicy)}
    <div id="shippingZoneModal" class="shipping-modal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="shFormTitle">
      <button class="shipping-modal-backdrop" type="button" aria-label="Cerrar formulario de zona" onclick="closeShippingZoneModal()"></button>
      <section id="shippingZoneDialog" tabindex="-1" class="shipping-modal-dialog shipping-zone-dialog"><header><div><h2 id="shFormTitle">Crear nueva zona de envío</h2><p>Define cobertura, tarifa, entrega y disponibilidad contra entrega.</p></div><button type="button" class="shipping-modal-close" aria-label="Cerrar" onclick="closeShippingZoneModal()">×</button></header>
        <form id="newShippingZoneForm"><input type="hidden" id="shEditId" value="" />
          <div class="shipping-form-grid">
            <label for="shName">Nombre de la zona</label><input type="text" id="shName" required placeholder="Ej. Bogotá D.C. & Sabana" />
            <label for="shType">Tipo de zona local</label><select id="shType" onchange="onShippingTypeChange()"><option value="city">Ciudad / Área Metropolitana</option><option value="department">Departamento</option><option value="municipality">Municipio Específico</option></select>
            <label for="shPrice">Tarifa de envío (COP)</label><input type="text" id="shPrice" data-cop-input inputmode="numeric" autocomplete="off" required placeholder="12.000" />
            <label for="shMinDays">Plazo mínimo (días hábiles)</label><input type="number" id="shMinDays" value="1" min="0" required />
            <label for="shMaxDays">Plazo máximo (días hábiles)</label><input type="number" id="shMaxDays" value="3" min="1" required />
            <label for="shAllowsCod">Pago contra entrega</label><select id="shAllowsCod"><option value="1">Permitido (efectivo al recibir)</option><option value="0">No permitido (solo pago anticipado)</option></select>
            <label for="shIsActive">Estado inicial</label><select id="shIsActive"><option value="1">Activa</option><option value="0">Inactiva</option></select>
          </div>
          <div id="shLocationsWrapper" class="shipping-locations"><label for="shLocSearch">Municipios atendidos por el comercio (DANE)</label><p>Solo municipios del Valle de Aburrá atendidos por el comercio. La cobertura nacional se cotiza con MiPaquete.</p><input type="search" id="shLocSearch" placeholder="Buscar municipio del Valle de Aburrá" oninput="filterShippingLocations()" /><select id="shLocationsSelect" multiple size="6"><option value="05079">Barbosa (Antioquia) [05079]</option><option value="05088">Bello (Antioquia) [05088]</option><option value="05129">Caldas (Antioquia) [05129]</option><option value="05212">Copacabana (Antioquia) [05212]</option><option value="05266">Envigado (Antioquia) [05266]</option><option value="05308">Girardota (Antioquia) [05308]</option><option value="05360">Itagüí (Antioquia) [05360]</option><option value="05380">La Estrella (Antioquia) [05380]</option><option value="05001">Medellín (Antioquia) [05001]</option><option value="05631">Sabaneta (Antioquia) [05631]</option></select><div id="shSelectedCount" class="shipping-selected-count" aria-live="polite">0 municipios seleccionados</div></div>
          <div class="shipping-form-actions"><button type="submit" class="btn-primary" id="shSubmitBtn">Crear zona local</button><button type="button" class="shipping-cancel-button" id="shCancelBtn" style="display:none" onclick="resetShippingZoneForm()">Cancelar edición</button><button type="button" class="shipping-cancel-button" onclick="closeShippingZoneModal()">Cerrar</button></div><div id="shMsg" class="msg" role="status"></div>
        </form>
      </section>
    </div>
    <dialog id="shipping-location-detail" class="shipping-detail-dialog shipping-location-dialog" aria-labelledby="shipping-location-detail-title">
      <header><h2 id="shipping-location-detail-title">Municipio DANE</h2><form method="dialog"><button class="shipping-modal-close" aria-label="Cerrar">×</button></form></header>
      <dl><div><dt>Municipio</dt><dd id="shipping-detail-name"></dd></div><div><dt>Departamento</dt><dd id="shipping-detail-department"></dd></div><div><dt>Código DANE</dt><dd id="shipping-detail-code"></dd></div><div><dt>Tipo</dt><dd id="shipping-detail-type"></dd></div><div><dt>Zona y condiciones</dt><dd id="shipping-detail-zones" class="shipping-detail-zones"></dd></div></dl>
    </dialog>
    <div id="shippingDetailsModal" class="shipping-modal" style="display:none" role="dialog" aria-modal="true" aria-labelledby="modalShTitle"><button class="shipping-modal-backdrop" type="button" aria-label="Cerrar detalles de zona" onclick="closeShippingDetailsModal()"></button><section class="shipping-modal-dialog"><header><h2 id="modalShTitle">Detalles de zona de envío</h2><button type="button" class="shipping-modal-close" aria-label="Cerrar" onclick="closeShippingDetailsModal()">×</button></header><div id="modalShContent" class="shipping-modal-content"></div><footer><button type="button" class="btn-primary" onclick="closeShippingDetailsModal()">Cerrar</button></footer></section></div>
  </section>`;
}
