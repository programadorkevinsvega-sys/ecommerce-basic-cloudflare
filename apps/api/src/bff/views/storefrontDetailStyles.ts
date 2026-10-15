export const storefrontDetailStyles = String.raw`
    .detail-breadcrumb { display: flex; flex-wrap: wrap; align-items: center; gap: .45rem .65rem; padding: .8rem 0 1.4rem; color: #65716a; font-size: .82rem; }
    .detail-breadcrumb a { color: #424e47; text-decoration: none; }
    .detail-breadcrumb a:hover { color: #16201b; text-decoration: underline; }
    .detail-breadcrumb [aria-current="page"] { color: #16201b; font-weight: 600; }
    .detail-review-summary { display: inline-flex; align-items: center; gap: .35rem; margin-top: .75rem; color: #1f4d3a; font-size: .9rem; font-weight: 650; text-decoration: none; }
    .detail-review-summary:hover { text-decoration: underline; }
    .detail-layout { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(340px, .92fr); align-items: start; gap: clamp(2rem, 4vw, 3.5rem); }
    .container:has(.detail-layout) > .products-section { display: none; }
    .detail-gallery-col { min-width: 0; }
    .detail-gallery { display: flex; flex-direction: column; gap: 1rem; }
    .detail-main-image { position: relative; display: grid; width: 100%; aspect-ratio: 1 / 1; place-items: center; overflow: hidden; border: 1px solid #e1e4da; border-radius: 16px; background: #fff; }
    .detail-main-image img { width: 100%; height: 100%; padding: clamp(1rem, 4vw, 3rem); object-fit: contain; }
    .detail-condition { position: absolute; z-index: 1; top: 1rem; left: 1rem; display: inline-flex; align-items: center; min-height: 26px; padding: 0 .75rem; border-radius: 999px; background: #16201b; color: #fff; font-size: .75rem; font-weight: 650; }
    .detail-image-empty { color: #65716a; font-size: .9rem; }
    .detail-thumbnails { display: flex; gap: .75rem; overflow-x: auto; padding: .1rem .1rem .25rem; }
    .detail-thumb { display: grid; width: 82px; height: 82px; flex: 0 0 82px; place-items: center; overflow: hidden; border: 1px solid #e1e4da; border-radius: 12px; background: #fff; cursor: pointer; }
    .detail-thumb.is-active, .detail-thumb:hover { border: 2px solid #16201b; }
    .detail-thumb img { width: 100%; height: 100%; padding: .35rem; object-fit: contain; }
    .detail-specifications { overflow: hidden; border: 1px solid #e1e4da; border-radius: 16px; background: #fff; }
    .detail-specifications summary { display: flex; min-height: 56px; align-items: center; justify-content: space-between; gap: 1rem; padding: 0 1.2rem; cursor: pointer; list-style: none; font-weight: 650; }
    .detail-specifications summary::-webkit-details-marker { display: none; }
    .detail-chevron { color: #65716a; transition: transform .18s ease; }
    .detail-specifications[open] .detail-chevron { transform: rotate(180deg); }
    .detail-specifications dl { margin: 0; padding: 0 1.2rem .5rem; }
    .detail-specifications dl > div { display: flex; justify-content: space-between; gap: 1rem; padding: .75rem 0; border-top: 1px solid #e1e4da; }
    .detail-specifications dt { color: #424e47; }
    .detail-specifications dd { margin: 0; text-align: right; font-weight: 600; }
    .detail-info-col { display: flex; min-width: 0; flex-direction: column; gap: 1.2rem; }
    .detail-product-heading { display: flex; flex-direction: column; gap: .75rem; }
    .detail-brand-sku { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: .5rem; }
    .detail-brand-sku a { color: #1f4d3a; font-size: .75rem; font-weight: 750; letter-spacing: .12em; text-decoration: none; text-transform: uppercase; }
    .detail-store-name { color: #1f4d3a; font-size: .75rem; font-weight: 750; letter-spacing: .12em; text-transform: uppercase; }
    .detail-brand-sku span { color: #65716a; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: .75rem; }
    .detail-product-heading h1 { margin: 0; color: #16201b; font-size: clamp(2rem, 3.3vw, 2.65rem); font-weight: 750; letter-spacing: -.04em; line-height: 1.12; text-wrap: balance; }
    .detail-product-meta { display: flex; flex-wrap: wrap; align-items: center; gap: .4rem .65rem; color: #424e47; font-size: .85rem; }
    .stock-dot { width: 8px; height: 8px; border-radius: 50%; background: #a8231b; }
    .stock-dot.is-available { background: #1f7a4d; }
    .detail-price-panel { display: flex; flex-direction: column; gap: .45rem; padding: 1.2rem; border: 1px solid #e1e4da; border-radius: 16px; background: #fff; }
    .detail-price-row { display: flex; flex-wrap: wrap; align-items: baseline; gap: .45rem .85rem; }
    .detail-price { color: #16201b; font-size: clamp(1.8rem, 3vw, 2.35rem); font-variant-numeric: tabular-nums; letter-spacing: -.04em; line-height: 1.15; }
    .detail-price-old { color: #65716a; font-size: 1.1rem; text-decoration: line-through; }
    .detail-discount { display: inline-flex; min-height: 26px; align-items: center; padding: 0 .65rem; border-radius: 999px; background: #fbe9e7; color: #a8231b; font-size: .8rem; font-weight: 750; }
    .detail-saving { margin: 0; color: #424e47; font-size: .85rem; }
    .detail-saving:first-letter { color: #16201b; }
    .detail-currency { margin: 0; color: #65716a; font-size: .75rem; }
    .detail-description { max-width: 60ch; margin: 0; color: #424e47; line-height: 1.7; }
    .detail-purchase { display: flex; flex-wrap: wrap; align-items: end; gap: .75rem; }
    .detail-quantity { display: flex; flex: 0 0 auto; flex-direction: column; gap: .35rem; color: #424e47; font-size: .75rem; font-weight: 650; }
    .detail-quantity > div { display: flex; height: 52px; align-items: center; border: 1px solid #c7ccbe; border-radius: 12px; background: #fff; }
    .detail-quantity button { width: 42px; height: 50px; border: 0; background: transparent; color: #16201b; font-size: 1.25rem; cursor: pointer; }
    .detail-quantity button:disabled { color: #aeb5aa; cursor: not-allowed; }
    .detail-quantity input { width: 42px; min-height: auto !important; padding: 0 !important; border: 0 !important; border-radius: 0 !important; background: transparent !important; text-align: center; font-weight: 650; }
    .detail-quantity input::-webkit-inner-spin-button, .detail-quantity input::-webkit-outer-spin-button { appearance: none; margin: 0; }
    .detail-add-button { display: flex; min-width: 200px; min-height: 52px; flex: 1 1 220px; align-items: center; justify-content: center; gap: .5rem; padding: .65rem 1rem; border: 0; border-radius: 12px; background: #16201b; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
    .detail-add-button:hover { background: #2a372f; }
    .detail-add-button:disabled { background: #879189; cursor: not-allowed; }
    .detail-add-button[aria-busy="true"] { opacity: .75; }
    .detail-cart-message { padding: .8rem 1rem; border: 1px solid #cfe0d5; border-radius: 12px; background: #e4eee8; color: #1f4d3a; }
    .detail-cart-message a { color: inherit; font-weight: 700; }
    .detail-trust-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1rem; margin: 0; padding: 0; list-style: none; }
    .detail-trust-list li { display: flex; align-items: flex-start; gap: .75rem; }
    .detail-trust-list li > span { display: grid; width: 40px; height: 40px; flex: 0 0 40px; place-items: center; border-radius: 10px; background: #e4eee8; color: #1f4d3a; font-size: 1.1rem; }
    .detail-trust-list strong { display: block; font-weight: 650; }
    .detail-trust-list p { margin: .15rem 0 0; color: #424e47; font-size: .8rem; line-height: 1.45; }
    .shipping-coverage-widget { margin-top: 0 !important; padding: 1.2rem !important; border-color: #cfe0d5 !important; border-radius: 16px !important; background: #e4eee8 !important; }
    .shipping-coverage-widget h3 { font-size: 1rem !important; }
    .shipping-coverage-widget input { background: #fff !important; color: #16201b !important; }
    .shipping-coverage-widget button { border-radius: 12px !important; background: #16201b !important; }
    .sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    @media (max-width: 900px) { .detail-layout { grid-template-columns: minmax(0, 1fr); gap: 2rem; } .detail-gallery-col { max-width: 720px; width: 100%; margin: 0 auto; } }
    @media (max-width: 560px) { .detail-trust-list { grid-template-columns: minmax(0, 1fr); } .detail-purchase { align-items: stretch; } .detail-add-button { flex-basis: 100%; } .detail-specifications dl > div { flex-direction: column; gap: .2rem; } .detail-specifications dd { text-align: left; } }
    @media (prefers-reduced-motion: reduce) { .detail-chevron, .detail-thumb { transition: none; } }
`;
