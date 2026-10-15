export function renderOrderTrackingAdminScript(): string {
  return `
    let trackingAdminPage = 1;
    let trackingAdminTotal = 0;
    let trackingAdminItems = [];
    let trackingAdminTimer;
    let trackingEditingStatus = '';
    let labelPage = 1; let labelItems = []; let labelTotal = 0;
    async function loadShipmentLabels(page = labelPage) {
      labelPage = page; const body = document.getElementById('shipment-label-body'); if (!body) return;
      const params = new URLSearchParams({ page: String(page), pageSize: '10' });
      try { const response = await fetch('/api/v1/admin/shipping/mipaquete/labels?' + params);
        const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudieron cargar las guías');
        labelItems = data.items || []; labelTotal = data.total || 0;
        body.innerHTML = labelItems.length ? labelItems.map((item) => '<tr><td>#' + escapeHtml(item.orderId) + '</td><td>' + escapeHtml(item.carrierName || 'MiPaquete') + '</td><td>' + escapeHtml(item.guideNumber || item.mipaqueteCode || 'Pendiente') + '</td><td>' + (item.printedAt ? 'Impresa · ' + escapeHtml(new Date(item.printedAt).toLocaleString('es-CO')) : 'Pendiente') + '</td><td><div class="shipping-row-actions">' + (item.guideUrl ? '<button class="shipping-action" type="button" data-print-id="' + escapeHtml(item.id) + '">Abrir guía</button>' : '') + (!item.printedAt && item.guideUrl ? '<button class="shipping-action" type="button" data-mark-id="' + escapeHtml(item.id) + '">Marcar impresa</button>' : '') + '</div></td></tr>').join('') : '<tr><td colspan="5" class="shipping-empty">Aún no hay guías registradas.</td></tr>';
        body.querySelectorAll('[data-print-id]').forEach((button) => button.addEventListener('click', () => { const item = labelItems.find((entry) => entry.id === button.dataset.printId); if (item) window.open(item.guideUrl, '_blank', 'noopener'); }));
        body.querySelectorAll('[data-mark-id]').forEach((button) => button.addEventListener('click', () => markShipmentPrinted(button.dataset.markId)));
        const pager = document.getElementById('shipment-label-pagination'); const pages = Math.max(1, Math.ceil(labelTotal / 10));
        pager.querySelector('span').textContent = (labelTotal ? (page - 1) * 10 + 1 : 0) + '–' + Math.min(page * 10, labelTotal) + ' de ' + labelTotal + ' · Página ' + page + ' de ' + pages;
        pager.querySelector('[data-page-direction="previous"]').disabled = page <= 1; pager.querySelector('[data-page-direction="next"]').disabled = page >= pages;
      } catch (error) { body.innerHTML = '<tr><td colspan="5" class="shipping-empty">' + escapeHtml(error.message || 'Error al cargar guías') + '</td></tr>'; }
    }
    async function markShipmentPrinted(id) { const response = await fetch('/api/v1/admin/shipping/mipaquete/' + encodeURIComponent(id) + '/printed', { method: 'POST', headers: adminHeaders(true) }); if (!response.ok) { alert('No se pudo registrar la impresión'); return; } await loadShipmentLabels(labelPage); }
    async function printUnprintedGuideBatch() { const unprinted = labelItems.filter((item) => !item.printedAt && item.guideUrl); if (!unprinted.length) { alert('No hay guías pendientes de impresión en esta página.'); return; } unprinted.forEach((item) => window.open(item.guideUrl, '_blank', 'noopener')); if (confirm('¿Confirmas que imprimiste las ' + unprinted.length + ' guías abiertas?')) { for (const item of unprinted) await markShipmentPrinted(item.id); } }
    const trackingStatusLabels = {placed:'Recibido',confirmed:'Confirmado',prepared:'Preparado',shipped:'Enviado',delivered:'Entregado',cancelled:'Cancelado'};
    async function loadAdminOrderTracking(page = trackingAdminPage) {
      trackingAdminPage = page;
      const body = document.getElementById('order-tracking-admin-body');
      if (!body) return;
      body.innerHTML = '<tr><td colspan="5" class="shipping-empty">Cargando pedidos…</td></tr>';
      const params = new URLSearchParams({ page: String(page), pageSize: '10', q: document.getElementById('tracking-admin-query').value.trim(), status: document.getElementById('tracking-admin-status').value });
      try {
        const response = await fetch('/api/v1/admin/orders/tracking?' + params);
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'No se pudo cargar el seguimiento');
        trackingAdminItems = data.items || []; trackingAdminTotal = data.total || 0;
        renderAdminOrderTracking();
      } catch (error) { body.innerHTML = '<tr><td colspan="5" class="shipping-empty">' + escapeHtml(error.message || 'Error al cargar pedidos') + '</td></tr>'; }
    }
    function renderAdminOrderTracking() {
      const body = document.getElementById('order-tracking-admin-body');
      body.innerHTML = trackingAdminItems.length ? trackingAdminItems.map((item) => '<tr><td><strong>#' + escapeHtml(item.orderId) + '</strong><small>' + escapeHtml(item.customerName) + '</small><small>' + escapeHtml(item.customerEmail) + '</small></td><td><span class="shipping-badge neutral">' + escapeHtml(trackingStatusLabels[item.status] || item.status) + '</span></td><td>' + escapeHtml(item.shippingCarrier || '—') + '<small>' + escapeHtml(item.shippingTrackingNumber || 'Sin guía') + '</small></td><td>' + escapeHtml(item.estimatedDeliveryDate || (item.minEstimatedDays != null ? item.minEstimatedDays + '–' + item.maxEstimatedDays + ' días hábiles' : 'No definida')) + '</td><td><div class="shipping-row-actions"><button class="shipping-action primary" type="button" data-order-id="' + encodeURIComponent(item.orderId) + '">Gestionar</button></div></td></tr>').join('') : '<tr><td colspan="5" class="shipping-empty">No hay pedidos que coincidan con la búsqueda.</td></tr>';
      body.querySelectorAll('[data-order-id]').forEach((button) => button.addEventListener('click', () => openOrderTrackingEditor(button.dataset.orderId)));
      const pager = document.getElementById('order-tracking-admin-pagination');
      const totalPages = Math.max(1, Math.ceil(trackingAdminTotal / 10));
      const from = trackingAdminTotal ? (trackingAdminPage - 1) * 10 + 1 : 0;
      pager.querySelector('span').textContent = from + '–' + Math.min(trackingAdminPage * 10, trackingAdminTotal) + ' de ' + trackingAdminTotal + ' · Página ' + trackingAdminPage + ' de ' + totalPages;
      pager.querySelector('[data-page-direction="previous"]').disabled = trackingAdminPage <= 1;
      pager.querySelector('[data-page-direction="next"]').disabled = trackingAdminPage >= totalPages;
    }
    async function openOrderTrackingEditor(encodedId) {
      const orderId = decodeURIComponent(encodedId);
      const response = await fetch('/api/v1/admin/orders/tracking/' + encodeURIComponent(orderId));
      const data = await response.json();
      if (!response.ok || !data.success) { alert(data.error || 'No se pudo abrir el seguimiento'); return; }
      const item = data.tracking;
      document.getElementById('tracking-edit-order-id').value = item.orderId;
      document.getElementById('tracking-edit-customer').textContent = item.customerName + ' · ' + item.customerEmail;
      document.getElementById('tracking-edit-carrier').value = item.shippingCarrier || '';
      document.getElementById('tracking-edit-number').value = item.shippingTrackingNumber || '';
      document.getElementById('tracking-edit-url').value = item.shippingTrackingUrl || '';
      document.getElementById('tracking-edit-date').value = item.estimatedDeliveryDate || '';
      trackingEditingStatus = item.status;
      document.getElementById('tracking-edit-status').value = item.status;
      document.getElementById('tracking-edit-status-note').value = '';
      const events = item.events.reduce((history, event) => {
        if (history.length && history[history.length - 1].status === event.status) history[history.length - 1] = event;
        else history.push(event);
        return history;
      }, []);
      document.getElementById('tracking-edit-timeline').innerHTML = events.map((event) => '<li><strong>' + escapeHtml(trackingStatusLabels[event.status] || event.status) + '</strong><time>' + escapeHtml(new Date(event.createdAt).toLocaleString('es-CO')) + '</time></li>').join('') || '<li>Sin cambios de estado registrados.</li>';
      document.getElementById('tracking-edit-message').textContent = '';
      updateOrderTrackingStatusActionState();
      document.getElementById('order-tracking-edit-dialog').showModal();
    }
    function closeOrderTrackingEditor() { document.getElementById('order-tracking-edit-dialog')?.close(); }
    function updateOrderTrackingStatusActionState() {
      const button = document.getElementById('tracking-edit-status-submit');
      const sameStatus = document.getElementById('tracking-edit-status')?.value === trackingEditingStatus;
      if (button) { button.disabled = sameStatus; button.title = sameStatus ? 'Este estado ya está aplicado' : ''; }
    }
    async function saveOrderTrackingStatus() {
      const orderId = document.getElementById('tracking-edit-order-id').value;
      const message = document.getElementById('tracking-edit-message');
      if (document.getElementById('tracking-edit-status').value === trackingEditingStatus) {
        message.textContent = 'Selecciona un estado diferente para registrar el cambio.';
        return;
      }
      try {
        const response = await fetch('/api/v1/admin/orders/' + encodeURIComponent(orderId) + '/status', { method: 'PATCH', headers: adminHeaders(true), body: JSON.stringify({ status: document.getElementById('tracking-edit-status').value, note: document.getElementById('tracking-edit-status-note').value.trim() || undefined }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudo actualizar el estado');
        await openOrderTrackingEditor(encodeURIComponent(orderId)); await loadAdminOrderTracking(trackingAdminPage);
      } catch (error) { message.textContent = error.message || 'Error al actualizar el estado'; }
    }
    async function createMiPaqueteGuide() {
      const orderId = document.getElementById('tracking-edit-order-id').value;
      const message = document.getElementById('tracking-edit-message');
      const button = document.querySelector('[onclick="createMiPaqueteGuide()"]');
      button.disabled = true; message.textContent = 'Consultando configuración y creando o recuperando la guía…';
      try {
        let response = await fetch('/api/v1/admin/orders/' + encodeURIComponent(orderId) + '/mipaquete', { method: 'POST', headers: adminHeaders(true) });
        let data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudo generar la guía');
        if (data.shipment?.id && data.shipment?.mipaqueteCode) {
          response = await fetch('/api/v1/admin/shipping/mipaquete/' + encodeURIComponent(data.shipment.id) + '/sync', { method: 'POST', headers: adminHeaders(true) });
          const synced = await response.json(); if (response.ok && synced.shipment) data.shipment = synced.shipment;
        }
        const shipment = data.shipment;
        message.innerHTML = 'Guía ' + escapeHtml(shipment.guideNumber || shipment.mipaqueteCode || 'creada') +
          (shipment.guideUrl ? ' · <a href="' + escapeHtml(shipment.guideUrl) + '" target="_blank" rel="noopener">Abrir PDF</a>' : '') +
          (shipment.pickupCode ? ' · Recolección: ' + escapeHtml(shipment.pickupCode) : '');
        await loadAdminOrderTracking(trackingAdminPage);
      } catch (error) { message.textContent = error.message || 'Error al generar guía'; }
      finally { button.disabled = false; }
    }
    document.getElementById('order-tracking-edit-form')?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const form = event.currentTarget; const button = form.querySelector('[type="submit"]'); button.disabled = true;
      const orderId = document.getElementById('tracking-edit-order-id').value;
      const message = document.getElementById('tracking-edit-message');
      try {
        const response = await fetch('/api/v1/admin/orders/tracking/' + encodeURIComponent(orderId) + '/shipping', { method: 'PATCH', headers: adminHeaders(true), body: JSON.stringify({ shippingCarrier: document.getElementById('tracking-edit-carrier').value.trim() || null, shippingTrackingNumber: document.getElementById('tracking-edit-number').value.trim() || null, shippingTrackingUrl: document.getElementById('tracking-edit-url').value.trim() || null, estimatedDeliveryDate: document.getElementById('tracking-edit-date').value || null }) });
        const data = await response.json(); if (!response.ok) throw new Error(data.error || 'No se pudo guardar');
        closeOrderTrackingEditor(); await loadAdminOrderTracking(trackingAdminPage);
      } catch (error) { message.textContent = error.message || 'Error al guardar'; }
      finally { button.disabled = false; }
    });
    document.getElementById('tracking-admin-query')?.addEventListener('input', () => { clearTimeout(trackingAdminTimer); trackingAdminTimer = setTimeout(() => loadAdminOrderTracking(1), 250); });
    document.getElementById('tracking-admin-status')?.addEventListener('change', () => loadAdminOrderTracking(1));
    document.getElementById('order-tracking-admin-pagination')?.querySelector('[data-page-direction="previous"]')?.addEventListener('click', () => loadAdminOrderTracking(Math.max(1, trackingAdminPage - 1)));
    document.getElementById('order-tracking-admin-pagination')?.querySelector('[data-page-direction="next"]')?.addEventListener('click', () => loadAdminOrderTracking(trackingAdminPage + 1));
    document.getElementById('shipment-label-pagination')?.querySelector('[data-page-direction="previous"]')?.addEventListener('click', () => loadShipmentLabels(Math.max(1, labelPage - 1)));
    document.getElementById('shipment-label-pagination')?.querySelector('[data-page-direction="next"]')?.addEventListener('click', () => loadShipmentLabels(labelPage + 1));
    loadShipmentLabels();
    window.loadAdminOrderTracking = loadAdminOrderTracking;
    window.openOrderTrackingEditor = openOrderTrackingEditor;
    window.closeOrderTrackingEditor = closeOrderTrackingEditor;
    window.saveOrderTrackingStatus = saveOrderTrackingStatus;
    window.createMiPaqueteGuide = createMiPaqueteGuide;
    window.updateOrderTrackingStatusActionState = updateOrderTrackingStatusActionState;
  `;
}
