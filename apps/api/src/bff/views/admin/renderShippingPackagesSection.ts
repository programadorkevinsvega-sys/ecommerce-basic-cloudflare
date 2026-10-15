import { CarrierIntegrationConfigDto } from '../../gateways/shipping/ShippingGateway.js';

export function renderShippingPackagesSection(config: CarrierIntegrationConfigDto): string {
  return `<header class="shipping-heading shipping-package-page-heading"><div><h1>Cajas y sobres</h1><p>Administra los empaques usados para cotizar envíos con MiPaquete.</p></div></header>
    <section class="card shipping-carrier-config-card shipping-package-page-card" aria-labelledby="shipping-packages-title">
      <div class="shipping-section-heading shipping-package-heading"><div><h2 id="shipping-packages-title">Empaques de MiPaquete</h2><p>Una unidad se cotiza con su empaque individual. Para pedidos de varias unidades se usa el empaque activo más pequeño que las contenga. Dimensiones en centímetros y pesos en gramos.</p></div><button type="button" class="shipping-action primary" id="mp-package-create">+ Crear empaque</button></div>
      <div class="shipping-table-scroll"><table class="shipping-table"><thead><tr><th>Empaque</th><th>Dimensión interna</th><th>Dimensión externa</th><th>Peso tara / máximo</th><th>Estado</th><th>Acciones</th></tr></thead><tbody id="mp-package-rows">${config.packageProfiles.map(renderProfileRow).join('') || '<tr><td colspan="6" class="shipping-empty">No hay empaques registrados.</td></tr>'}</tbody></table></div>
    </section>
    ${renderPackageDialog()}`;
}

function renderProfileRow(profile: CarrierIntegrationConfigDto['packageProfiles'][number]): string {
  const dimensions = (width: number, length: number, height: number) => `${width} × ${length} × ${height} cm`;
  return `<tr data-package-row="${escapeValue(profile.id)}"><td><strong>${escapeValue(profile.name)}</strong></td><td>${dimensions(profile.innerWidthCm, profile.innerLengthCm, profile.innerHeightCm)}</td><td>${dimensions(profile.outerWidthCm, profile.outerLengthCm, profile.outerHeightCm)}</td><td>${profile.tareWeightGrams} g / ${profile.maxWeightGrams} g</td><td><span class="shipping-badge ${profile.isActive ? 'active' : 'inactive'}">${profile.isActive ? 'Activo' : 'Inactivo'}</span></td><td><div class="shipping-row-actions"><button class="shipping-action" data-package-action="view">Ver</button><button class="shipping-action" data-package-action="edit">Editar</button><button class="shipping-action" data-package-action="toggle">${profile.isActive ? 'Desactivar' : 'Activar'}</button><button class="shipping-action danger" data-package-action="delete">Eliminar</button></div></td></tr>`;
}

function renderPackageDialog(): string {
  const fields = [['name','Nombre del empaque','text'],['innerWidthCm','Ancho interno (cm)'],['innerLengthCm','Largo interno (cm)'],['innerHeightCm','Alto interno (cm)'],['outerWidthCm','Ancho externo (cm)'],['outerLengthCm','Largo externo (cm)'],['outerHeightCm','Alto externo (cm)'],['tareWeightGrams','Peso del empaque (g)'],['maxWeightGrams','Peso máximo total (g)']];
  const inputs = fields.map(([key, label, type]) => `<label>${label}<input data-mp-package="${key}" type="${type || 'number'}" ${type ? 'maxlength="100"' : 'min="0" step="1"'} required></label>`).join('');
  return `<dialog class="shipping-detail-dialog shipping-package-dialog" id="mp-package-dialog"><form id="mp-package-form"><header><div><h2 id="mp-package-title">Crear empaque</h2><p>Registra medidas internas, externas y capacidad de peso.</p></div><button type="button" class="shipping-action" id="mp-package-close" aria-label="Cerrar">×</button></header><input id="mp-package-id" type="hidden"><div class="shipping-package-grid">${inputs}</div><label class="mp-package-state">Estado<select id="mp-package-active"><option value="true">Activo</option><option value="false">Inactivo</option></select></label><footer><button type="button" class="shipping-action" id="mp-package-cancel">Cancelar</button><button type="submit" class="btn-primary">Guardar empaque</button></footer></form></dialog>`;
}

function escapeValue(value: string): string { return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
