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
      scroll-behavior: smooth;
    }
    .campaign-carousel > .campaign-banner { flex: 0 0 min(94%, 1120px); min-width: 0; margin: 0; scroll-snap-align: center; }
    .campaign-carousel:focus-visible { outline: 3px solid #6b9d26; outline-offset: 3px; }
    .campaign-banner {
      display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(260px, 0.85fr); align-items: stretch;
      overflow: hidden; margin-bottom: 2rem; background: linear-gradient(135deg, #121c17 0%, #1a2a22 100%);
      color: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(18, 28, 23, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.08); position: relative;
    }
    .campaign-copy { padding: clamp(1.8rem, 4.5vw, 3.2rem); align-self: center; z-index: 2; }
    .campaign-copy .eyebrow { color: var(--accent); font-size: 0.82rem; font-weight: 800; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 0.5rem; display: inline-block; }
    .campaign-copy h2 { margin: 0 0 .85rem; color: #fff; font-size: clamp(1.65rem, 3.2vw, 2.6rem); font-weight: 800; line-height: 1.18; letter-spacing: -0.03em; }
    .campaign-copy p { max-width: 540px; margin: 0 0 1.4rem; color: #d5ded8; font-size: 1rem; line-height: 1.55; }
    .campaign-action, .product-action {
      display: inline-flex; align-items: center; justify-content: center; gap: 0.6rem; width: fit-content;
      padding: .82rem 1.4rem; border-radius: 12px; background: var(--accent); color: var(--primary);
      text-decoration: none; font-size: .92rem; font-weight: 800; transition: all 0.2s ease;
      box-shadow: 0 4px 14px rgba(200, 241, 105, 0.25);
    }
    .campaign-action:hover, .product-action:hover { background: #d7f994; transform: translateY(-1px); box-shadow: 0 6px 18px rgba(200, 241, 105, 0.35); }
    .campaign-image { position: relative; min-height: 280px; width: 100%; height: 100%; overflow: hidden; background: #1a2921; }
    .campaign-image-missing { display: none; }
    .campaign-image img { width: 100%; height: 100%; object-fit: cover; object-position: center; display: block; }
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
    }
`;