export function getCheckoutCarrierAvailabilityScript(): string {
  return String.raw`      const selectedZoneRequiresCarrier = () => selectedZone()?.dataset.type === 'national';
      function updateSubmitAvailability() {
        const hasVerifiedLocation = Boolean(document.getElementById('addr-dane-code').value);
        document.getElementById('btn-submit-order').disabled = !zonePolicyAllowsOrder || !hasVerifiedLocation ||
          (selectedZoneRequiresCarrier() && (!carrierAvailabilityLoaded || !carrierIntegrationEnabled || !selectedCarrierQuoteId));
      }
      async function loadCarrierAvailability() {
        try {
          const response = await fetch('/api/v1/shipping/carrier/availability');
          const result = await response.json();
          if (!response.ok || result.success === false) throw new Error(result.error || 'No se pudo validar MiPaquete.');
          carrierIntegrationEnabled = Boolean(result.enabled);
          carrierAvailabilityLoaded = true;
          if (selectedZoneRequiresCarrier() && !carrierIntegrationEnabled) {
            setCheckoutStatus('MiPaquete no está disponible ahora. Selecciona una zona de entrega local o intenta más tarde.', 'error');
            updateSubmitAvailability();
            return;
          }
          if (document.getElementById('dest-zone').value) handleZoneChange();
        } catch {
          carrierIntegrationEnabled = false;
          carrierAvailabilityLoaded = true;
          if (selectedZoneRequiresCarrier()) {
            setCheckoutStatus('No se pudo validar la disponibilidad de MiPaquete. El pedido sigue bloqueado; intenta más tarde o selecciona una zona local.', 'error');
          }
          updateSubmitAvailability();
        }
      }
      loadCarrierAvailability();`;
}
