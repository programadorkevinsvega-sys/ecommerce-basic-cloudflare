export const storefrontNotFoundStyles = String.raw`
  .storefront-not-found,.collections-unavailable { max-width:760px; margin:2rem auto 3rem; padding:clamp(1.5rem,5vw,3.5rem); border:1px solid var(--border); border-radius:var(--radius-lg); background:var(--card); text-align:center; box-shadow:var(--shadow-soft); }
  .not-found-code { display:inline-flex; align-items:center; min-height:30px; margin-bottom:1rem; padding:0 .75rem; border-radius:999px; background:#edf1eb; color:#4d5d50; font-size:.75rem; font-weight:800; letter-spacing:.08em; }
  .storefront-not-found h1,.collections-unavailable h1 { margin:0 0 .8rem; font-size:clamp(2rem,5vw,3.2rem); }
  .storefront-not-found p,.collections-unavailable p { max-width:52ch; margin:0 auto 1.4rem; color:var(--muted); line-height:1.65; }
  .not-found-links { display:flex; justify-content:center; flex-wrap:wrap; gap:.7rem; }
  .not-found-links a { display:inline-flex; min-height:44px; align-items:center; justify-content:center; padding:0 1rem; border:1px solid var(--border); border-radius:10px; color:var(--text); font-weight:700; text-decoration:none; }
  .not-found-links a:first-child { border-color:var(--primary); background:var(--primary); color:#fff; }
  .not-found-links a:hover { filter:brightness(.94); }
  .collection-directory-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:1rem; }
  .collection-directory-card { display:flex; min-height:220px; flex-direction:column; align-items:flex-start; justify-content:flex-end; gap:.65rem; overflow:hidden; padding:1.5rem; border:1px solid var(--border); border-radius:var(--radius-lg); background:linear-gradient(145deg,#fff,#f1f4ec); color:var(--text); text-decoration:none; box-shadow:var(--shadow-soft); }
  .collection-directory-card img { width:calc(100% + 3rem); height:180px; margin:-1.5rem -1.5rem .5rem; object-fit:cover; }
  .collection-directory-card h2 { margin:0; font-size:1.5rem; }
  .collection-directory-card p { margin:0; color:var(--muted); line-height:1.5; }
  .collection-directory-card>span:last-child { margin-top:.5rem; font-weight:750; }
  .collection-directory-card:hover { border-color:#aab99b; transform:translateY(-2px); }
  .collection-pagination { display:flex; justify-content:center; align-items:center; gap:1rem; margin:1.5rem 0; }
  .collection-pagination a { padding:.7rem 1rem; border:1px solid var(--border); border-radius:9px; color:var(--text); text-decoration:none; }
  .collection-detail-hero { display:grid; grid-template-columns:minmax(0,1fr) minmax(240px,.75fr); align-items:center; gap:2rem; margin:0 0 2rem; padding:clamp(1.6rem,5vw,3.5rem); border:1px solid var(--border); border-radius:var(--radius-lg); background:linear-gradient(135deg,#e9eee3,#fff); }
  .collection-detail-hero img { width:100%; max-height:320px; border-radius:var(--radius-md); object-fit:cover; }
  .collection-detail-copy { min-width:0; }
  .collection-detail-hero h1 { margin:0 0 .6rem; font-size:clamp(2.2rem,5vw,4rem); }
  .collection-detail-hero p { max-width:65ch; margin:0; color:var(--muted); line-height:1.65; }
  .collection-products-empty { padding:2rem; border:1px solid var(--border); border-radius:var(--radius-md); background:var(--card); text-align:center; color:var(--muted); }
  @media(max-width:760px) { .collection-directory-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media(max-width:650px) { .collection-detail-hero { grid-template-columns:1fr; gap:1rem; }.collection-detail-hero img { max-height:240px; } }
  @media(max-width:520px) { .collection-directory-grid { grid-template-columns:1fr; } }
`;
