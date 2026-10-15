export const storefrontCartStyles = String.raw`
    .cart-breadcrumb { display: flex; align-items: center; gap: .6rem; padding: .8rem 0 1rem; color: #65716a; font-size: .82rem; }
    .cart-breadcrumb a { color: #424e47; text-decoration: none; }
    .cart-breadcrumb a:hover { color: #16201b; text-decoration: underline; }
    .cart-breadcrumb [aria-current="page"] { color: #16201b; font-weight: 650; }
    .cart-page-heading { display: flex; align-items: flex-end; justify-content: space-between; gap: 1rem; margin-bottom: 1.4rem; }
    .cart-page-heading h1 { margin: 0; font-size: clamp(2rem, 3.5vw, 2.65rem); letter-spacing: -.045em; }
    .cart-page-heading p { margin: .4rem 0 0; color: #424e47; }
    .cart-empty-button, .cart-secondary-button { min-height: 44px; padding: 0 1rem; border: 1px solid #c7ccbe; border-radius: 10px; background: #fff; color: #16201b; font: inherit; font-weight: 600; cursor: pointer; }
    .cart-empty-button:hover, .cart-secondary-button:hover { background: #e8ebe2; }
    .cart-layout { display: grid; grid-template-columns: minmax(0, 1fr) minmax(290px, 350px); align-items: start; gap: 1.5rem; }
    .cart-products-panel, .cart-summary { min-width: 0; border: 1px solid #e1e4da; border-radius: 16px; background: #fff; }
    .cart-products-panel { padding: 1.25rem; }
    .cart-products-panel > h2, .cart-summary > h2 { margin: 0; font-size: 1rem; font-weight: 650; }
    .cart-products-panel > h2 span { color: #65716a; font-weight: 500; }
    .cart-items { margin: .8rem 0 0; padding: 0; list-style: none; }
    .cart-item { display: grid; grid-template-columns: 112px minmax(130px, 1fr) auto auto auto; align-items: center; gap: 1rem; padding: 1.25rem 0; border-top: 1px solid #e1e4da; }
    .cart-item:first-child { border-top: 0; }
    .cart-item-image { display: grid; width: 112px; height: 112px; place-items: center; overflow: hidden; border-radius: 12px; background: #f3f4ef; color: #65716a; font-size: 1.5rem; text-decoration: none; }
    .cart-item-image img { width: 100%; height: 100%; padding: .5rem; object-fit: contain; }
    .cart-item-image.has-no-image::after { content: "Imagen no disponible"; padding: .3rem; color: #65716a; font-size: .68rem; text-align: center; }
    .cart-item-info { display: flex; min-width: 0; flex-direction: column; gap: .3rem; }
    .cart-item-info h2 { margin: 0; font-size: .98rem; font-weight: 650; line-height: 1.35; }
    .cart-item-info h2 a { color: #16201b; text-decoration: none; }
    .cart-item-info h2 a:hover { text-decoration: underline; }
    .cart-sku { color: #65716a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .72rem; }
    .cart-unit-price { color: #424e47; font-size: .84rem; font-weight: 600; }
    .cart-quantity { display: flex; flex-direction: column; gap: .35rem; color: #424e47; font-size: .75rem; font-weight: 650; }
    .cart-quantity > div { display: flex; height: 44px; align-items: center; border: 1px solid #c7ccbe; border-radius: 10px; }
    .cart-quantity button { width: 36px; height: 42px; border: 0; background: transparent; color: #16201b; font-size: 1.1rem; cursor: pointer; }
    .cart-quantity button:disabled { color: #aeb5aa; cursor: not-allowed; }
    .cart-quantity input { width: 34px; height: 42px; min-height: 42px !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: transparent !important; text-align: center; font-weight: 650; }
    .cart-quantity input::-webkit-inner-spin-button, .cart-quantity input::-webkit-outer-spin-button { appearance: none; margin: 0; }
    .cart-line-total { min-width: 86px; text-align: right; font-size: .95rem; font-variant-numeric: tabular-nums; }
    .cart-remove-button { display: grid; width: 40px; height: 40px; place-items: center; border: 0; border-radius: 10px; background: transparent; color: #a8231b; font-size: 1.5rem; cursor: pointer; }
    .cart-remove-button:hover { background: #fbe9e7; }
    .cart-continue-link { display: inline-flex; min-height: 44px; align-items: center; gap: .5rem; color: #1f4d3a; font-weight: 650; text-decoration: none; }
    .cart-continue-link:hover { text-decoration: underline; }
    .cart-summary { position: sticky; top: 1rem; padding: 1.25rem; }
    .cart-summary > h2 { margin-bottom: 1rem; font-size: 1.15rem; }
    .cart-summary-row { display: flex; justify-content: space-between; gap: .75rem; padding: .55rem 0; color: #424e47; }
    .coupon-widget { margin: 1rem 0; padding: .9rem; border: 1px solid #e1e4da; border-radius: 12px; background: #f8f9f6; }
    .coupon-widget > label { display: block; margin-bottom: .45rem; color: #16201b; font-size: .85rem; font-weight: 650; }
    .coupon-widget form { display: flex; gap: .45rem; }
    .coupon-widget input { width: 100%; min-width: 0; min-height: 42px; padding: .55rem .7rem; border: 1px solid #c7ccbe; border-radius: 8px; background: #fff; color: #16201b; font: inherit; text-transform: uppercase; }
    .coupon-widget button { flex: 0 0 auto; min-height: 42px; padding: 0 .8rem; border: 0; border-radius: 8px; background: #1f4d3a; color: #fff; font: inherit; font-weight: 650; cursor: pointer; }
    .coupon-widget button:disabled { opacity: .6; cursor: wait; }
    .coupon-widget p { min-height: 1.1em; margin: .45rem 0 0; color: #65716a; font-size: .78rem; }
    .coupon-widget p[data-state="success"] { color: #1f4d3a; }
    .coupon-widget p[data-state="error"] { color: #a8231b; }
    .cart-coupon-row { color: #1f4d3a; }
    .cart-summary-total { margin-top: .4rem; padding-top: 1rem; border-top: 1px solid #e1e4da; color: #16201b; font-size: 1.1rem; }
    .cart-summary > p { margin: .6rem 0 1.2rem; color: #65716a; font-size: .8rem; line-height: 1.5; }
    .cart-checkout-link, .cart-primary-link { display: flex; min-height: 52px; align-items: center; justify-content: center; gap: .5rem; padding: .7rem 1rem; border-radius: 12px; background: #16201b; color: #fff; font-weight: 700; text-align: center; text-decoration: none; }
    .cart-checkout-link:hover, .cart-primary-link:hover { background: #2a372f; color: #fff; }
    .cart-payment-note { display: flex; align-items: flex-start; gap: .65rem; margin-top: 1rem; color: #424e47; }
    .cart-payment-note > span { display: grid; width: 28px; height: 28px; flex: 0 0 28px; place-items: center; border-radius: 50%; background: #e4eee8; color: #1f4d3a; }
    .cart-payment-note p { margin: .15rem 0 0; font-size: .78rem; line-height: 1.45; }
    .cart-action-message { margin: 0 0 1rem; padding: .85rem 1rem; border: 1px solid #e2b4ae; border-radius: 10px; background: #fbe9e7; color: #8e211a; }
    .cart-empty { display: flex; max-width: 650px; min-height: 390px; flex-direction: column; align-items: center; justify-content: center; gap: .9rem; margin: 1rem auto 2rem; padding: 2rem; border: 1px solid #e1e4da; border-radius: 16px; background: #fff; text-align: center; }
    .cart-empty > span { display: grid; width: 64px; height: 64px; place-items: center; border-radius: 50%; background: #e4eee8; color: #1f4d3a; font-size: 1.8rem; }
    .cart-empty h1 { margin: 0; font-size: clamp(1.8rem, 3vw, 2.2rem); letter-spacing: -.04em; }
    .cart-empty p { max-width: 44ch; margin: 0 0 .4rem; color: #424e47; }
    .cart-primary-link { min-height: 48px; padding-inline: 1.3rem; }
    .cart-confirm-dialog { width: min(100% - 2rem, 420px); padding: 1.5rem; border: 1px solid #e1e4da; border-radius: 16px; color: #16201b; box-shadow: 0 20px 60px rgba(22,32,27,.2); }
    .cart-confirm-dialog::backdrop { background: rgba(22,32,27,.48); }
    .cart-confirm-dialog h2 { margin: 0; font-size: 1.2rem; }
    .cart-confirm-dialog p { color: #424e47; }
    .cart-confirm-dialog > div { display: flex; justify-content: flex-end; gap: .6rem; margin-top: 1.25rem; }
    .cart-danger-button { min-height: 44px; padding: 0 1rem; border: 1px solid #a8231b; border-radius: 10px; background: #a8231b; color: #fff; font: inherit; font-weight: 650; cursor: pointer; }
    .cart-danger-button:disabled { opacity: .65; cursor: wait; }
    @media (max-width: 920px) { .cart-layout { grid-template-columns: minmax(0, 1fr); } .cart-summary { position: static; } }
    @media (max-width: 650px) { .cart-page-heading { align-items: flex-start; } .cart-item { grid-template-columns: 84px minmax(0,1fr) auto; gap: .75rem; } .cart-item-image { width: 84px; height: 84px; grid-row: span 2; } .cart-item-info { grid-column: 2 / 4; } .cart-quantity { grid-column: 2; } .cart-line-total { min-width: 0; grid-column: 3; grid-row: 2; } .cart-remove-button { grid-column: 3; grid-row: 1; justify-self: end; } }
    @media (max-width: 420px) { .cart-page-heading { flex-direction: column; align-items: stretch; } .cart-empty-button { align-self: flex-start; } .cart-products-panel, .cart-summary { padding: 1rem; } .cart-item { grid-template-columns: 72px minmax(0,1fr) auto; } .cart-item-image { width: 72px; height: 72px; } .cart-item-info h2 { font-size: .9rem; } .cart-line-total { font-size: .85rem; } }
`;
