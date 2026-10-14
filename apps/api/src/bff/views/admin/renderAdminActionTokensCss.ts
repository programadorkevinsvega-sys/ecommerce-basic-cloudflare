export function renderAdminActionTokensCss(): string {
  return `
    :root { --admin-primary:#20563d; --admin-primary-hover:#17452f; --admin-primary-focus:#dcebe2; }
    #admin-legacy-tabs .btn-primary,
    #admin-legacy-tabs .taxonomy-primary,
    #admin-legacy-tabs .products-primary-button,
    #admin-legacy-tabs #pSubmitBtn,
    #admin-legacy-tabs .inventory-primary-button,
    #admin-legacy-tabs .orders-primary-button,
    #admin-legacy-tabs #orders-refresh,
    #admin-legacy-tabs .shipping-action.primary,
    #admin-legacy-tabs .invoice-action.primary {
      border-color:var(--admin-primary)!important;
      background:var(--admin-primary)!important;
      color:#fff!important;
    }
    #admin-legacy-tabs .btn-primary:hover:not(:disabled),
    #admin-legacy-tabs .taxonomy-primary:hover:not(:disabled),
    #admin-legacy-tabs .products-primary-button:hover:not(:disabled),
    #admin-legacy-tabs #pSubmitBtn:hover:not(:disabled),
    #admin-legacy-tabs .inventory-primary-button:hover:not(:disabled),
    #admin-legacy-tabs .orders-primary-button:hover:not(:disabled),
    #admin-legacy-tabs #orders-refresh:hover:not(:disabled),
    #admin-legacy-tabs .shipping-action.primary:hover:not(:disabled),
    #admin-legacy-tabs .invoice-action.primary:hover:not(:disabled) {
      border-color:var(--admin-primary-hover)!important;
      background:var(--admin-primary-hover)!important;
      color:#fff!important;
    }
    #admin-legacy-tabs .btn-primary:focus-visible,
    #admin-legacy-tabs .taxonomy-primary:focus-visible,
    #admin-legacy-tabs .products-primary-button:focus-visible,
    #admin-legacy-tabs .inventory-primary-button:focus-visible,
    #admin-legacy-tabs .orders-primary-button:focus-visible {
      outline:3px solid var(--admin-primary-focus)!important;
      outline-offset:2px;
    }
    #admin-legacy-tabs table .btn-action,
    #admin-legacy-tabs .shipping-actions .shipping-action,
    #admin-legacy-tabs .shipping-locations-page-card .shipping-action,
    #admin-legacy-tabs .invoice-actions .invoice-action,
    #admin-legacy-tabs .taxonomy-row-actions button,
    #admin-legacy-tabs .orders-action-cell .orders-secondary-button,
    #admin-legacy-tabs .inventory-table .inventory-secondary-button {
      box-sizing:border-box!important;
      display:inline-flex!important;
      min-height:34px!important;
      align-items:center!important;
      justify-content:center!important;
      margin:0 2px!important;
      border:1px solid #d5dae3!important;
      border-radius:7px!important;
      padding:0 10px!important;
      background:#fff!important;
      color:#394253!important;
      font-family:inherit!important;
      font-size:12px!important;
      font-weight:600!important;
      line-height:1!important;
      text-decoration:none!important;
      vertical-align:middle;
      white-space:nowrap;
      cursor:pointer;
    }
    #admin-legacy-tabs table .btn-action:hover:not(:disabled),
    #admin-legacy-tabs .shipping-actions .shipping-action:hover:not(:disabled),
    #admin-legacy-tabs .shipping-locations-page-card .shipping-action:hover:not(:disabled),
    #admin-legacy-tabs .invoice-actions .invoice-action:hover:not(:disabled),
    #admin-legacy-tabs .taxonomy-row-actions button:hover:not(:disabled),
    #admin-legacy-tabs .orders-action-cell .orders-secondary-button:hover:not(:disabled),
    #admin-legacy-tabs .inventory-table .inventory-secondary-button:hover:not(:disabled) {
      border-color:#aeb7c4!important;
      background:#f4f6f8!important;
      color:#202936!important;
    }
    #admin-legacy-tabs table .btn-action-publish,
    #admin-legacy-tabs .shipping-actions .shipping-action.primary,
    #admin-legacy-tabs .shipping-locations-page-card .shipping-action.primary,
    #admin-legacy-tabs .invoice-actions .invoice-action.primary {
      border-color:#c8dfd0!important;
      background:#e8f3ec!important;
      color:#20563d!important;
    }
    #admin-legacy-tabs table .btn-action-hide {
      border-color:#eadbbd!important;
      background:#fff7e8!important;
      color:#805800!important;
    }
    #admin-legacy-tabs table .btn-action-delete,
    #admin-legacy-tabs .shipping-actions .shipping-action.danger,
    #admin-legacy-tabs .invoice-actions .invoice-action.danger,
    #admin-legacy-tabs .taxonomy-row-actions .taxonomy-danger {
      border-color:#efcfcc!important;
      background:#fff3f1!important;
      color:#a23b33!important;
    }
    #admin-legacy-tabs table .btn-action-publish:hover:not(:disabled),
    #admin-legacy-tabs .shipping-actions .shipping-action.primary:hover:not(:disabled),
    #admin-legacy-tabs .shipping-locations-page-card .shipping-action.primary:hover:not(:disabled),
    #admin-legacy-tabs .invoice-actions .invoice-action.primary:hover:not(:disabled) {
      border-color:#a9cbb5!important;
      background:#dcece2!important;
      color:#17452f!important;
    }
    #admin-legacy-tabs table .btn-action-hide:hover:not(:disabled) {
      border-color:#ddc998!important;
      background:#fff0ce!important;
      color:#684700!important;
    }
    #admin-legacy-tabs table .btn-action-delete:hover:not(:disabled),
    #admin-legacy-tabs .shipping-actions .shipping-action.danger:hover:not(:disabled),
    #admin-legacy-tabs .invoice-actions .invoice-action.danger:hover:not(:disabled),
    #admin-legacy-tabs .taxonomy-row-actions .taxonomy-danger:hover:not(:disabled) {
      border-color:#e4b7b2!important;
      background:#ffe7e3!important;
      color:#852c26!important;
    }
    #admin-legacy-tabs table .btn-action:focus-visible,
    #admin-legacy-tabs .shipping-actions .shipping-action:focus-visible,
    #admin-legacy-tabs .shipping-locations-page-card .shipping-action:focus-visible,
    #admin-legacy-tabs .invoice-actions .invoice-action:focus-visible,
    #admin-legacy-tabs .taxonomy-row-actions button:focus-visible,
    #admin-legacy-tabs .orders-action-cell .orders-secondary-button:focus-visible,
    #admin-legacy-tabs .inventory-table .inventory-secondary-button:focus-visible {
      outline:3px solid var(--admin-primary-focus)!important;
      outline-offset:2px;
    }
    #admin-legacy-tabs .products-actions,
    #admin-legacy-tabs .shipping-actions,
    #admin-legacy-tabs .invoice-actions,
    #admin-legacy-tabs .taxonomy-row-actions,
    #admin-legacy-tabs .orders-action-cell { display:flex; align-items:center; flex-wrap:wrap; gap:6px; }
  `;
}
