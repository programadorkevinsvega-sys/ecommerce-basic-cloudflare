export function renderMenuAdminCss(): string {
  return `
    .admin-legacy-pane.menus-mode { --border:#e3e6ec; --muted:#636b7b; --card-bg:#fff; --text:#151a23; min-height:0; border-radius:0; padding:0; background:#f5f6f8; color:#151a23; }
    .menu-admin-screen { color:#151a23; }
    .menu-admin-heading,.menu-card-heading,.menu-footer-actions { display:flex; align-items:center; justify-content:space-between; gap:12px; }
    .menu-admin-heading { margin:0 0 18px; }
    .menu-admin-heading span { color:#687283; font-size:10px; font-weight:750; letter-spacing:.1em; }
    .menu-admin-heading h1 { margin:4px 0; font-size:24px; }
    .menu-admin-heading p,.menu-card-heading p { margin:4px 0 0; color:#636b7b; font-size:13px; }
    .menu-primary,.menu-secondary { min-height:40px; border:1px solid #cbd1db; border-radius:8px; padding:0 13px; background:#fff; color:#303744; font:inherit; font-size:12px; font-weight:650; cursor:pointer; }
    .menu-primary { border-color:#20563d; background:#20563d; color:#fff; }
    .menu-primary:hover { background:#17452f; }
    .menu-primary:disabled { opacity:.55; cursor:wait; }
    .menu-tabs { display:flex; gap:8px; margin-bottom:12px; border-bottom:1px solid #e3e6ec; }
    .menu-tabs button { padding:10px 15px; border:0; border-bottom:2px solid transparent; background:transparent; color:#596273; font:inherit; font-weight:650; cursor:pointer; }
    .menu-tabs button.active { border-color:#20563d; color:#20563d; }
    .menu-card { overflow:hidden; border:1px solid #e3e6ec; border-radius:12px; background:#fff; }
    .menu-card-heading { justify-content:flex-start; flex-wrap:wrap; padding:18px 20px; border-bottom:1px solid #e8eaf0; }
    .menu-card-heading>div { flex:1; min-width:220px; }
    .menu-card-heading h2 { margin:0; font-size:17px; }
    .menu-title-field { display:grid; gap:7px; max-width:520px; margin:18px 20px; color:#303744; font-size:12px; font-weight:650; }
    .menu-title-field input,.menu-item-row input,.menu-item-row select { min-height:38px; box-sizing:border-box; width:100%; border:1px solid #cbd1db; border-radius:7px; padding:0 10px; background:#fff; color:#151a23; font:inherit; font-size:13px; }
    .menu-items { display:grid; gap:10px; padding:0 20px 20px; }
    .menu-item-row { display:grid; grid-template-columns:minmax(150px,1.2fr) 125px minmax(170px,1.4fr) 145px auto; align-items:end; gap:9px; padding:13px; border:1px solid #e3e6ec; border-radius:9px; background:#fff; }
    .menu-item-row[data-depth="1"] { margin-left:22px; border-left:3px solid #dcebe2; }
    .menu-item-row[data-depth="2"] { margin-left:44px; border-left:3px solid #e8edf0; }
    .menu-item-row label { display:grid; gap:6px; min-width:0; color:#687283; font-size:10px; font-weight:700; }
    .menu-item-row label[hidden] { display:none; }
    .menu-row-actions { display:flex; gap:5px; }
    .menu-row-actions button { min-height:34px; border:1px solid #d5dae3; border-radius:7px; padding:0 9px; background:#fff; color:#394253; cursor:pointer; }
    .menu-row-actions .menu-remove { border-color:#efcfcc; color:#a23b33; }
    .menu-loading,.menu-empty { padding:22px; color:#636b7b; text-align:center; }
    .menu-message { min-height:20px; margin:0 20px; color:#a23b33; font-size:13px; }
    .menu-message.success { color:#20563d; }
    .menu-footer-actions { margin:0 20px; padding:14px 0 18px; border-top:1px solid #e8eaf0; }
    .menu-footer-actions span { color:#687283; font-size:12px; }
    @media(max-width:850px) { .menu-item-row { grid-template-columns:1fr 1fr; }.menu-item-row label:first-child,.menu-item-row label:nth-child(3) { grid-column:1/-1; }.menu-row-actions { grid-column:1/-1; } }
    @media(max-width:600px) { .menu-admin-heading,.menu-footer-actions { align-items:flex-start; flex-direction:column; }.menu-admin-heading .menu-primary,.menu-footer-actions .menu-primary { width:100%; }.menu-card-heading { align-items:flex-start; padding:14px; }.menu-title-field { margin:14px; }.menu-items { padding:0 14px 14px; }.menu-item-row[data-depth="1"] { margin-left:10px; }.menu-item-row[data-depth="2"] { margin-left:20px; } }
  `;
}
