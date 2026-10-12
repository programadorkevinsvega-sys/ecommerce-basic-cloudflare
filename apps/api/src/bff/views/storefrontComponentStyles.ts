export const storefrontComponentStyles = String.raw`
    .collection-hero {
      position: relative; display: flex; align-items: flex-end; justify-content: space-between; gap: 2rem;
      min-height: 260px; margin-bottom: 1.4rem; padding: clamp(1.4rem, 4vw, 3rem);
      overflow: hidden; background: #e9eee3; border: 1px solid #e0e7d9; border-radius: var(--radius-lg);
    }
    .collection-copy { position: relative; z-index: 1; max-width: 720px; }
    .collection-copy h1 { max-width: 700px; margin: 0 0 1rem; font-size: clamp(2.35rem, 5.5vw, 4.6rem); line-height: .99; white-space: pre-line; }
    .collection-copy p { max-width: 560px; margin: 0; color: #536258; font-size: clamp(.98rem, 1.6vw, 1.12rem); }
    .collection-note {
      display: flex; align-items: center; gap: .8rem; flex-shrink: 0; padding: 1rem 1.1rem;
      background: rgba(255,255,255,.7); border: 1px solid rgba(23,36,29,.08); border-radius: 16px;
      color: #647066; font-size: .78rem; line-height: 1.5;
    }
    .collection-note strong { color: var(--text); font-size: .88rem; }
    .note-mark { display: grid; place-items: center; width: 3rem; height: 3rem; border-radius: 12px; background: var(--accent); color: var(--primary); font-size: 1.2rem; font-weight: 900; }
    .campaign-carousel {
      display: flex; gap: 1rem; margin-bottom: 2rem; overflow-x: auto; overscroll-behavior-inline: contain;
      scroll-snap-type: x mandatory; scroll-padding-inline: .25rem; padding: .25rem .25rem .85rem;
      scrollbar-width: thin; scrollbar-color: #b9c4b2 transparent;
    }
    .campaign-carousel > .campaign-banner { flex: 0 0 min(92%, 1080px); min-width: 0; margin: 0; scroll-snap-align: start; }
    .campaign-carousel:focus-visible { outline: 3px solid #6b9d26; outline-offset: 3px; }
    .campaign-banner {
      display: grid; grid-template-columns: minmax(0, 1fr) minmax(220px, .8fr); align-items: stretch;
      overflow: hidden; margin-bottom: 2rem; background: var(--primary); color: #fff; border-radius: var(--radius-lg);
    }
    .campaign-copy { padding: clamp(1.4rem, 4vw, 2.8rem); align-self: center; }
    .campaign-copy .eyebrow { color: var(--accent); }
    .campaign-copy h2 { margin: 0 0 .75rem; color: #fff; font-size: clamp(1.65rem, 3vw, 2.6rem); }
    .campaign-copy p { max-width: 540px; margin: 0 0 1.2rem; color: #d2dcd1; }
    .campaign-action, .product-action {
      display: flex; align-items: center; justify-content: space-between; gap: 1rem; width: fit-content;
      padding: .78rem 1rem; border-radius: 10px; background: var(--accent); color: var(--primary);
      text-decoration: none; font-size: .9rem; font-weight: 800;
    }
    .campaign-action:hover, .product-action:hover { background: #d7f994; }
    .campaign-image { min-height: 240px; background: #34473a; }
    .campaign-image-missing { display: grid; place-items: center; color: #d2dcd1; }
    .campaign-image-missing::after { content: 'Imagen de colección no disponible'; padding: 1rem; text-align: center; font-size: .9rem; }
    .campaign-image img { width: 100%; height: 100%; object-fit: cover; }
    .search-label { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
    .clear-search { display: inline-flex; align-items: center; padding: 0 .9rem; color: var(--muted); font-size: .88rem; font-weight: 700; text-decoration: none; }
    .clear-search:hover { color: var(--text); }
    .product-action { width: 100%; margin-top: auto; background: #eef2e8; }
    .card-body > div:first-child { display: flex; flex-wrap: wrap; gap: .3rem; }
    .detail-view .detail-title { overflow-wrap: anywhere; }
    .container a:not(.product-action):not(.campaign-action):not(.brand-link):not(.site-nav a) { text-underline-offset: .22em; }
    @media (max-width: 1050px) {
      .grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .site-header { padding-inline: 1.25rem; }
      .checkout-grid { grid-template-columns: minmax(0, 1fr) 300px !important; }
    }
    @media (max-width: 760px) {
      .collection-hero { min-height: 0; flex-direction: column; align-items: flex-start; gap: 1.5rem; }
      .collection-note { width: 100%; }
      .campaign-banner { grid-template-columns: minmax(0, 1fr); }
      .campaign-carousel > .campaign-banner { flex-basis: 94%; }
      .campaign-image { min-height: 190px; max-height: 260px; }
      .campaign-image img { max-height: 260px; }
      .site-header { align-items: flex-start; flex-direction: column; gap: .8rem; padding: .9rem 1rem; }
      .site-nav { width: 100%; justify-content: flex-start; gap: .15rem; }
      .site-nav a { min-height: 40px; padding: .45rem .65rem; font-size: .84rem !important; }
      .site-nav .customer-email { display: none; }
      .container { width: min(100% - 2rem, var(--content-width)); padding: 1.7rem 0 3rem; }
      .grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .75rem; }
      .card-body { padding: .9rem; }
      .card-title { font-size: .98rem; }
      .card-price { font-size: 1.2rem; }
      .tag { font-size: .6rem; }
      .checkout-grid { grid-template-columns: minmax(0, 1fr) !important; }
      .container [style*="grid-template-columns: 1fr 1fr"] { grid-template-columns: minmax(0, 1fr) !important; }
      .container form { padding: 1rem !important; }
      .site-footer { padding: 2.25rem 1rem 1.5rem; }
    }
    @media (max-width: 420px) {
      .collection-hero { padding: 1.2rem; border-radius: 20px; }
      .collection-copy h1 { font-size: clamp(2.1rem, 11vw, 2.8rem); }
      .collection-note { padding: .8rem; }
      .campaign-copy { padding: 1.3rem; }
      .container { width: min(100% - 1.25rem, var(--content-width)); }
      .grid { gap: .55rem; }
      .card-body { padding: .72rem; }
      .search-bar { gap: .3rem; }
      .search-bar button { padding-inline: .8rem; }
      .container td, .container th { padding: .65rem .45rem; }
    }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { scroll-behavior: auto !important; transition-duration: .01ms !important; animation-duration: .01ms !important; }
    }    /* Product cards: quiet, image-first and commerce-focused */
    .grid { align-items: stretch; gap: 1.35rem; }
    .card {
      position: relative; border: 1px solid #e9eae5; border-radius: 14px; box-shadow: none;
      background: #fff; transition: border-color .18s ease, box-shadow .18s ease;
    }
    .card:hover { transform: none; border-color: #cbd2c5; box-shadow: 0 10px 28px rgba(23,36,29,.07); }
    .product-media {
      position: relative; aspect-ratio: 4 / 4.5; padding: .6rem; background: #f5f6f2;
      border-bottom: 1px solid #ecefe8;
    }
    .product-media img { object-fit: contain; mix-blend-mode: multiply; transition: transform .25s ease; }
    .card:hover .product-media img { transform: scale(1.025); }
    .product-media-placeholder { display: grid; place-items: center; width: 100%; height: 100%; color: #a0a49b; font-size: .72rem; letter-spacing: .14em; }
    .product-promo { position: absolute; top: .8rem; left: .8rem; }
    .tag { padding: .22rem .42rem; font-size: .62rem; letter-spacing: .02em; }
    .tag-promo { background: #202a22; color: #fff; }
    .tag-payment { background: #f5eee7; color: #80512f; }
    .tag-local { background: #f3f1e8; color: #75602b; }
    .tag-cod, .tag-scope { background: #edf3e8; color: #4a6240; }
    .card-body { gap: .48rem; padding: 1rem 1rem 1.05rem; }
    .product-meta { display: flex; flex-wrap: wrap; gap: .35rem; min-height: 1.5rem; }
    .product-availability { display: inline-flex; align-items: center; gap: .4rem; font-size: .73rem; font-weight: 750; }
    .product-availability > span { font-size: .58rem; }
    .product-availability.is-available { color: #287448; }
    .product-availability.is-unavailable { color: #9a453e; }
    .product-card-footer { display: flex; flex-direction: column; gap: .7rem; margin-top: auto; }
    .product-shipping-note { color: #727a70; font-size: .72rem; line-height: 1.4; }
    .card-title { margin: .1rem 0 0; font-size: 1rem; line-height: 1.35; letter-spacing: -.02em; }
    .card-desc { display: -webkit-box; overflow: hidden; -webkit-box-orient: vertical; -webkit-line-clamp: 2; min-height: 2.7em; color: #747a71; font-size: .83rem; line-height: 1.45; }
    .card-price { margin: .25rem 0 .35rem; font-size: 1.28rem; font-weight: 780; letter-spacing: -.04em; }
    .card-price-group { display: flex; flex-wrap: wrap; align-items: baseline; gap: .5rem; margin: .25rem 0 .35rem; }
    .card-price-group .card-price { margin: 0; }
    .card-price-sale { color: #253c29; }
    .card-price-old { color: #8a8e86; font-size: .84rem; text-decoration: line-through; }
    .product-action {
      width: 100%; margin-top: .35rem; padding: .72rem .85rem; border: 1px solid #dfe4da;
      border-radius: 9px; background: #fff; color: #253c29; font-size: .86rem; font-weight: 750;
    }
    .product-action:hover { background: #f1f5eb; border-color: #cbd7c1; }
    .product-badges { display: flex; flex-wrap: wrap; gap: .3rem; margin: .25rem 0 .4rem; }
    .badge-attr {
      display: inline-flex; align-items: center; gap: .25rem; padding: .18rem .45rem;
      border-radius: 6px; background: #f0f4ec; color: #324734; font-size: .7rem; font-weight: 600;
      border: 1px solid #dce4d6;
    }
    .badge-attr-highlight { background: #e8f3ea; color: #1e5a2f; border-color: #c7dec9; }
    .card-actions-group { display: flex; gap: .5rem; margin-top: .35rem; }
    .card-actions-group .product-action { margin-top: 0; }
    .btn-add-cart-card {
      background: var(--primary) !important; color: #fff !important; border-color: var(--primary) !important;
    }
    .btn-add-cart-card:hover { background: #283e2e !important; }
    @media (max-width: 760px) {
      .grid { gap: .8rem; }
      .product-media { padding: .65rem; }
      .card-body { gap: .4rem; padding: .8rem; }
      .product-meta { gap: .25rem; }
      .product-card-footer { gap: .55rem; }
      .product-shipping-note { font-size: .68rem; }
      .tag { font-size: .57rem; padding: .2rem .35rem; }
      .card-desc { font-size: .78rem; }
      .product-promo { top: .45rem; left: .45rem; }
    }
    @media (max-width: 420px) {
      .grid { gap: .55rem; }
      .card-body { padding: .68rem; }
      .card-title { font-size: .91rem; }
      .card-price { font-size: 1.08rem; }
      .product-action { padding: .62rem .65rem; font-size: .8rem; }
      .card-actions-group { flex-direction: column; }
    }
`;