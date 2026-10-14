export function renderInvoicingAdminScript(): string {
  return `
    let _activeCnInvoiceId = null;
    let _adminInvoices = [];

    async function loadAdminInvoices() {
      const tbody = document.getElementById('invoices-table-body');
      if (!tbody) return;
      try {
        const response = await fetch('/api/v1/admin/invoices', { headers: adminHeaders() });
        const data = await response.json();
        if (!data.success || !Array.isArray(data.invoices)) throw new Error('No se pudieron cargar las facturas');
        _adminInvoices = data.invoices;
        filterAdminInvoices();
      } catch {
        tbody.innerHTML = '<tr><td colspan="7" class="invoices-empty error">Error al cargar facturas.</td></tr>';
      }
    }

    function filterAdminInvoices() {
      const tbody = document.getElementById('invoices-table-body');
      if (!tbody) return;
      const query = normalizeInvoiceSearch(document.getElementById('invoices-search')?.value || '');
      const digits = query.replace(/\\D/g, '');
      const invoices = _adminInvoices.filter(invoice => {
        const total = Math.round(Number(invoice.totalCents || 0) / 100);
        const exactTotal = (Number(invoice.totalCents || 0) / 100).toLocaleString('es-CO', { maximumFractionDigits: 2 });
        const haystack = normalizeInvoiceSearch([invoice.invoiceNumber, invoice.orderId, invoice.customerName, invoice.customerEmail, total.toLocaleString('es-CO'), exactTotal].join(' '));
        return !query || haystack.includes(query) || (digits.length > 0 && (String(total).includes(digits) || exactTotal.replace(/\\D/g, '').includes(digits)));
      });
      tbody.innerHTML = invoices.length
        ? invoices.map(renderInvoiceRow).join('')
        : '<tr><td colspan="7" class="invoices-empty">No hay facturas que coincidan con la búsqueda.</td></tr>';
    }

    function normalizeInvoiceSearch(value) {
      return String(value).normalize('NFD').replace(/[\\u0300-\\u036f]/g, '').toLowerCase().trim();
    }

    function renderInvoiceRow(invoice) {
      const actions = '<a class="invoice-action primary" href="/api/v1/invoices/' + encodeURIComponent(invoice.id) + '/document?view=1" target="_blank" rel="noopener noreferrer">Ver PDF</a>' +
        '<a class="invoice-action" href="/api/v1/invoices/' + encodeURIComponent(invoice.id) + '/document">Descargar</a>' +
        (invoice.status === 'issued' ? '<button class="invoice-action danger" onclick="openCreditNoteModal(' + escapeHtml(JSON.stringify(String(invoice.id))) + ', ' + escapeHtml(JSON.stringify(String(invoice.invoiceNumber))) + ', ' + Number(invoice.totalCents) + ')">Nota crédito</button>' : '');
      return '<tr><td><strong class="invoice-number">' + escapeHtml(invoice.invoiceNumber) + '</strong></td>' +
        '<td><code>#' + escapeHtml(invoice.orderId.replace('ord-', '')) + '</code></td>' +
        '<td><div class="invoice-client"><strong>' + escapeHtml(invoice.customerName) + '</strong><small>' + escapeHtml(invoice.customerEmail) + '</small></div></td>' +
        '<td><strong class="invoice-total">$' + Math.round(Number(invoice.totalCents) / 100).toLocaleString('es-CO') + '</strong></td>' +
        '<td><span class="invoice-status ' + (invoice.status === 'issued' ? 'issued' : 'other') + '">' + escapeHtml(invoice.status) + '</span></td>' +
        '<td>' + escapeHtml(new Date(invoice.createdAt).toLocaleString('es-CO')) + '</td><td><div class="invoice-actions">' + actions + '</div></td></tr>';
    }

    function openCreditNoteModal(invoiceId, invoiceNumber, totalCents) {
      _activeCnInvoiceId = invoiceId;
      document.getElementById('cn-modal-invoice-num').innerText = 'Factura: #' + invoiceNumber;
      window.setCopInputValue('cn-amount', Math.round(totalCents / 100));
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
      const amountInCents = window.copPesosToCents('cn-amount');
      if (!reason || !Number.isSafeInteger(amountInCents) || amountInCents <= 0) return alert('Por favor indica motivo y monto válido');
      const response = await fetch('/api/v1/admin/invoices/' + _activeCnInvoiceId + '/credit-notes', {
        method: 'POST', headers: adminHeaders(true), body: JSON.stringify({ reason, amountInCents }),
      });
      if (response.ok) {
        alert('¡Nota crédito emitida con éxito!');
        closeCreditNoteModal();
        loadAdminInvoices();
      } else {
        const error = await response.json().catch(() => ({}));
        alert('Error: ' + (error.error || 'No se pudo emitir la nota crédito'));
      }
    }

    window.loadAdminInvoices = loadAdminInvoices;
    window.filterAdminInvoices = filterAdminInvoices;
    window.openCreditNoteModal = openCreditNoteModal;
    window.closeCreditNoteModal = closeCreditNoteModal;
    window.submitCreditNote = submitCreditNote;
  `;
}
