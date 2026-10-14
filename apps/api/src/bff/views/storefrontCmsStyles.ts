export const storefrontCmsStyles = String.raw`
  .cms-page-shell { max-width: 900px; margin: 0 auto; }
  .cms-breadcrumb { display:flex; flex-wrap:wrap; align-items:center; gap:.55rem; margin:0 0 1.5rem; color:var(--muted); font-size:.84rem; }
  .cms-breadcrumb a { color:var(--primary); font-weight:700; text-decoration:none; }
  .cms-page-heading { padding:clamp(1.5rem,4vw,3rem); margin-bottom:1.25rem; overflow:hidden; border:1px solid #dfe7d8; border-radius:var(--radius-lg); background:linear-gradient(120deg,#edf3e7 0%,#fff 78%); }
  .cms-page-eyebrow { color:#526d3d; font-size:.72rem; font-weight:800; letter-spacing:.14em; text-transform:uppercase; }
  .cms-page-heading h1 { max-width:760px; margin:.55rem 0 .8rem; font-size:clamp(2rem,4.7vw,3.5rem); }
  .cms-page-heading p { margin:0; max-width:650px; color:var(--muted); }
  .cms-page-content { padding:clamp(1.25rem,4vw,3rem); border:1px solid var(--border); border-radius:var(--radius-lg); background:var(--card); box-shadow:var(--shadow-soft); }
  .cms-page-content .cms-block { margin:0 0 1.4rem; }
  .cms-page-content .cms-block:last-child { margin-bottom:0; }
  .cms-page-content .cms-rich-text { color:#3f4a42; font-size:1rem; line-height:1.8; }
  .cms-page-content h2,.cms-page-content h3 { margin:1.8rem 0 .65rem; color:var(--primary); font-size:1.25rem; letter-spacing:-.025em; }
  .cms-page-content h2:first-child,.cms-page-content h3:first-child { margin-top:0; }
  .cms-page-content p { margin:.65rem 0; }
  .cms-page-content ul,.cms-page-content ol { padding-left:1.35rem; }
  .cms-page-content li { margin:.35rem 0; }
  .cms-page-content a { color:#285c3e; font-weight:650; }
  .cms-page-content blockquote { margin:1rem 0; padding:.8rem 1rem; border-left:3px solid #8cae83; border-radius:0 10px 10px 0; background:#f4f7f0; }
  .cms-page-content .cms-faq-item { padding:1rem 0; border-bottom:1px solid var(--border); }
  .cms-page-content .cms-faq-item:last-child { border-bottom:0; }
  .cms-page-content .cms-faq-item summary { color:var(--primary); font-weight:750; cursor:pointer; }
  .cms-page-content .cms-faq-item p { color:var(--muted); }
  .cms-page-back { margin-top:1.25rem; text-align:center; }
  .cms-page-back a { display:inline-flex; min-height:44px; align-items:center; padding:.6rem 1rem; border:1px solid var(--border); border-radius:999px; background:#fff; color:var(--primary); font-weight:700; text-decoration:none; }
  @media(max-width:600px) { .cms-page-shell { width:100%; }.cms-page-heading,.cms-page-content { border-radius:16px; } }
  @media(prefers-reduced-motion:reduce) { .cms-page-shell *, .cms-page-shell *::before, .cms-page-shell *::after { scroll-behavior:auto!important; transition:none!important; } }
`;
