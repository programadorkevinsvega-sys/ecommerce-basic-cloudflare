export const storefrontProductStyles = String.raw`
    /* Product cards: quiet, image-first and commerce-focused */
    .grid { align-items: stretch; gap: 1.5rem; }
    .product-card-v2 {
      position: relative; border: 1px solid #e2e5df; border-radius: 16px; background: #fff;
      display: flex; flex-direction: column; overflow: hidden;
      transition: transform .22s cubic-bezier(.16,1,.3,1), box-shadow .22s cubic-bezier(.16,1,.3,1), border-color .22s ease;
    }
    .product-card-v2:hover {
      transform: translateY(-4px); border-color: #c7d4c2;
      box-shadow: 0 16px 36px -12px rgba(23,36,29,.09), 0 4px 12px -2px rgba(23,36,29,.04);
    }
    .product-card-v2 .product-media {
      position: relative; aspect-ratio: 1 / 1; padding: 1.25rem; background: #f8f9f6;
      display: grid; place-items: center; border-bottom: 1px solid #edf1eb; text-decoration: none;
    }
    .product-card-v2 .product-media img {
      max-height: 100%; width: auto; object-fit: contain; mix-blend-mode: multiply;
      transition: transform .35s cubic-bezier(.16,1,.3,1);
    }
    .product-card-v2:hover .product-media img { transform: scale(1.05); }
    .card-discount-badge {
      position: absolute; top: .75rem; right: .75rem; z-index: 3;
      padding: .28rem .58rem; border-radius: 6px; background: #dc2626; color: #ffffff;
      font-size: .72rem; font-weight: 800; letter-spacing: -.01em; box-shadow: 0 2px 6px rgba(220,38,38,.25);
    }
    .product-card-v2 .card-body {
      display: flex; flex-direction: column; padding: 1.15rem; gap: .55rem; flex: 1;
    }
    .card-eyebrow {
      display: flex; justify-content: space-between; align-items: center; font-size: .72rem; color: #78857a;
    }
    .card-brand { font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #4e5e51; }
    .card-sku { font-family: monospace; font-size: .68rem; color: #94a397; }
    .product-card-v2 .card-title {
      margin: 0; font-size: 1.02rem; font-weight: 750; line-height: 1.35; letter-spacing: -.02em;
    }
    .product-card-v2 .card-title a { color: #17241d; text-decoration: none; }
    .product-card-v2 .card-title a:hover { color: #285432; }
    .card-pricing-block {
      display: flex; flex-direction: column; align-items: stretch; gap: .1rem; margin-top: auto; padding-top: .4rem;
    }
    .card-price-group { display: flex; flex-wrap: wrap; align-items: baseline; column-gap: .45rem; row-gap: .1rem; min-width: 0; }
    .card-price-sale { color: #dc2626; font-weight: 850; font-size: 1.22rem; }
    .card-price-old { font-size: .88rem; color: #8c998e; text-decoration: line-through; }
    .card-stock-indicator { width: 100%; text-align: right; line-height: 1.25; font-size: .72rem; font-weight: 600; color: #2c6e43; }
    .card-stock-indicator.stock-low { color: #b45309; }
    .product-card-v2 .product-card-footer {
      display: flex; flex-direction: column; gap: .65rem; padding-top: .65rem; border-top: 1px solid #f0f3ed;
    }
    .card-shipping-bullet {
      display: flex; align-items: center; gap: .45rem; font-size: .72rem; color: #69776b;
    }
    .bullet-dot { width: 5px; height: 5px; border-radius: 50%; background: #287448; }
    .card-actions-group { display: grid; grid-template-columns: 1fr auto; gap: .5rem; }
    .btn-action-cart {
      display: inline-flex; align-items: center; justify-content: center; gap: .45rem;
      padding: .65rem .95rem; border-radius: 9px; border: none; cursor: pointer;
      background: #17241d; color: #fff; font-size: .84rem; font-weight: 750;
      transition: background .16s ease;
    }
    .btn-action-cart:hover { background: #2b3f33; }
    .btn-action-view {
      display: inline-flex; align-items: center; justify-content: center;
      padding: .65rem .85rem; border-radius: 9px; border: 1px solid #dce2d8;
      background: #f7f9f5; color: #354739; font-size: .82rem; font-weight: 650; text-decoration: none;
    }
    .btn-action-view:hover { background: #edf2ea; }
    .product-card-v2 .card-body { padding: 1rem; }
    .product-card-v2 .card-title { min-height: 2.7em; font-size: .98rem; }
    .card-brand { color: #718078; font-size: .67rem; }
    .product-card-v2 .product-card-footer { border-top: 0; }
    .card-actions-group { grid-template-columns: 1fr; }
    .btn-action-cart { border-radius: 999px; background: #1f4d3a; }
    .btn-action-cart:hover { background: #2b624b; }
    .btn-action-view { display: none; }
    .card-discount-badge { border-radius: 999px; background: #e6eee0; color: #305b3e; box-shadow: none; }
    .card-stock-indicator { color: #65716a; }

    /* DETAIL VIEW 2-COLUMN STARTUP LAYOUT & GALLERY */
    .detail-breadcrumb {
      display: flex; align-items: center; gap: .5rem; margin-bottom: 1.5rem;
      font-size: .82rem; color: #728075;
    }
    .detail-breadcrumb a { color: #536456; text-decoration: none; }
    .detail-breadcrumb a:hover { color: #17241d; text-decoration: underline; }
    .detail-breadcrumb .sep { color: #b2beb4; }
    .detail-breadcrumb .current { color: #17241d; font-weight: 600; }
    .detail-grid-layout {
      display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1.15fr); gap: 3.5rem;
      align-items: start; background: transparent; padding: .5rem 0 3rem;
    }
    .detail-gallery-col { display: flex; flex-direction: column; gap: 1.25rem; position: sticky; top: 2rem; }
    .detail-media-card {
      width: 100%; aspect-ratio: 1 / 1; border-radius: 20px; overflow: hidden;
      background: #ffffff; border: 1px solid #e1e7de; box-shadow: 0 4px 20px rgba(23,36,29,.04);
      display: grid; place-items: center; padding: 2rem;
    }
    .detail-media-card img { width: 100%; height: 100%; object-fit: contain; transition: opacity .2s ease; }
    .detail-media-empty { background: #f6f8f3; color: #7a867c; text-align: center; font-weight: 700; }
    .detail-thumbnails-row {
      display: flex; gap: .75rem; overflow-x: auto; padding-bottom: .25rem;
    }
    .detail-thumb-btn {
      width: 68px; height: 68px; flex-shrink: 0; border-radius: 12px; border: 2px solid #e1e7de;
      background: #ffffff; padding: 4px; cursor: pointer; overflow: hidden; transition: border-color .15s ease, transform .15s ease;
    }
    .detail-thumb-btn:hover { border-color: #2c6e43; transform: translateY(-2px); }
    .detail-thumb-btn.is-active { border-color: #17241d; box-shadow: 0 0 0 1px #17241d; }
    .detail-thumb-btn img { width: 100%; height: 100%; object-fit: contain; }
    .detail-specs-card {
      background: #fff; border: 1px solid #e1e7de; border-radius: 16px; padding: 1.5rem;
    }
    .detail-specs-card h3 { margin: 0 0 1rem; font-size: .95rem; font-weight: 750; color: #17241d; }
    .specs-grid-list { list-style: none; padding: 0; margin: 0; display: grid; gap: .6rem; font-size: .85rem; }
    .specs-grid-list li { display: flex; justify-content: space-between; border-bottom: 1px dashed #e8ede5; padding-bottom: .4rem; }
    .specs-grid-list strong { color: #57685a; }

    .detail-info-col { display: flex; flex-direction: column; gap: 1.5rem; }
    .detail-brand-sku { display: flex; align-items: center; justify-content: space-between; }
    .brand-name { font-size: .8rem; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; color: #3b5f41; }
    .sku-tag { font-family: monospace; font-size: .76rem; color: #879489; background: #eef2ec; padding: .2rem .5rem; border-radius: 6px; }
    .detail-main-title { margin: .35rem 0 0; font-size: clamp(2rem, 3.2vw, 2.75rem); line-height: 1.12; font-weight: 850; letter-spacing: -.035em; color: #17241d; }
    .detail-chips-row { display: flex; flex-wrap: wrap; gap: .45rem; margin-top: .75rem; }
    .detail-chip { font-size: .74rem; font-weight: 650; padding: .3rem .65rem; border-radius: 8px; background: #f0f4ee; color: #364839; border: 1px solid #dce3d8; }
    .chip-stock { background: #e8f5ec; color: #196131; border-color: #c4e4cd; }
    .chip-out { background: #fdf2f2; color: #991b1b; border-color: #fecaca; }
    .chip-accent { background: #17241d; color: #c8f169; border-color: #17241d; }
    .detail-pricing-panel { padding: 1.25rem; background: #ffffff; border: 1px solid #e1e7de; border-radius: 14px; }
    .detail-pricing-panel .detail-price { margin: 0; font-size: 2.1rem; font-weight: 850; letter-spacing: -.04em; color: #17241d; }
    .detail-payment-note { font-size: .74rem; color: #768579; margin-top: .4rem; }
    .detail-lead-desc { font-size: .98rem; line-height: 1.65; color: #435246; margin: 0; }
    .detail-purchase-box {
      background: #ffffff; border: 1px solid #e1e7de; border-radius: 16px; padding: 1.5rem;
      box-shadow: 0 10px 25px -8px rgba(23,36,29,.05);
    }
    .purchase-actions-row { display: grid; grid-template-columns: 88px 1fr; gap: 1rem; align-items: end; }
    .qty-field-group label { display: block; font-size: .74rem; font-weight: 700; color: #5b6c5e; margin-bottom: .35rem; }
    .qty-field-group input { width: 100%; height: 48px; border: 1px solid #ccd6c8; border-radius: 10px; text-align: center; font-size: 1.05rem; font-weight: 700; }
    .btn-primary-commerce {
      height: 48px; width: 100%; border: none; border-radius: 10px; background: #17241d; color: #fff;
      font-size: 1rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: .6rem;
      transition: background .16s ease, transform .12s ease;
    }
    .btn-primary-commerce:hover { background: #263c2e; }
    .cart-feedback-banner { margin-top: 1rem; padding: .75rem 1rem; border-radius: 10px; background: #eaf6ee; color: #15622e; font-size: .88rem; font-weight: 650; }
    .detail-trust-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .trust-item {
      display: flex; gap: .8rem; padding: 1rem; background: #ffffff; border: 1px solid #e1e7de; border-radius: 12px; font-size: .78rem; color: #57675a;
    }
    .trust-item strong { display: block; color: #17241d; font-size: .82rem; margin-bottom: .15rem; }
    .trust-icon { font-size: 1.3rem; line-height: 1; }

    @media (max-width: 900px) {
      .detail-grid-layout { grid-template-columns: 1fr; gap: 2rem; }
      .detail-gallery-col { position: static; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 520px) {
      .grid { grid-template-columns: 1fr; }
      .purchase-actions-row { grid-template-columns: 1fr; }
      .detail-trust-cards { grid-template-columns: 1fr; }
    }
`;
