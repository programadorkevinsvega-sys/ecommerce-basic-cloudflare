export function renderOrderTrackingAdminShipmentScript(): string {
  return `
    const shipmentStatusLabels = {creation_pending:'Pendiente de confirmación',created:'Guía creada',in_transit:'En tránsito',delivered:'Entregado por transportadora',exception:'Novedad de transportadora',cancelled:'Guía cancelada'};
    function renderMiPaqueteShipment(shipment) {
      const state = document.getElementById('tracking-shipment-status');
      const provider = document.getElementById('tracking-shipment-provider-status');
      const button = document.querySelector('[data-tracking-action="create-guide"]');
      if (!shipment) {
        state.textContent = 'Sin guía registrada';
        provider.textContent = 'No hay una guía de MiPaquete asociada a este pedido.';
        button.textContent = 'Generar guía MiPaquete';
        return;
      }
      state.textContent = shipmentStatusLabels[shipment.status] || shipment.status || 'Estado desconocido';
      provider.textContent = shipment.status === 'creation_pending'
        ? 'MiPaquete aún no confirma la solicitud. Puedes consultar la guía pendiente; no se enviará una creación duplicada.'
        : (shipment.providerStatus || (shipment.lastSyncedAt ? 'Última consulta: ' + new Date(shipment.lastSyncedAt).toLocaleString('es-CO') : 'Estado informado por MiPaquete.'));
      button.textContent = shipment.status === 'creation_pending' ? 'Consultar guía pendiente' : 'Consultar guía MiPaquete';
      if (shipment.carrierName) document.getElementById('tracking-edit-carrier').value = shipment.carrierName;
      if (shipment.guideNumber) document.getElementById('tracking-edit-number').value = shipment.guideNumber;
      if (shipment.guideUrl) document.getElementById('tracking-edit-url').value = shipment.guideUrl;
    }
    async function loadMiPaqueteShipment(orderId) {
      const state = document.getElementById('tracking-shipment-status');
      const provider = document.getElementById('tracking-shipment-provider-status');
      state.textContent = 'Consultando…'; provider.textContent = '';
      try {
        const response = await fetch('/api/v1/admin/shipping/mipaquete/orders/' + encodeURIComponent(orderId));
        const data = await response.json();
        if (!response.ok || !data.success) throw new Error(data.error || 'No se pudo consultar la guía');
        renderMiPaqueteShipment(data.shipment);
      } catch (error) {
        state.textContent = 'No se pudo consultar';
        provider.textContent = error.message || 'Error al consultar el estado de la guía.';
      }
    }
  `;
}
