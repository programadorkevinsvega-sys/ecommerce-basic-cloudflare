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
  `;
}
