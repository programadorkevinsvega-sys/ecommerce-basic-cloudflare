export function renderPaymentRecordDetailsScript(): string {
  return `
    function viewCodCollection(button) {
      const row = _adminPaymentCollections.find(item => item.id === button.dataset.collectionId);
      if (!row) return;
      showPaymentRecord('Recaudo contra entrega', [
        ['Pedido', row.orderId], ['Recibo / guía', row.receiptNumber || '—'],
        ['Monto recibido', paymentMoney(row.amountInCents)], ['Fecha', new Date(row.collectedAt || row.createdAt).toLocaleString('es-CO')],
        ['Registrado por', row.collectedBy || '—'], ['Notas', row.notes || '—'],
      ]);
    }

    function viewPaymentSettlement(button) {
      const row = _adminPaymentSettlements.find(item => item.orderId === button.dataset.settlementOrder);
      if (!row) return;
      showPaymentRecord('Conciliación de Wompi', [
        ['Pedido', row.orderId], ['Comisión estimada', paymentMoney(row.estimatedFeeCents)],
        ['Comisión real', paymentMoney(row.actualFeeCents)], ['Diferencia', paymentMoney(row.varianceCents)],
        ['Referencia del reporte', row.reportReference], ['Registrado por', row.recordedBy || '—'],
        ['Fecha', new Date(row.recordedAt).toLocaleString('es-CO')],
        ...(row.corrected ? [['Correcciones registradas', String(row.correctionCount || 0)], ['Motivo de la última corrección', row.correctionReason || '—']] : []),
      ]);
    }

    function showPaymentRecord(title, fields) {
      const dialog = document.getElementById('payment-record-details');
      const heading = document.getElementById('payment-detail-title');
      const list = document.getElementById('payment-detail-fields');
      if (!dialog || !heading || !list) return;
      heading.textContent = title;
      list.replaceChildren();
      fields.forEach(([label, value]) => {
        const row = document.createElement('div');
        const term = document.createElement('dt'); term.textContent = label;
        const detail = document.createElement('dd'); detail.textContent = String(value ?? '—');
        row.append(term, detail); list.append(row);
      });
      dialog.showModal();
    }

    function paymentMoney(cents) { return '$' + (Number(cents || 0) / 100).toLocaleString('es-CO') + ' COP'; }
  `;
}
