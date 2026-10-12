export function renderOrdersManagementSection(): string {
  return `
    <div class="card" style="margin-bottom: 2rem;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
        <div>
          <h2>Gestión de Pedidos</h2>
          <p style="color:var(--muted); font-size:0.85rem; margin-top:0.25rem;">Consulta los artículos comprados, dirección de entrega y gestiona los estados de envío y pago.</p>
        </div>
        <button class="btn-primary" onclick="loadAdminOrders()" style="padding:0.4rem 0.8rem; font-size:0.85rem;">🔄 Actualizar</button>
      </div>
      <div style="overflow-x:auto;">
        <table style="width:100%; border-collapse:collapse; text-align:left;">
          <thead>
            <tr style="border-bottom:2px solid var(--border); font-size:0.85rem; text-transform:uppercase; color:var(--muted);">
              <th style="padding:0.75rem;">ID</th>
              <th style="padding:0.75rem;">Cliente</th>
              <th style="padding:0.75rem;">Total</th>
              <th style="padding:0.75rem;">Método</th>
              <th style="padding:0.75rem;">Estado Pedido</th>
              <th style="padding:0.75rem;">Estado Pago</th>
              <th style="padding:0.75rem; text-align:center;">Acciones</th>
            </tr>
          </thead>
          <tbody id="orders-table-body">
            <tr><td colspan="7" style="padding:1.5rem; text-align:center; color:var(--muted);">Cargando pedidos...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Modal de Detalles del Pedido -->
    <div id="order-detail-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.65); z-index:1000; align-items:center; justify-content:center; backdrop-filter:blur(3px);">
      <div style="background:var(--card-bg, #1e293b); color:var(--text, #f8fafc); border:1px solid var(--border, #334155); border-radius:12px; max-width:750px; width:92%; max-height:90vh; overflow-y:auto; padding:1.75rem; box-shadow:0 20px 25px -5px rgba(0,0,0,0.5);">
        
        <div style="display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid var(--border, #334155); padding-bottom:1rem; margin-bottom:1.25rem;">
          <div>
            <h3 style="margin:0; font-size:1.3rem; display:flex; align-items:center; gap:0.5rem;">
              <span>📦 Pedido</span>
              <code id="modal-order-id" style="color:#38bdf8;">#---</code>
            </h3>
            <div id="modal-order-date" style="font-size:0.8rem; color:var(--muted, #94a3b8); margin-top:0.3rem;">--</div>
          </div>
          <button onclick="closeOrderDetailModal()" style="background:none; border:none; font-size:1.5rem; cursor:pointer; color:var(--muted, #94a3b8); line-height:1;">&times;</button>
        </div>

        <!-- Badges de estado -->
        <div style="display:flex; gap:0.75rem; margin-bottom:1.5rem; flex-wrap:wrap;">
          <div>
            <span style="font-size:0.75rem; color:var(--muted, #94a3b8); display:block; margin-bottom:0.2rem;">Estado del Pedido</span>
            <span id="modal-order-status" class="tag">--</span>
          </div>
          <div>
            <span style="font-size:0.75rem; color:var(--muted, #94a3b8); display:block; margin-bottom:0.2rem;">Estado del Pago</span>
            <span id="modal-payment-status" class="tag">--</span>
          </div>
          <div>
            <span style="font-size:0.75rem; color:var(--muted, #94a3b8); display:block; margin-bottom:0.2rem;">Método de Pago</span>
            <span id="modal-payment-method" style="font-weight:600; font-size:0.9rem;">--</span>
          </div>
        </div>

        <!-- Grid Cliente y Envío -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:1.25rem; margin-bottom:1.5rem; background:rgba(255,255,255,0.03); padding:1rem; border-radius:8px; border:1px solid var(--border, #334155);">
          <div>
            <h4 style="margin:0 0 0.5rem 0; font-size:0.9rem; color:#38bdf8; text-transform:uppercase;">👤 Datos del Cliente</h4>
            <div style="font-size:0.85rem; line-height:1.5;">
              <div><strong>Nombre:</strong> <span id="modal-customer-name">--</span></div>
              <div><strong>Email:</strong> <span id="modal-customer-email">--</span></div>
              <div><strong>Teléfono:</strong> <span id="modal-customer-phone">--</span></div>
            </div>
          </div>
          <div>
            <h4 style="margin:0 0 0.5rem 0; font-size:0.9rem; color:#38bdf8; text-transform:uppercase;">📍 Dirección de Envío</h4>
            <div style="font-size:0.85rem; line-height:1.5;">
              <div><strong>Dirección:</strong> <span id="modal-shipping-address">--</span></div>
              <div><strong>Municipio / Dpto:</strong> <span id="modal-shipping-city">--</span></div>
              <div id="modal-shipping-notes-wrap" style="display:none; color:#f59e0b;">
                <strong>Notas:</strong> <span id="modal-shipping-notes">--</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Artículos Comprados -->
        <h4 style="margin:0 0 0.75rem 0; font-size:0.95rem; text-transform:uppercase; letter-spacing:0.05em;">🛍️ Artículos Comprados</h4>
        <div style="overflow-x:auto; margin-bottom:1.5rem; border:1px solid var(--border, #334155); border-radius:8px;">
          <table style="width:100%; border-collapse:collapse; font-size:0.85rem;">
            <thead>
              <tr style="background:rgba(255,255,255,0.05); border-bottom:1px solid var(--border, #334155); text-align:left;">
                <th style="padding:0.6rem 0.75rem;">Producto</th>
                <th style="padding:0.6rem 0.75rem;">SKU</th>
                <th style="padding:0.6rem 0.75rem; text-align:center;">Cant.</th>
                <th style="padding:0.6rem 0.75rem; text-align:right;">Precio Unit.</th>
                <th style="padding:0.6rem 0.75rem; text-align:right;">Subtotal</th>
              </tr>
            </thead>
            <tbody id="modal-order-lines-body">
              <!-- Se inyecta dinámicamente -->
            </tbody>
          </table>
        </div>

        <!-- Desglose Financiero -->
        <div style="display:flex; justify-content:flex-end; margin-bottom:1.5rem;">
          <div style="width:260px; font-size:0.85rem; line-height:1.7;">
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--muted, #94a3b8);">Subtotal:</span>
              <strong id="modal-subtotal">$0</strong>
            </div>
            <div style="display:flex; justify-content:space-between;" id="modal-discount-row">
              <span style="color:var(--muted, #94a3b8);">Descuento:</span>
              <span id="modal-discount" style="color:#ef4444;">-$0</span>
            </div>
            <div style="display:flex; justify-content:space-between;">
              <span style="color:var(--muted, #94a3b8);">Envío:</span>
              <span id="modal-shipping-cost">$0</span>
            </div>
            <div style="display:flex; justify-content:space-between; border-top:1px solid var(--border, #334155); padding-top:0.4rem; font-size:1.05rem; margin-top:0.3rem;">
              <strong>Total a Pagar:</strong>
              <strong id="modal-total" style="color:#38bdf8;">$0</strong>
            </div>
          </div>
        </div>

        <!-- Acciones del pedido en el modal -->
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid var(--border, #334155); padding-top:1rem; flex-wrap:wrap; gap:0.75rem;">
          <div style="display:flex; align-items:center; gap:0.5rem;">
            <label style="font-size:0.85rem; color:var(--muted, #94a3b8);">Cambiar Estado:</label>
            <select id="modal-change-status-select" style="padding:0.35rem 0.6rem; border:1px solid var(--border, #334155); border-radius:5px; background:var(--input-bg, #0f172a); color:inherit; font-size:0.85rem;">
              <option value="confirmed">Confirmado</option>
              <option value="shipped">Enviado</option>
              <option value="delivered">Entregado</option>
              <option value="cancelled">Cancelado</option>
            </select>
            <button onclick="applyModalStatusChange()" class="btn-primary" style="padding:0.35rem 0.75rem; font-size:0.85rem;">Guardar</button>
          </div>
          <button onclick="closeOrderDetailModal()" style="padding:0.4rem 1rem; background:transparent; border:1px solid var(--border, #334155); border-radius:5px; color:inherit; cursor:pointer; font-size:0.85rem;">Cerrar</button>
        </div>

      </div>
    </div>
  `;
}
