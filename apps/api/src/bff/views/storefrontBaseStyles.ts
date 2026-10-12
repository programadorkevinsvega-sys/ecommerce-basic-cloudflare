export const storefrontBaseStyles = String.raw`    :root {
      color-scheme: light;
      --primary: #17241d;
      --accent: #c8f169;
      --accent-strong: #a6d842;
      --bg: #f6f7f2;
      --card: #ffffff;
      --text: #17241d;
      --muted: #66736a;
      --border: #e3e8df;
      --surface: #ffffff;
      --success: #18794e;
      --radius-sm: 10px;
      --radius-md: 18px;
      --radius-lg: 28px;
      --shadow-soft: 0 12px 35px rgba(23, 36, 29, .06);
      --content-width: 1240px;
    }
    *, *::before, *::after { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 16px;
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }
    img { display: block; max-width: 100%; }
    a { color: inherit; text-underline-offset: .2em; }
    a:focus-visible, button:focus-visible, input:focus-visible, select:focus-visible {
      outline: 3px solid #6b9d26;
      outline-offset: 3px;
    }
    button, input, select { font: inherit; }
    button, a { -webkit-tap-highlight-color: transparent; }
    .skip-link {
      position: absolute; z-index: 1000; left: 1rem; top: -5rem;
      padding: .75rem 1rem; border-radius: 8px; background: var(--accent); color: var(--primary);
      font-weight: 750;
    }
    .skip-link:focus { top: 1rem; }
    .announcement-bar {
      background: var(--primary) !important; color: #fff !important; text-align: center;
      padding: .55rem 1rem !important; font-size: .82rem !important; font-weight: 600 !important;
      letter-spacing: .015em;
    }
    .announcement-bar a { color: var(--accent) !important; margin-left: .45rem; }
    .site-header {
      position: relative; z-index: 10; display: flex; align-items: center; justify-content: space-between;
      gap: 1.5rem; padding: 1.05rem max(1.25rem, calc((100vw - var(--content-width)) / 2));
      background: rgba(255,255,255,.94) !important; color: var(--text) !important;
      border-bottom: 1px solid var(--border); backdrop-filter: blur(14px);
    }
    .brand-link {
      display: inline-flex; align-items: center; gap: .7rem; flex-shrink: 0;
      color: var(--text) !important; text-decoration: none; font-size: 1.18rem !important;
      font-weight: 850 !important; letter-spacing: -.055em;
    }
    .brand-mark {
      display: grid; place-items: center; width: 2.25rem; height: 2.25rem; border-radius: 9px;
      background: var(--accent); color: var(--primary); font-size: .92rem; letter-spacing: -.04em;
    }
    .site-nav { display: flex; align-items: center; justify-content: flex-end; gap: .3rem; flex-wrap: wrap; }
    .site-nav a {
      display: inline-flex; align-items: center; min-height: 42px; padding: .55rem .8rem;
      margin: 0 !important; border-radius: 999px; color: #48564d !important;
      text-decoration: none; font-size: .9rem !important; font-weight: 650 !important;
      transition: background .18s ease, color .18s ease;
    }
    .site-nav a:hover { background: #f0f4e9; color: var(--primary) !important; }
    .site-nav a[href="/carrito"] { background: var(--primary); color: #fff !important; }
    .site-nav a[href="/carrito"]:hover { background: #2c4134; }
    .site-nav .customer-email { color: var(--muted) !important; font-size: .82rem; padding-inline: .6rem; }
    .container { width: min(100% - 3rem, var(--content-width)); margin: 0 auto; padding: 2.5rem 0 4rem; }
    .page-intro { max-width: 760px; margin: 0 auto 2.25rem 0; }
    .eyebrow {
      display: inline-flex; align-items: center; gap: .5rem; margin-bottom: .8rem;
      color: #536b3e; font-size: .75rem; font-weight: 800; letter-spacing: .13em; text-transform: uppercase;
    }
    .eyebrow::before { content: ""; width: 1.3rem; height: 2px; background: var(--accent-strong); }
    h1, h2, h3, h4 { color: var(--text); line-height: 1.15; letter-spacing: -.045em; }
    h1 { font-size: clamp(2.25rem, 4.7vw, 4.3rem); font-weight: 780; }
    h2 { font-weight: 750; }
    p { overflow-wrap: anywhere; }
    .search-bar {
      display: flex; gap: .65rem; margin: 1.7rem 0 2rem; padding: .45rem;
      background: #fff; border: 1px solid var(--border); border-radius: 14px;
      box-shadow: 0 6px 20px rgba(23,36,29,.035);
    }
    .search-bar input {
      min-width: 0; flex: 1; padding: .8rem 1rem; border: 0 !important; border-radius: 10px !important;
      background: transparent !important; box-shadow: none !important;
    }
    .search-bar button, .button-primary {
      min-height: 46px; padding: .75rem 1.25rem; border: 0; border-radius: 10px;
      background: var(--primary); color: #fff; font-weight: 750; cursor: pointer;
    }
    .search-bar button:hover, .button-primary:hover { background: #304638; }
    .grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 1.1rem; }
    .card {
      min-width: 0; overflow: hidden; display: flex; flex-direction: column;
      background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-md);
      box-shadow: 0 2px 5px rgba(23,36,29,.02); transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
    }
    .card:hover { transform: translateY(-4px); border-color: #cbd5c5; box-shadow: var(--shadow-soft); }
    .product-media { position: relative; display: grid; place-items: center; aspect-ratio: 4 / 3; overflow: hidden; background: #edf0e9; }
    .product-media img { width: 100%; height: 100%; object-fit: cover; transition: transform .35s ease; }
    .card:hover .product-media img { transform: scale(1.035); }
    .product-media-placeholder { color: #788274; font-size: .8rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; }
    .card-body { flex: 1; display: flex; flex-direction: column; gap: .5rem; padding: 1.15rem; }
    .card-title { margin: .15rem 0; font-size: 1.05rem; letter-spacing: -.025em; }
    .card-title a { color: var(--text); text-decoration: none; }
    .card-title a:hover { text-decoration: underline; text-decoration-color: #8ca65d; }
    .card-desc { flex: 1; margin: 0; color: var(--muted); font-size: .88rem; line-height: 1.55; }
    .card-price { margin: .4rem 0 .55rem; color: var(--text); font-size: 1.35rem; font-weight: 820; letter-spacing: -.045em; }
    .tag { display: inline-flex; align-items: center; padding: .24rem .5rem; border-radius: 999px; font-size: .66rem; font-weight: 800; letter-spacing: .035em; text-transform: uppercase; }
    .tag-cod { background: #e8f5d7; color: #345b20; }
    .tag-scope { background: #edf1eb; color: #4d5d50; }
    .detail-view {
      width: 100%; max-width: 1040px; margin: 0 auto; padding: clamp(1.2rem, 4vw, 3rem);
      background: var(--card); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-soft);
    }
    .detail-title { margin: .4rem 0 .75rem; font-size: clamp(2rem, 4vw, 3.25rem); }
    .detail-sku { margin-bottom: 1rem; color: var(--muted); font-size: .86rem; line-height: 1.8; }
    .detail-price { margin-bottom: 1.3rem; color: var(--text); font-size: clamp(1.8rem, 3vw, 2.6rem); font-weight: 850; letter-spacing: -.05em; }
    .detail-policy, .shipping-coverage-widget { margin: 1.5rem 0; padding: 1.2rem; background: #f6f8f2 !important; border: 1px solid var(--border); border-radius: var(--radius-md); }
    .detail-policy p { margin: .45rem 0; }
    .detail-media {
      display: grid; place-items: center; width: 100%; max-height: 420px; min-height: 180px;
      margin-bottom: 2rem; overflow: hidden; border-radius: 20px; background: #f0f2eb;
    }
    .detail-media img { width: 100%; max-height: 420px; aspect-ratio: 16 / 7; object-fit: contain; }
    .detail-media-empty { color: #899285; font-size: .8rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    .quantity-control { display: flex; flex-direction: column; gap: .35rem; color: var(--muted); font-size: .78rem; font-weight: 750; }
    .quantity-control input { width: 88px !important; }
    .detail-view #btn-add-cart { min-height: 52px; background: var(--primary) !important; color: #fff !important; border-radius: 12px !important; }
    .detail-view #btn-add-cart:hover { background: #304638 !important; }
    .container div[style*="background: var(--surface)"],
    .container div[style*="background: var(--card)"],
    .container section[style*="background: var(--surface)"],
    .container form[style*="background: var(--surface)"] {
      background: var(--card) !important; border-color: var(--border) !important;
      border-radius: var(--radius-md) !important; box-shadow: var(--shadow-soft);
    }
    .container button[style*="background: var(--accent)"],
    .container a[style*="background: var(--accent)"] {
      background: var(--primary) !important; color: #fff !important; border-radius: 12px !important;
    }
    .container button[style*="background: var(--accent)"]:hover,
    .container a[style*="background: var(--accent)"]:hover { background: #304638 !important; }
    .container [style*="grid-template-columns: 1fr 1fr"] { min-width: 0; }
    .container [style*="grid-template-columns: 1fr 1fr"] > * { min-width: 0; }
    .container section { min-width: 0; }
    .container form, .container table, .container section > div { min-width: 0; }
    .container input:not([type="radio"]):not([type="checkbox"]), .container select {
      min-height: 46px; max-width: 100%; padding: .72rem .85rem; background: #fff !important;
      color: var(--text) !important; border: 1px solid #d7ded4 !important; border-radius: 10px !important;
    }
    .container input[type="radio"], .container input[type="checkbox"] { accent-color: #385b2a; }
    .container button { transition: background .18s ease, transform .18s ease; }
    .container button:active { transform: translateY(1px); }
    .container table { border-collapse: collapse; }
    .container th { color: var(--muted); font-size: .74rem; letter-spacing: .06em; }
    .container td, .container th { padding: 1rem; }
    .container [style*="position: sticky"] { top: 1.5rem !important; }
    .checkout-grid { grid-template-columns: minmax(0, 1fr) minmax(280px, 360px) !important; align-items: start; }
    .site-footer {
      margin-top: 1rem; padding: 3rem 1.5rem 2rem; background: var(--primary); color: #d1d9d0;
      text-align: center; font-size: .86rem;
    }
    .site-footer a { color: #edf7dc; text-decoration: none; }
    .site-footer a:hover { text-decoration: underline; }
    .footer-links { display: flex; justify-content: center; gap: .75rem 1.5rem; flex-wrap: wrap; margin-bottom: 1.25rem; }
    .footer-legal-links {
      display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: .65rem 1.4rem;
      width: min(100%, 760px); margin: 0 auto 1.25rem; padding-top: 1.1rem;
      border-top: 1px solid rgba(237,247,220,.2);
    }
    .footer-legal-links a { color: #bfcdbd; font-size: .8rem; }
    .site-footer p { margin: 0; color: #aebbb0; }`;
