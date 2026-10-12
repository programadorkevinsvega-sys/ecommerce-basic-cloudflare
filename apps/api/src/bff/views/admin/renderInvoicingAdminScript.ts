export function renderInvoicingAdminScript(): string {
  return `
    let _activeCnInvoiceId = null;

    async function loadAdminInvoices() {
      const tbody = document.getElementById('invoices-table-body');
      if (!tbody) return;
      try {
        const res = await fetch('/api/v1/admin/invoices', { headers: adminHeaders() });
        const data = await res.json();
        if (!data.success || !data.invoices || data.invoices.length === 0) {
          tbody.innerHTML = '<tr><td colspan="7" style="padding:1.5rem; text-align:center; color:var(--muted);">No hay facturas emitidas</td></tr>';
          return;
        }

        tbody.innerHTML = data.invoices.map(inv => \`
          <tr style="border-bottom:1px solid var(--border);">
            <td style="padding:0.75rem;"><strong style="color:#38bdf8;">\${inv.invoiceNumber}</strong></td>
            <td style="padding:0.75rem;"><code>#\${inv.orderId.replace('ord-', '')}</code></td>
            <td style="padding:0.75rem;"><strong>\${escapeHtml(inv.customerName)}</strong><br><small style="color:var(--muted);">\${escapeHtml(inv.customerEmail)}</small></td>
            <td style="padding:0.75rem; font-weight:700;">$\${(inv.totalCents/100).toLocaleString('es-CO')}</td>
            <td style="padding:0.75rem;"><span class="tag" style="background:\${inv.status === 'issued' ? '#14532d' : '#7f1d1d'}; color:#fff;">\${inv.status}</span></td>
            <td style="padding:0.75rem; font-size:0.85rem; color:var(--muted);">\${new Date(inv.createdAt).toLocaleString('es-CO')}</td>
            <td style="padding:0.75rem; text-align:center;">
              <div style="display:flex; gap:0.4rem; justify-content:center;">
                <a href="/api/v1/invoices/\${inv.id}/document" target="_blank"
                  style="display:inline-block; padding:0.35rem 0.65rem; background:#0284c7; color:#fff; border-radius:5px; text-decoration:none; font-size:0.8rem; font-weight:600;">
                  👁️ Ver Doc
                </a>
                \${inv.status === 'issued' ? \`
                  <button onclick="openCreditNoteModal('\${inv.id}', '\${inv.invoiceNumber}', \${inv.totalCents})"
                    style="padding:0.35rem 0.65rem; background:#7f1d1d; border:none; border-radius:5px; color:#fff; font-size:0.8rem; cursor:pointer; font-weight:600;">
                    Nota Crédito
                  </button>
                \` : ''}
              </div>
            </td>
          </tr>
        \`).join('');
      } catch (e) {
        tbody.innerHTML = '<tr><td colspan="7" style="padding:1.5rem; text-align:center; color:#dc2626;">Error al cargar facturas</td></tr>';
      }
    }

    function openCreditNoteModal(invoiceId, invoiceNumber, totalCents) {
      _activeCnInvoiceId = invoiceId;
      document.getElementById('cn-modal-invoice-num').innerText = 'Factura: #' + invoiceNumber;
      document.getElementById('cn-amount').value = totalCents;
      document.getElementById('cn-reason').value = '';
      document.getElementById('credit-note-modal').style.display = 'flex';
    }

    function closeCreditNoteModal() {
      document.getElementById('credit-note-modal').style.display = 'none';
      _activeCnInvoiceId = null;
    }

    async function submitCreditNote() {
      if (!_activeCnInvoiceId) return;
      const reason = document.getElementById('cn-reason').value.trim();
      const amount = parseInt(document.getElementById('cn-amount').value, 10);
      if (!reason || isNaN(amount) || amount <= 0) {
        alert('Por favor indica motivo y monto válido');
        return;
      }

      const res = await fetch('/api/v1/admin/invoices/' + _activeCnInvoiceId + '/credit-notes', {
        method: 'POST',
        headers: adminHeaders(true),
        body: JSON.stringify({ reason, amountInCents: amount })
      });

      if (res.ok) {
        alert('¡Nota crédito emitida con éxito!');
        closeCreditNoteModal();
        loadAdminInvoices();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Error: ' + (err.error || 'No se pudo emitir la nota crédito'));
      }
    }

    window.loadAdminInvoices = loadAdminInvoices;
    window.openCreditNoteModal = openCreditNoteModal;
    window.closeCreditNoteModal = closeCreditNoteModal;
    window.submitCreditNote = submitCreditNote;
  `;
}
