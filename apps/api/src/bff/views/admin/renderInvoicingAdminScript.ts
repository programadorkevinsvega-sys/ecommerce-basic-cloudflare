export function renderInvoicingAdminScript(): string {
  return `
    let _activeCnInvoiceId = null;
    let _adminInvoices = [];
    let _invoicePage = 1;
    let _invoiceMeta = { total: 0, hasMore: false };
    let _invoiceSearchTimer;
    let _invoiceView = 'all';

    function showAdminInvoicePage(view = 'all') {
      _invoiceView = view === 'electronic' ? 'electronic' : 'all';
      const title = document.getElementById('invoices-title');
      const description = document.getElementById('invoices-description');
      if (title) title.textContent = _invoiceView === 'electronic' ? 'Facturación electrónica' : 'Facturación';
      if (description) description.textContent = _invoiceView === 'electronic'
        ? 'Consulta y filtra los documentos procesados por Factus y su estado ante DIAN.'
        : 'Consulta documentos comerciales y su estado electrónico.';
    }

    async function loadAdminInvoices(page = _invoicePage) {
      const tbody = document.getElementById('invoices-table-body');
      if (!tbody) return;
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: '25' });
        const query = document.getElementById('invoices-search')?.value.trim() || '';
        if (query) params.set('q', query);
        if (_invoiceView === 'electronic') params.set('electronicOnly', '1');
        const electronicStatus = document.getElementById('invoices-electronic-status')?.value || '';
        if (electronicStatus) params.set('electronicStatus', electronicStatus);
        const response = await fetch('/api/v1/admin/invoices?' + params, { headers: adminHeaders(), cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.invoices)) throw new Error(data.error || 'No se pudieron cargar las facturas');
        _adminInvoices = data.invoices;
        _invoicePage = data.page;
        _invoiceMeta = data;
        tbody.innerHTML = _adminInvoices.map(renderInvoiceRow).join('') || '<tr><td colspan="7" class="invoices-empty">No hay facturas que coincidan con la búsqueda.</td></tr>';
        renderInvoicesPagination();
      } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" class="invoices-empty error">' + escapeHtml(error.message || 'Error al cargar facturas.') + '</td></tr>';
      }
    }

    function filterAdminInvoices() {
      clearTimeout(_invoiceSearchTimer);
      _invoiceSearchTimer = setTimeout(() => loadAdminInvoices(1), 250);
    }

    function renderInvoicesPagination() {
      const nav = document.getElementById('invoices-pagination');
      if (!nav) return;
      const pageSize = Number(_invoiceMeta.pageSize || 25);
      const total = Number(_invoiceMeta.total || 0);
      const start = total ? (_invoicePage - 1) * pageSize + 1 : 0;
      const end = Math.min(_invoicePage * pageSize, total);
      nav.innerHTML = '<button type="button" data-invoice-page="previous">Anterior</button><span aria-live="polite">' + start + '–' + end + ' de ' + total + ' · Página ' + _invoicePage + '</span><button type="button" data-invoice-page="next">Siguiente</button>';
      nav.querySelector('[data-invoice-page="previous"]').disabled = _invoicePage <= 1;
      nav.querySelector('[data-invoice-page="next"]').disabled = !_invoiceMeta.hasMore;
      nav.querySelector('[data-invoice-page="previous"]').onclick = () => loadAdminInvoices(_invoicePage - 1);
      nav.querySelector('[data-invoice-page="next"]').onclick = () => loadAdminInvoices(_invoicePage + 1);
    }

    function renderInvoiceRow(invoice) {
      const actions = '<a class="invoice-action primary" href="/api/v1/invoices/' + encodeURIComponent(invoice.id) + '/document?view=1" target="_blank" rel="noopener noreferrer">Ver PDF</a>' +
        '<a class="invoice-action" href="/api/v1/invoices/' + encodeURIComponent(invoice.id) + '/document">Descargar</a>' +
        (invoice.status === 'issued' ? '<button class="invoice-action danger" onclick="openCreditNoteModal(' + escapeHtml(JSON.stringify(String(invoice.id))) + ', ' + escapeHtml(JSON.stringify(String(invoice.invoiceNumber))) + ', ' + Number(invoice.totalCents) + ')">Nota crédito</button>' : '');
      return '<tr><td><strong class="invoice-number">' + escapeHtml(invoice.invoiceNumber) + '</strong></td>' +
        '<td><code>#' + escapeHtml(invoice.orderId.replace('ord-', '')) + '</code></td>' +
        '<td><div class="invoice-client"><strong>' + escapeHtml(invoice.customerName) + '</strong><small>' + escapeHtml(invoice.customerEmail) + '</small></div></td>' +
        '<td><strong class="invoice-total">$' + Math.round(Number(invoice.totalCents) / 100).toLocaleString('es-CO') + '</strong></td>' +
        '<td><span class="invoice-status ' + (invoice.status === 'issued' ? 'issued' : 'other') + '">' + escapeHtml(invoice.status) + '</span>' +
        '<small class="invoice-electronic-status">DIAN: ' + escapeHtml(electronicStatusLabel(invoice.electronicStatus)) +
        (invoice.electronicNumber ? ' · ' + escapeHtml(invoice.electronicNumber) : '') + '</small>' +
        (invoice.cufe ? '<small class="invoice-electronic-status">CUFE: ' + escapeHtml(invoice.cufe) + '</small>' : '') +
        (invoice.electronicErrors ? '<small class="invoice-electronic-status invoice-electronic-error">' + escapeHtml(Object.values(invoice.electronicErrors).join('; ')) + '</small>' : '') + '</td>' +
        '<td>' + escapeHtml(new Date(invoice.createdAt).toLocaleString('es-CO')) + '</td><td><div class="invoice-actions">' + actions + '</div></td></tr>';
    }

    function electronicStatusLabel(status) {
      return ({ accepted: 'Aceptada', pending: 'Pendiente de validación', rejected: 'Rechazada', not_configured: 'Proveedor sin configurar' })[status] || 'Sin estado';
    }

    function openCreditNoteModal(invoiceId, invoiceNumber, totalCents) {
      _activeCnInvoiceId = invoiceId;
      document.getElementById('cn-modal-invoice-num').innerText = 'Factura: #' + invoiceNumber;
      window.setCopInputValue('cn-amount', Math.round(totalCents / 100));
      document.getElementById('cn-reason').value = '';
      document.getElementById('cn-concept').value = '1';
      document.getElementById('credit-note-modal').style.display = 'flex';
    }

    function closeCreditNoteModal() {
      document.getElementById('credit-note-modal').style.display = 'none';
      _activeCnInvoiceId = null;
    }

    async function submitCreditNote() {
      if (!_activeCnInvoiceId) return;
      const reason = document.getElementById('cn-reason').value.trim();
      const correctionConceptCode = document.getElementById('cn-concept').value;
      const amountInCents = window.copPesosToCents('cn-amount');
      if (!reason || !Number.isSafeInteger(amountInCents) || amountInCents <= 0) return alert('Por favor indica motivo y monto válido');
      const response = await fetch('/api/v1/admin/invoices/' + _activeCnInvoiceId + '/credit-notes', {
        method: 'POST', headers: adminHeaders(true), body: JSON.stringify({ reason, amountInCents, correctionConceptCode }),
      });
      if (response.ok) {
        alert('Solicitud de nota crédito guardada. La emisión DIAN queda en proceso de validación.');
        closeCreditNoteModal();
        loadAdminInvoices();
      } else {
        const error = await response.json().catch(() => ({}));
        alert('Error: ' + (error.error || 'No se pudo emitir la nota crédito'));
      }
    }

    window.loadAdminInvoices = loadAdminInvoices;
    window.showAdminInvoicePage = showAdminInvoicePage;
    window.filterAdminInvoices = filterAdminInvoices;
    window.openCreditNoteModal = openCreditNoteModal;
    window.closeCreditNoteModal = closeCreditNoteModal;
    window.submitCreditNote = submitCreditNote;
  `;
}
