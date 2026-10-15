export const storefrontCheckoutStyles = String.raw`
    .checkout-mode { margin: 0; background: #f3f4ef; color: #16201b; }
    .checkout-mode .announcement-bar, .checkout-mode > .site-header, .checkout-mode > .site-footer { display: none; }
    .checkout-mode .container.checkout-container { width: 100%; max-width: none; margin: 0; padding: 0; }
    .checkout-header { border-bottom: 1px solid #e1e4da; background: #f3f4ef; }
    .checkout-header-inner { display: flex; width: min(100% - 2rem, 1200px); min-height: 76px; align-items: center; justify-content: space-between; gap: .5rem 1.5rem; margin: auto; }
    .checkout-brand { color: #16201b; font-family: 'Bricolage Grotesque', system-ui, sans-serif; font-size: 1.35rem; font-weight: 700; letter-spacing: .06em; text-decoration: none; }
    .checkout-brand span { color: #5b675f; font-family: 'Hanken Grotesk', sans-serif; font-size: .68rem; letter-spacing: .2em; }
    .checkout-secure { display: flex; align-items: center; gap: .5rem; margin: 0; color: #1f4d3a; font-size: .9rem; font-weight: 650; }
    .checkout-back { display: inline-flex; min-height: 44px; align-items: center; gap: .45rem; color: #1f4d3a; font-size: .9rem; font-weight: 650; text-decoration: none; }
    .checkout-back:hover { color: #16201b; }
    .checkout-page { width: min(100% - 2rem, 1200px); margin: auto; padding: 1.5rem 0 4rem; }
    .checkout-steps { margin: 0 0 1.5rem; }
    .checkout-steps ol { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem .75rem; margin: 0; padding: 0; list-style: none; color: #424e47; font-size: .88rem; }
    .checkout-step { display: flex; align-items: center; gap: .5rem; }
    .checkout-step-number { display: inline-flex; width: 28px; height: 28px; flex: 0 0 28px; align-items: center; justify-content: center; border-radius: 50%; background: #16201b; color: white; font-size: .8rem; }
    .checkout-step-done .checkout-step-number { background: #1f4d3a; }
    .checkout-step-current { color: #16201b; font-weight: 700; }
    .checkout-step-line { width: 32px; height: 2px; background: #c7ccbe; }
    .checkout-title { margin: 0 0 1.5rem; font-family: 'Bricolage Grotesque', system-ui, sans-serif; font-size: clamp(2rem, 5vw, 2.4rem); letter-spacing: -.03em; line-height: 1.1; }
    .checkout-draft-note { margin: -.9rem 0 1.2rem; color: #5b675f; font-size: .78rem; }
    .checkout-columns { display: flex; flex-wrap: wrap; align-items: flex-start; gap: 1.5rem; }
    .checkout-form { display: flex; min-width: 0; flex: 2 1 560px; flex-direction: column; gap: 1.25rem; }
    .checkout-required-note { margin: 0; color: #5b675f; font-size: .82rem; }
    .checkout-card, .checkout-summary { min-width: 0; border: 1px solid #e1e4da; border-radius: 16px; background: #fff; }
    .checkout-card { width: 100%; margin: 0; padding: 1.5rem; }
    .checkout-card legend { float: left; width: 100%; margin-bottom: 1rem; font-size: 1.12rem; font-weight: 650; }
    .checkout-card legend span { margin-right: .35rem; color: #5b675f; font-weight: 500; }
    .checkout-fields { display: grid; clear: both; grid-template-columns: repeat(auto-fit, minmax(min(100%, 230px), 1fr)); gap: 1rem 1.25rem; }
    .checkout-field { display: flex; min-width: 0; flex-direction: column; gap: .35rem; }
    .checkout-field-full { grid-column: 1 / -1; }
    .checkout-field label { font-size: .82rem; font-weight: 650; }
    .checkout-field input, .checkout-field select { width: 100%; min-height: 48px; padding: .65rem .85rem; border: 1px solid #c7ccbe; border-radius: 10px; background: white; color: #16201b; font: inherit; }
    .checkout-field input:focus, .checkout-field select:focus { border-color: #1f4d3a; box-shadow: 0 0 0 3px #cfe0d5; outline: none; }
    .checkout-field small { color: #5b675f; font-size: .75rem; }
    .checkout-location-suggestions { display: grid; max-height: 13rem; overflow-y: auto; border: 1px solid #c7ccbe; border-radius: 10px; background: #fff; }
    .checkout-location-option { padding: .7rem .85rem; border: 0; border-bottom: 1px solid #edf0e9; background: #fff; color: #16201b; text-align: left; font: inherit; cursor: pointer; }
    .checkout-location-option:last-child { border-bottom: 0; }
    .checkout-location-option:hover, .checkout-location-option:focus-visible { background: #edf2e8; outline: 2px solid #1f4d3a; outline-offset: -2px; }
    .checkout-carrier-quotes { display:grid; gap:.55rem; margin-top:.75rem; padding:.8rem; border:1px solid #e1e4da; border-radius:12px; background:#f8f9f5; color:#16201b; }
    .checkout-carrier-option { display:flex; align-items:center; gap:.7rem; padding:.7rem; border:1px solid #dce2d9; border-radius:9px; background:#fff; cursor:pointer; }
    .checkout-carrier-option:has(input:checked) { border-color:#1f4d3a; background:#edf2e8; }
    .checkout-carrier-option input { width:18px; min-height:18px; accent-color:#1f4d3a; }
    .checkout-carrier-option span { display:grid; gap:.2rem; }
    .checkout-carrier-option small { color:#5b675f; }
    .checkout-policy { display: flex; min-height: 56px; align-items: flex-start; gap: .7rem; margin-top: 1rem; padding: .8rem 1rem; border: 1px solid #e1e4da; border-radius: 12px; background: #f3f4ef; color: #424e47; font-size: .86rem; }
    .checkout-policy[data-state='success'] { border-color: #cfe0d5; background: #e4eee8; }
    .checkout-policy[data-state='error'] { border-color: #efc8c8; background: #fff0f0; color: #8b2525; }
    .checkout-payment-options { display: flex; clear: both; width: 100%; min-width: 0; flex-direction: column; gap: .75rem; }
    .checkout-payment-option { display: flex; width: 100%; min-width: 0; box-sizing: border-box; align-items: flex-start; gap: .85rem; padding: 1rem; border: 2px solid #e1e4da; border-radius: 12px; background: #fff; cursor: pointer; }
    .checkout-payment-option:has(input:checked) { border-color: #16201b; background: #f3f4ef; }
    .checkout-payment-option input { width: 20px; height: 20px; flex: 0 0 20px; margin: .15rem 0 0; accent-color: #1f4d3a; }
    .checkout-payment-option span { display: flex; min-width: 0; flex: 1 1 auto; flex-direction: column; gap: .15rem; }
    .checkout-payment-option small { color: #424e47; font-size: .86rem; }
    .checkout-payment-option em { color: #1f4d3a; font-size: .8rem; font-style: normal; font-weight: 650; }
    .checkout-payment-option:has(input:disabled) { cursor: not-allowed; opacity: .55; }
    .checkout-submit { display: flex; min-height: 56px; width: 100%; align-items: center; justify-content: center; gap: .6rem; border: 0; border-radius: 12px; background: #16201b; color: white; font: inherit; font-size: 1.05rem; font-weight: 650; cursor: pointer; }
    .checkout-submit:hover:not(:disabled) { background: #2a372f; }
    .checkout-submit:disabled { cursor: not-allowed; opacity: .6; }
    .checkout-submit-note, .checkout-terms { margin: 0; color: #424e47; text-align: center; }
    .checkout-submit-note { font-size: .86rem; }
    .checkout-terms { color: #5b675f; font-size: .75rem; }
    .checkout-error { margin: 0; color: #8b2525; text-align: center; font-size: .88rem; }
    .checkout-summary { display: flex; min-width: 0; flex: 1 1 340px; flex-direction: column; gap: 1.1rem; padding: 1.5rem; }
    .checkout-summary h2 { margin: 0; font-size: 1.12rem; }
    .checkout-items { display: flex; max-height: 300px; flex-direction: column; overflow-y: auto; margin: 0; padding: 0; list-style: none; }
    .checkout-item { display: flex; align-items: center; gap: .75rem; padding: .75rem 0; border-top: 1px solid #e1e4da; }
    .checkout-item-image { display: grid; width: 52px; height: 52px; flex: 0 0 52px; place-items: center; overflow: hidden; border-radius: 10px; background: #f3f4ef; color: #5b675f; }
    .checkout-item-image img { width: 100%; height: 100%; object-fit: cover; }
    .checkout-item-name { min-width: 0; flex: 1; font-size: .88rem; font-weight: 650; line-height: 1.3; overflow-wrap: anywhere; }
    .checkout-item-name small { display: block; margin-top: .2rem; color: #5b675f; font-size: .78rem; font-weight: 400; }
    .checkout-item-price { flex: 0 0 auto; font-size: .88rem; font-variant-numeric: tabular-nums; font-weight: 650; }
    .checkout-totals { display: flex; flex-direction: column; gap: .65rem; margin: 0; padding-top: 1rem; border-top: 1px solid #e1e4da; }
    .checkout-total-row { display: flex; justify-content: space-between; gap: .75rem; color: #424e47; }
    .checkout-total-row dd { margin: 0; font-variant-numeric: tabular-nums; text-align: right; }
    .checkout-total-final { align-items: baseline; padding-top: 1rem; border-top: 1px solid #e1e4da; color: #16201b; font-size: 1.15rem; font-weight: 700; }
    .checkout-total-final dd { font-size: 1.7rem; letter-spacing: -.03em; }
    .checkout-tax-note { margin: -.5rem 0 0; color: #5b675f; font-size: .78rem; }
    .checkout-footer { display: flex; flex-wrap: wrap; align-items:center; justify-content: space-between; gap: .7rem 1.5rem; padding: 1.25rem 0; border-top: 1px solid #e1e4da; color: #424e47; font-size: .8rem; }
    .checkout-footer-store-details { display:flex; flex-wrap:wrap; gap:.25rem .8rem; }
    .checkout-footer-store-details a { color:inherit; }
    @media (max-width: 700px) { .checkout-header-inner { min-height: 68px; } .checkout-secure { display: none; } .checkout-page { width: min(100% - 1.25rem, 1200px); padding-top: 1rem; } .checkout-columns { gap: 1rem; } .checkout-form { flex-basis: 100%; } .checkout-summary { flex-basis: 100%; order: 2; } .checkout-card, .checkout-summary { padding: 1rem; } .checkout-step-line { width: 15px; } }
    @media (prefers-reduced-motion: reduce) { .checkout-mode *, .checkout-mode *::before, .checkout-mode *::after { scroll-behavior: auto !important; transition: none !important; } }
`;
