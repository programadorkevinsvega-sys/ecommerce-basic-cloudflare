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
    .campaign-carousel-wrap { margin-bottom: 2rem; }
    .campaign-banner-single { margin-bottom: 2rem; }
    .campaign-carousel {
      display: flex; gap: 0; overflow: hidden; overscroll-behavior-inline: contain;
      scroll-snap-type: x mandatory; scroll-padding-inline: 0; padding: 0 0 .85rem;
      scrollbar-width: none; -ms-overflow-style: none; touch-action: pan-y;
      scroll-behavior: smooth;
    }
    .campaign-carousel::-webkit-scrollbar { display: none; }
    .campaign-carousel > .campaign-banner { flex: 0 0 min(94%, 1120px); min-width: 0; margin: 0; scroll-snap-align: center; }
    .campaign-carousel:focus-visible { outline: 3px solid #6b9d26; outline-offset: 3px; }
    .campaign-carousel-controls { display: flex; justify-content: flex-end; gap: .5rem; margin-top: .5rem; }
    .campaign-carousel-controls button { min-height: 2.75rem; padding: .5rem .9rem; border: 1px solid #657264; border-radius: .5rem; background: #fff; color: #17241d; cursor: pointer; }
    .campaign-carousel-controls button:focus-visible { outline: 3px solid #6b9d26; outline-offset: 2px; }
    @media (prefers-reduced-motion: reduce) { .campaign-carousel { scroll-behavior: auto; } }
    .campaign-banner {
      display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(260px, 0.85fr); align-items: stretch;
      overflow: hidden; margin-bottom: 2rem; background: linear-gradient(135deg, #121c17 0%, #1a2a22 100%);
      color: #fff; border-radius: 20px; box-shadow: 0 10px 30px rgba(18, 28, 23, 0.12);
      border: 1px solid rgba(255, 255, 255, 0.08); position: relative;
    }
    .site-header { display: grid; grid-template-columns: auto minmax(220px, 1fr) auto; gap: 1.5rem; padding-block: .85rem; background: #f3f4ef !important; border-bottom: 0; }
    .brand-link { font-size: 1rem !important; letter-spacing: .08em; font-weight: 850 !important; }
    .brand-link > span > span, .footer-brand .brand-link > span { color: #718078; font-weight: 550; }
    .header-search { display: flex; justify-self: center; width: min(100%, 410px); height: 44px; overflow: hidden; border: 1px solid #e1e5de; border-radius: 999px; background: #fff; }
    .header-search input { width: 100%; min-width: 0; padding: 0 1rem; border: 0; outline: 0; background: transparent; }
    .header-search button { width: 48px; flex: 0 0 48px; border: 0; background: transparent; color: #59655d; font-size: 1.5rem; cursor: pointer; }
    .site-nav { gap: .15rem; }
    .site-nav a { min-height: 40px; padding-inline: .7rem; font-size: .84rem !important; }
    .site-nav a.cart-link { gap: .45rem; padding-inline: 1rem; background: #1f4d3a; color: white !important; }
    .site-nav .customer-email { max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .container { padding-top: 1.5rem; }
    .campaign-carousel-wrap { margin-bottom: 2.6rem; }
    .campaign-carousel { gap: 0; padding: 0; overflow: hidden; }
    .campaign-carousel > .campaign-banner { flex-basis: 100%; }
    .campaign-banner { height: 380px; min-height: 380px; max-height: 380px; grid-template-columns: minmax(0, 1fr) minmax(320px, .85fr); margin: 0; border-radius: 20px; background: #1f4d3a; box-shadow: none; }
    .campaign-banner:not(:has(.campaign-image)) { grid-template-columns: 1fr; background-image: radial-gradient(ellipse at 90% 20%, rgba(220,233,202,.12), transparent 40%); }
    .campaign-copy { padding: clamp(2rem, 5vw, 4.2rem); }
    .campaign-copy .eyebrow { color: #dce9ca; letter-spacing: .13em; }
    .campaign-copy h2 { max-width: 600px; font-size: clamp(2.4rem, 5vw, 4.4rem); line-height: 1.02; letter-spacing: -.055em; }
    .campaign-copy p { color: #e2ebe4; font-size: 1.05rem; }
    .campaign-action { border-radius: 999px; background: #f3f4ef; color: #1f4d3a; box-shadow: none; }
    .campaign-action:hover { background: #fff; color: #1f4d3a; box-shadow: none; }
    .campaign-image { min-height: 380px; background: #315d49; }
    .campaign-image img { object-fit: cover; }
    .campaign-carousel-controls { margin-top: .8rem; }
    .campaign-carousel-controls button { min-height: 2.5rem; border-color: #cbd4cb; border-radius: 999px; background: transparent; color: #424e47; font-size: .82rem; font-weight: 600; }
    .brand-section, .products-section { margin: 2.8rem 0; }
    .section-heading { display: flex; align-items: end; justify-content: space-between; gap: 1rem; margin-bottom: 1.35rem; }
    .section-heading h1, .section-heading h2 { margin: 0; font-size: clamp(1.8rem, 3vw, 2.5rem); letter-spacing: -.045em; }
    .section-heading p { margin: .5rem 0 0; color: var(--muted); }
    .section-heading > a { flex: 0 0 auto; color: #1f4d3a; font-size: .9rem; font-weight: 750; text-decoration: none; }
    .brand-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
    .brand-tile { display: flex; min-height: 150px; flex-direction: column; justify-content: space-between; padding: 1.2rem; border: 1px solid #e1e5de; border-radius: 16px; background: #fff; text-decoration: none; transition: transform .2s ease, border-color .2s ease; }
    .brand-tile:hover { transform: translateY(-3px); border-color: #a9b8a8; }
    .brand-tile > span:first-child { color: #799276; font-size: 1.25rem; }
    .brand-tile strong { font-size: 1.1rem; }
    .brand-tile > span:last-child { color: var(--muted); font-size: .8rem; }
    .benefits-strip { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-top: 3rem; padding: 1.6rem; border: 1px solid #e1e5de; border-radius: 18px; background: #fff; }
    .benefits-strip article { display: flex; align-items: flex-start; gap: .85rem; padding: .3rem .8rem; }
    .benefits-strip article > span { display: grid; width: 2.5rem; height: 2.5rem; flex: 0 0 2.5rem; place-items: center; border-radius: 50%; background: #edf2e8; color: #1f4d3a; font-size: 1.2rem; }
    .benefits-strip strong { font-size: .92rem; }
    .benefits-strip p { margin: .2rem 0 0; color: var(--muted); font-size: .8rem; }
    .site-footer { margin-top: 4rem; padding: 3rem max(1.25rem, calc((100vw - var(--content-width)) / 2)) 1.5rem; text-align: left; }
    .footer-inner { display: grid; grid-template-columns: 1.5fr 1fr 1fr 1.25fr; gap: 2rem; max-width: var(--content-width); margin: 0 auto 2rem; }
    .footer-brand p { max-width: 260px; margin: .7rem 0 1rem; }
    .footer-column { display: flex; flex-direction: column; align-items: flex-start; gap: .55rem; }
    .footer-column h2 { margin: 0 0 .25rem; color: #fff; font-size: .9rem; letter-spacing: 0; }
    .footer-column a { color: #bfcdbd; font-size: .82rem; }
    .footer-link-pending { display:flex; align-items:baseline; flex-wrap:wrap; gap:.35rem; color:#bfcdbd; font-size:.82rem; }
    .footer-link-pending small { color:#a8b9a7; font-size:.66rem; font-weight:650; }
    .footer-contact address { color:#bfcdbd; font-size:.82rem; font-style:normal; line-height:1.65; }
    .footer-social-links { display:flex; align-items:center; gap:.55rem; }
    .footer-social-links a { display:grid; width:38px; height:38px; place-items:center; border:1px solid rgba(237,247,220,.28); border-radius:50%; color:#edf7dc; transition:background .16s ease,color .16s ease; }
    .footer-social-links a:hover { background:#edf7dc; color:#1f4d3a; }
    .footer-social-links svg { width:18px; height:18px; }
    .footer-links, .footer-legal-links { justify-content: flex-start; }
    .footer-copyright { max-width: var(--content-width); margin: 1rem auto 0 !important; padding-top: 1rem; border-top: 1px solid rgba(237,247,220,.2); }
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
    .campaign-image { position: relative; min-height: 0; max-height: 100%; width: 100%; height: 100%; overflow: hidden; background: #1a2921; }
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
      .site-header { grid-template-columns: 1fr auto; align-items: center; gap: .65rem; }
      .header-search { grid-column: 1 / -1; grid-row: 2; justify-self: stretch; width: 100%; }
      .site-nav { grid-column: 1 / -1; width: 100%; justify-content: flex-start; flex-wrap: wrap; }
      .site-nav .customer-email { display: none; }
      .site-nav a.cart-link { min-height: 38px; }
      .collection-hero { min-height: 0; flex-direction: column; align-items: flex-start; gap: 1.5rem; }
      .collection-note { width: 100%; }
      .campaign-banner { height: auto; min-height: 0; max-height: none; grid-template-columns: minmax(0, 1fr); grid-template-rows: auto 220px; }
      .campaign-carousel > .campaign-banner { flex-basis: 100%; }
      .campaign-image { height: 220px; min-height: 220px; max-height: 220px; }
      .campaign-image img { height: 100%; max-height: none; }
      .site-header { padding: .9rem 1rem; }
      .site-nav { width: auto; }
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
      .brand-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: .65rem; }
      .brand-tile { min-height: 125px; padding: .9rem; }
      .benefits-strip { grid-template-columns: 1fr; padding: 1rem; gap: .55rem; }
      .benefits-strip article { padding: .35rem; }
      .footer-inner { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 1.5rem 1rem; }
      .footer-brand { grid-column: 1 / -1; }
      .section-heading { align-items: flex-start; }
      .section-heading > a { font-size: .8rem; }
    }
    @media (max-width: 420px) {
      .campaign-banner { min-height: 0; }
      .campaign-copy h2 { font-size: clamp(2.15rem, 11vw, 3.25rem); }
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
