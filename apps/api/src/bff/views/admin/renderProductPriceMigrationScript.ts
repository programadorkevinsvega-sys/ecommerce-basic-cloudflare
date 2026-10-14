export function renderProductPriceMigrationScript(): string {
  return `
    async function previewLegacyPriceMigration() {
      const panel = document.getElementById('legacy-price-preview');
      panel.textContent = 'Calculando vista previa…';
      const response = await fetch('/api/v1/admin/products/pricing-migration/preview', { method: 'POST', headers: adminHeaders(true) });
      const result = await response.json();
      if (!response.ok) { panel.textContent = result.error || 'No fue posible previsualizar.'; return; }
      const preview = result.data;
      panel.replaceChildren();
      const heading = document.createElement('p');
      heading.textContent = preview.legacyProductCount + ' productos · IVA configurado: ' + (preview.taxRateBasisPoints / 100) + '%';
      panel.appendChild(heading);
      const table = document.createElement('table');
      table.innerHTML = '<thead><tr><th>Producto</th><th>Precio actual</th><th>Nuevo precio final</th></tr></thead>';
      const body = document.createElement('tbody');
      preview.products.forEach((item) => {
        const row = document.createElement('tr');
        [item.name, item.previousPriceCents, item.finalPriceCents].forEach((value, index) => {
          const cell = document.createElement(index ? 'td' : 'th');
          cell.textContent = index ? '$' + Math.round(Number(value) / 100).toLocaleString('es-CO') : String(value);
          row.appendChild(cell);
        });
        body.appendChild(row);
      });
      table.appendChild(body); panel.appendChild(table);
      const apply = document.createElement('button');
      apply.type = 'button'; apply.className = 'btn-primary'; apply.textContent = 'Aplicar esta conversión';
      apply.onclick = async () => {
        if (!confirm('¿Convertir ' + preview.legacyProductCount + ' precios? Se conservará cada precio previo y los pedidos/facturas existentes no cambiarán.')) return;
        const saved = await fetch('/api/v1/admin/products/pricing-migration/apply', { method: 'POST', headers: adminHeaders(true), body: JSON.stringify({ expectedCount: preview.legacyProductCount, fingerprint: preview.fingerprint }) });
        const payload = await saved.json();
        if (!saved.ok) { alert(payload.error || 'No se pudo completar la conversión'); return; }
        alert(payload.migratedCount + ' productos convertidos'); window.location.reload();
      };
      panel.appendChild(apply);
    }
    window.previewLegacyPriceMigration = previewLegacyPriceMigration;
  `;
}
