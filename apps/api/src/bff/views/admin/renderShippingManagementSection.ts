import { ShippingZoneDto, DivipolaLocationDto } from '../../gateways/shipping/ShippingGateway.js';
import { renderShippingTableRows } from './renderShippingTableRows.js';

export function renderShippingManagementSection(
  zones: ShippingZoneDto[],
  divipolaLocations: DivipolaLocationDto[] = []
): string {
  const divipolaMap = new Map<string, string>();
  divipolaLocations.forEach((l) => divipolaMap.set(l.daneCode, l.fullName));

  const locationOptions = divipolaLocations.map((l) =>
    `<option value="${escapeHtml(l.daneCode)}">${escapeHtml(l.municipality)} (${escapeHtml(l.department)}) [${escapeHtml(l.daneCode)}]</option>`
  ).join('');

  return `
    <div class="card">
      <h2 id="shFormTitle">Crear Nueva Zona de Envío</h2>
      <p style="color:#94a3b8; font-size:0.875rem; margin-bottom:1rem;">
        Define tarifas de flete, cobertura geográfica (DANE) y disponibilidad de pago contra entrega por zona.
      </p>
      <form id="newShippingZoneForm" style="margin-bottom: 1.5rem;">
        <input type="hidden" id="shEditId" value="" />
        <div class="form-grid">
          <div><label>Nombre de la Zona</label><input type="text" id="shName" required placeholder="Ej. Bogotá D.C. & Sabana" /></div>
          <div>
            <label>Tipo de Zona</label>
            <select id="shType" onchange="onShippingTypeChange()">
              <option value="city">Ciudad / Área Metropolitana</option>
              <option value="national">Nacional (Todo el país)</option>
              <option value="department">Departamento</option>
              <option value="municipality">Municipio Específico</option>
            </select>
          </div>
          <div><label>Tarifa de Envío (COP)</label><input type="text" id="shPrice" data-cop-input inputmode="numeric" autocomplete="off" required placeholder="12.000" /></div>
          <div><label>Plazo Mínimo (Días hábiles)</label><input type="number" id="shMinDays" value="1" min="0" required /></div>
          <div><label>Plazo Máximo (Días hábiles)</label><input type="number" id="shMaxDays" value="3" min="1" required /></div>
          <div>
            <label>Pago Contra Entrega</label>
            <select id="shAllowsCod">
              <option value="1">Permitido (Efectivo al recibir)</option>
              <option value="0">No permitido (Solo pago anticipado)</option>
            </select>
          </div>
          <div>
            <label>Estado Inicial</label>
            <select id="shIsActive"><option value="1">Activa</option><option value="0">Inactiva</option></select>
          </div>
        </div>

        <div id="shLocationsWrapper" style="margin-top:1rem;">
          <label>Municipios / Ciudades Cubiertas (DANE)</label>
          <div style="font-size:0.8rem; color:#94a3b8; margin-bottom:0.4rem;">
            Filtra y mantén presionado Ctrl (o Cmd) para seleccionar múltiples municipios:
          </div>
          <input type="text" id="shLocSearch" placeholder="🔍 Escribe para filtrar municipios..." oninput="filterShippingLocations()" style="margin-bottom:0.35rem;" />
          <select id="shLocationsSelect" multiple size="6" style="height:auto; min-height:120px;">
            ${locationOptions}
          </select>
          <div id="shSelectedCount" style="font-size:0.8rem; color:#38bdf8; margin-top:0.3rem;">0 municipios seleccionados</div>
        </div>

        <div style="margin-top: 1.5rem; display:flex; gap:0.75rem;">
          <button type="submit" class="btn-primary" id="shSubmitBtn">Crear Zona de Envío</button>
          <button type="button" class="btn-action" id="shCancelBtn" style="display:none; padding:0.75rem 1rem;" onclick="resetShippingZoneForm()">Cancelar Edición</button>
        </div>
        <div id="shMsg" class="msg"></div>
      </form>
    </div>

    <div class="card">
      <h2>Zonas de Cobertura y Tarifas (${zones.length})</h2>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; margin-top:1rem; font-size:0.875rem;">
          <thead>
            <tr style="text-align:left; color:#94a3b8; border-bottom:1px solid #334155;">
              <th style="padding:0.6rem;">Zona / Cobertura</th>
              <th style="padding:0.6rem;">Tipo</th>
              <th style="padding:0.6rem;">Tarifa</th>
              <th style="padding:0.6rem;">Plazo</th>
              <th style="padding:0.6rem;">Condiciones</th>
              <th style="padding:0.6rem; text-align:right;">Acciones</th>
            </tr>
          </thead>
          <tbody id="shippingZonesTableBody">
            ${renderShippingTableRows(zones, divipolaMap)}
          </tbody>
        </table>
      </div>
    </div>

    <div id="shippingDetailsModal" style="display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.7); z-index:9999; align-items:center; justify-content:center;">
      <div class="card" style="max-width:550px; width:90%; max-height:85vh; overflow-y:auto; background:#1e293b; border:1px solid #334155;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
          <h2 id="modalShTitle" style="margin:0; font-size:1.25rem;">Detalles de Zona de Envío</h2>
          <button type="button" class="btn-action" onclick="closeShippingDetailsModal()" style="font-size:1rem; cursor:pointer;">✕</button>
        </div>
        <div id="modalShContent" style="font-size:0.9rem; line-height:1.6; color:#cbd5e1;"></div>
        <div style="margin-top:1.5rem; text-align:right;">
          <button type="button" class="btn-primary" onclick="closeShippingDetailsModal()">Cerrar</button>
        </div>
      </div>
    </div>
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
