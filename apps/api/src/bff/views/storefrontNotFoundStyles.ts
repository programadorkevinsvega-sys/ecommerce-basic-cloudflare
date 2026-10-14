export const storefrontNotFoundStyles = String.raw`
  .storefront-not-found,.collections-unavailable { max-width:760px; margin:2rem auto 3rem; padding:clamp(1.5rem,5vw,3.5rem); border:1px solid var(--border); border-radius:var(--radius-lg); background:var(--card); text-align:center; box-shadow:var(--shadow-soft); }
  .not-found-code { display:inline-flex; align-items:center; min-height:30px; margin-bottom:1rem; padding:0 .75rem; border-radius:999px; background:#edf1eb; color:#4d5d50; font-size:.75rem; font-weight:800; letter-spacing:.08em; }
  .storefront-not-found h1,.collections-unavailable h1 { margin:0 0 .8rem; font-size:clamp(2rem,5vw,3.2rem); }
  .storefront-not-found p,.collections-unavailable p { max-width:52ch; margin:0 auto 1.4rem; color:var(--muted); line-height:1.65; }
  .not-found-links { display:flex; justify-content:center; flex-wrap:wrap; gap:.7rem; }
  .not-found-links a { display:inline-flex; min-height:44px; align-items:center; justify-content:center; padding:0 1rem; border:1px solid var(--border); border-radius:10px; color:var(--text); font-weight:700; text-decoration:none; }
  .not-found-links a:first-child { border-color:var(--primary); background:var(--primary); color:#fff; }
  .not-found-links a:hover { filter:brightness(.94); }
`;
