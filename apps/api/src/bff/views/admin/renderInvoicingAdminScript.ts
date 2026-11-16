export function renderInvoicingAdminScript(): string {
  return `
    let _activeCnInvoiceId = null;
    let _adminInvoices = [];
    let _invoicePage = 1;
    let _invoiceMeta = { total: 0, hasMore: false };
    let _invoiceSearchTimer;
    let _invoiceView = 'all';
    let _invoiceRequestId = 0;

    function showAdminInvoicePage(view = 'all') {
      _invoiceView = view === 'electronic' ? 'electronic' : 'all';
      const title = document.getElementById('invoices-title');
      const description = document.getElementById('invoices-description');
      const electronic = _invoiceView === 'electronic';
      const listTitle = document.getElementById('invoices-list-title');
      const listDescription = document.getElementById('invoices-list-description');
      const statusFilter = document.getElementById('invoices-electronic-filter');
      const statusHeading = document.getElementById('invoices-status-heading');
      const pagination = document.getElementById('invoices-pagination');
      if (title) title.textContent = electronic ? 'Facturación electrónica' : 'Facturación';
      if (description) description.textContent = electronic
        ? 'Seguimiento de facturas transmitidas a Factus para validación ante DIAN.'
        : 'Consulta los comprobantes comerciales internos emitidos para tus ventas.';
      if (listTitle) listTitle.textContent = electronic ? 'Facturas para validación electrónica' : 'Facturas comerciales emitidas';
      if (listDescription) listDescription.textContent = electronic
        ? 'Solo aparecen facturas marcadas para transmisión electrónica; aquí puedes filtrar por estado DIAN.'
        : 'Comprobantes internos de ventas; esta lista no equivale por sí sola a facturación electrónica DIAN.';
      if (statusFilter) statusFilter.hidden = !electronic;
      if (statusHeading) statusHeading.textContent = electronic ? 'Estado ante DIAN' : 'Estado de factura';
      if (pagination) pagination.setAttribute('aria-label', electronic ? 'Paginación de facturas electrónicas' : 'Paginación de facturas comerciales');
      if (!electronic) {
        const status = document.getElementById('invoices-electronic-status');
        if (status) status.value = '';
      }
    }

    async function loadAdminInvoices(page = _invoicePage) {
      const tbody = document.getElementById('invoices-table-body');
      if (!tbody) return;
      const requestId = ++_invoiceRequestId;
      const view = _invoiceView;
      const electronic = view === 'electronic';
      const status = electronic ? document.getElementById('invoices-electronic-status')?.value || '' : '';
      const nav = document.getElementById('invoices-pagination');
      tbody.innerHTML = '<tr><td colspan="7" class="invoices-empty">Cargando facturas…</td></tr>';
      if (nav) nav.innerHTML = '';
      setInvoiceSearchStatus('Buscando facturas…');
      try {
        const params = new URLSearchParams({ page: String(page), pageSize: '25' });
        const query = document.getElementById('invoices-search')?.value.trim() || '';
        if (query) params.set('q', query);
        if (electronic) params.set('electronicOnly', '1');
        if (status) params.set('electronicStatus', status);
        const response = await fetch('/api/v1/admin/invoices?' + params, { headers: adminHeaders(), cache: 'no-store' });
        const data = await response.json();
        if (!response.ok || !data.success || !Array.isArray(data.invoices)) throw new Error(data.error || 'No se pudieron cargar las facturas');
        if (requestId !== _invoiceRequestId) return;
        _adminInvoices = data.invoices;
        _invoicePage = data.page;
        _invoiceMeta = data;
        const emptyMessage = electronic
          ? 'No hay facturas para transmisión electrónica que coincidan con la búsqueda y el estado seleccionado.'
          : 'No hay facturas comerciales que coincidan con la búsqueda.';
        tbody.innerHTML = _adminInvoices.map(renderInvoiceRow).join('') || '<tr><td colspan="7" class="invoices-empty">' + emptyMessage + '</td></tr>';
        setInvoiceSearchStatus(_invoiceMeta.total
          ? 'Se encontraron ' + _invoiceMeta.total + ' facturas. Mostrando la página ' + _invoicePage + '.'
          : 'No se encontraron facturas con esos criterios.');
        renderInvoicesPagination();
      } catch (error) {
        if (requestId !== _invoiceRequestId) return;
        tbody.innerHTML = '<tr><td colspan="7" class="invoices-empty error">' + escapeHtml(error.message || 'Error al cargar facturas.') + '</td></tr>';
        setInvoiceSearchStatus('No se pudo completar la consulta.');
      }
    }

    function filterAdminInvoices() {
      clearTimeout(_invoiceSearchTimer);
      _invoiceSearchTimer = setTimeout(() => loadAdminInvoices(1), 250);
    }

    function submitInvoiceSearch(event) {
      event.preventDefault();
      clearTimeout(_invoiceSearchTimer);
      return loadAdminInvoices(1);
    }

    function setInvoiceSearchStatus(message) {
      const status = document.getElementById('invoices-search-status');
      if (status) status.textContent = message;
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
      nav.querySelector('[data-invoice-page="previous"]').addEventListener('click', () => loadAdminInvoices(_invoicePage - 1));
      nav.querySelector('[data-invoice-page="next"]').addEventListener('click', () => loadAdminInvoices(_invoicePage + 1));
    }

    function renderInvoiceRow(invoice) {
      const commercialView = _invoiceView === 'electronic' ? 'Ver comprobante comercial' : 'Ver PDF comercial';
      const commercialDownload = _invoiceView === 'electronic' ? 'Descargar comprobante comercial' : 'Descargar PDF comercial';
      const actions = '<a class="invoice-action primary" href="/api/v1/invoices/' + encodeURIComponent(invoice.id) + '/document?view=1" target="_blank" rel="noopener noreferrer">' + commercialView + '</a>' +
        '<a class="invoice-action" href="/api/v1/invoices/' + encodeURIComponent(invoice.id) + '/document">' + commercialDownload + '</a>' +
        (invoice.status === 'issued' && _invoiceView === 'electronic' && invoice.electronicStatus === 'accepted' && invoice.electronicNumber
          ? '<a class="invoice-action primary" href="/api/v1/admin/invoices/' + encodeURIComponent(invoice.id) + '/electronic-document?view=1" target="_blank" rel="noopener noreferrer">Ver PDF electrónico DIAN</a>' +
            '<a class="invoice-action" href="/api/v1/admin/invoices/' + encodeURIComponent(invoice.id) + '/electronic-document">Descargar PDF electrónico</a>'
          : '') +
        (invoice.status === 'issued' && _invoiceView === 'electronic' && invoice.electronicStatus === 'accepted' && invoice.electronicNumber
          ? '<button class="invoice-action danger" data-invoice-action="credit-note" data-invoice-id="' + escapeHtml(String(invoice.id)) + '" data-invoice-number="' + escapeHtml(String(invoice.invoiceNumber)) + '" data-total-cents="' + Number(invoice.totalCents) + '">Nota crédito</button>'
          : '');
      const status = _invoiceView === 'electronic'
        ? '<span class="invoice-status ' + (invoice.electronicStatus === 'accepted' ? 'issued' : 'other') + '">' + escapeHtml(electronicStatusLabel(invoice.electronicStatus)) + '</span>' +
          (invoice.electronicNumber ? '<small class="invoice-electronic-status">' + escapeHtml(invoice.electronicNumber) + '</small>' : '') +
          (invoice.cufe ? '<small class="invoice-electronic-status">CUFE: ' + escapeHtml(invoice.cufe) + '</small>' : '') +
          (invoice.electronicErrors ? '<small class="invoice-electronic-status invoice-electronic-error">' + escapeHtml(Object.values(invoice.electronicErrors).join('; ')) + '</small>' : '')
        : '<span class="invoice-status ' + (invoice.status === 'issued' ? 'issued' : 'other') + '">' + escapeHtml(invoice.status) + '</span>';
      return '<tr><td><strong class="invoice-number">' + escapeHtml(invoice.invoiceNumber) + '</strong></td>' +
        '<td><code>#' + escapeHtml(invoice.orderId.replace('ord-', '')) + '</code></td>' +
        '<td><div class="invoice-client"><strong>' + escapeHtml(invoice.customerName) + '</strong><small>' + escapeHtml(invoice.customerEmail) + '</small></div></td>' +
        '<td><strong class="invoice-total">$' + Math.round(Number(invoice.totalCents) / 100).toLocaleString('es-CO') + '</strong></td>' +
        '<td>' + status + '</td>' +
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
      const headers = await window.adminCriticalHeaders(true);
      if (!headers) return;
      const response = await fetch('/api/v1/admin/invoices/' + _activeCnInvoiceId + '/credit-notes', {
        method: 'POST', headers, body: JSON.stringify({ reason, amountInCents, correctionConceptCode }),
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
    document.getElementById('invoices-search-form')?.addEventListener('submit', submitInvoiceSearch);
    document.getElementById('invoices-search')?.addEventListener('input', filterAdminInvoices);
    document.getElementById('invoices-electronic-status')?.addEventListener('change', () => loadAdminInvoices(1));
    document.addEventListener('click', (event) => {
      const button = event.target.closest('[data-invoice-action]');
      if (!button) return;
      if (button.dataset.invoiceAction === 'close') closeCreditNoteModal();
      if (button.dataset.invoiceAction === 'submit-credit-note') submitCreditNote();
      if (button.dataset.invoiceAction === 'credit-note') {
        openCreditNoteModal(button.dataset.invoiceId, button.dataset.invoiceNumber, Number(button.dataset.totalCents));
      }
    });
  `;
}
