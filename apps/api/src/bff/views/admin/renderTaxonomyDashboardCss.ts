export function renderTaxonomyDashboardCss(): string {
  return `
    .admin-legacy-pane.taxonomies-mode { --border:#e3e6ec; --muted:#636b7b; --card-bg:#fff; --text:#151a23; --input-bg:#fff; min-height:0; border-radius:0; padding:0; background:#f5f6f8; color:#151a23; }
    .admin-main.taxonomies-page-active>.admin-topbar { display:none; }
    .admin-legacy-pane.taxonomies-mode .card { border-color:#e3e6ec; background:#fff; color:#151a23; box-shadow:none; }
    .taxonomy-screen { color:#151a23; }
    .admin-nav-link[data-tab="taxonomies"].active { background:#edf3ef; color:#24583e; }
    .taxonomy-screen button:focus-visible,.taxonomy-modal button:focus-visible,.taxonomy-modal input:focus-visible,.taxonomy-modal select:focus-visible,.taxonomy-modal textarea:focus-visible { outline:3px solid #8aa991; outline-offset:2px; }
    .taxonomy-heading { display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:space-between; gap:16px; margin:0 0 20px; }
    .taxonomy-heading h1 { margin:0; color:#151a23; font-size:24px; line-height:1.2; }
    .taxonomy-heading p { margin:4px 0 0; color:#636b7b; font-size:13px; }
    .taxonomy-page[hidden],.taxonomy-modal[hidden] { display:none!important; }
    .taxonomy-list-card { overflow:hidden; border:1px solid #e3e6ec; border-radius:12px; background:#fff; box-shadow:none; }
    .taxonomy-list-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 22px; }
    .taxonomy-list-heading h2 { margin:0; color:#151a23; font-size:17px; }
    .taxonomy-list-heading p { margin:5px 0 0; color:#737b89; font-size:12px; }
    .taxonomy-primary,.taxonomy-secondary,.taxonomy-danger { display:inline-flex; min-height:42px; align-items:center; justify-content:center; gap:7px; border:1px solid transparent; border-radius:9px; padding:0 15px; font:inherit; font-size:13px; font-weight:650; cursor:pointer; transition:background .16s ease,border-color .16s ease; }
    .taxonomy-primary { background:#151a23; color:#fff; }
    .taxonomy-primary:hover { background:#303744; }
    .taxonomy-secondary { border-color:#d5dae3; background:#fff; color:#394253; }
    .taxonomy-secondary:hover { background:#f4f6fa; }
    .taxonomy-danger { min-height:34px; border-color:#edd8d4; background:#fff; color:#99483e; font-size:12px; }
    .taxonomy-danger:hover { background:#fff6f4; }
    .taxonomy-table-scroll { overflow-x:auto; }
    .taxonomy-pagination { display:flex; justify-content:center; align-items:center; gap:12px; border-top:1px solid #e8eaf0; padding:12px; color:#586172; font-size:12px; }
    .taxonomy-row-actions { min-width:260px; white-space:nowrap; }
    .taxonomy-row-actions button { min-height:32px; margin:2px; padding:0 9px; font-size:11px; }
    .taxonomy-table { width:100%; min-width:620px; border-collapse:collapse; text-align:left; font-size:13px; }
    .taxonomy-table th { padding:12px 16px; border-top:1px solid #e8eaf0; border-bottom:1px solid #e3e6ec; background:#f8f9fb; color:#586172; font-size:10px; letter-spacing:.055em; text-transform:uppercase; }
    .taxonomy-table td { padding:14px 16px; border-bottom:1px solid #eef0f4; color:#394253; vertical-align:middle; }
    .taxonomy-table tbody tr:last-child td { border-bottom:0; }
    .taxonomy-table tbody tr:hover td { background:#f8f9fb; }
    .taxonomy-table td strong,.taxonomy-table td small { display:block; }
    .taxonomy-table td strong { color:#151a23; font-weight:650; }
    .taxonomy-table td small { margin-top:5px; color:#737b89; font-size:11px; }
    .taxonomy-table code { color:#4a5262; font-size:12px; }
    .taxonomy-table a { color:#2350d1; text-decoration:none; }
    .taxonomy-table textarea { width:min(100%,330px); min-height:54px; border:1px solid #cbd1db; border-radius:7px; padding:8px; background:#fff; color:#151a23; font:inherit; font-size:12px; vertical-align:middle; }
    .taxonomy-row-save { margin-left:7px; border:0; background:transparent; color:#2350d1; font:inherit; font-size:12px; font-weight:650; cursor:pointer; }
    .taxonomy-empty { padding:52px 20px!important; color:#636b7b!important; text-align:center; }
    .taxonomy-chip { display:inline-flex; margin:2px; border-radius:999px; padding:5px 9px; background:#eef0f4; color:#4a5262; font-size:11px; }
    .taxonomy-status { display:inline-flex; border-radius:999px; padding:5px 9px; background:#eef0f4; color:#505969; font-size:11px; font-weight:600; }
    .taxonomy-status.active { background:#edf3ef; color:#24583e; }
    .taxonomy-modal { position:fixed; inset:0; z-index:1900; display:flex; align-items:center; justify-content:center; padding:22px; }
    .taxonomy-modal-backdrop { position:absolute; inset:0; border:0; background:#1821198c; }
    .taxonomy-modal-dialog { position:relative; display:flex; width:min(100%,640px); max-height:calc(100vh - 44px); flex-direction:column; overflow:hidden; border:1px solid #e3e6ec; border-radius:15px; background:#fff; color:#151a23; box-shadow:0 24px 64px #151a2347; }
    .taxonomy-page[data-taxonomy-page="collections"] .taxonomy-modal-dialog { width:min(100%,900px); }
    .taxonomy-page[data-taxonomy-page="tags"] .taxonomy-modal-dialog { width:min(100%,850px); }
    .tag-product-results { display:grid; max-height:230px; overflow:auto; gap:5px; margin-top:7px; padding:7px; border:1px solid #e3e6ec; border-radius:9px; }
    .tag-product-results button { display:flex; min-height:42px; flex-direction:column; align-items:flex-start; border:0; border-radius:7px; padding:7px 10px; background:#f8f9fb; color:#283142; text-align:left; cursor:pointer; }
    .tag-product-results button:disabled { opacity:.55; cursor:default; }
    .tag-product-results small { margin-top:3px; color:#737b89; font-size:10px; }
    .tag-product-selected { display:flex; flex-wrap:wrap; gap:7px; margin-top:8px; }
    .tag-product-selected span { display:inline-flex; align-items:center; gap:7px; border:1px solid #dce3dc; border-radius:8px; padding:6px 9px; background:#f2f6f1; color:#344738; font-size:11px; }
    .tag-product-selected button { border:0; background:transparent; color:#99483e; font-size:17px; cursor:pointer; }
    .taxonomy-modal-dialog>header { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; border-bottom:1px solid #e8eaf0; padding:19px 22px; }
    .taxonomy-modal-dialog h2 { margin:0; font-size:19px; }
    .taxonomy-modal-dialog header p { margin:5px 0 0; color:#636b7b; font-size:12px; }
    .taxonomy-modal-close { width:40px; height:40px; flex:none; border:0; border-radius:8px; background:#f4f6fa; color:#394253; font-size:24px; cursor:pointer; }
    .taxonomy-form { overflow:auto; padding:20px 22px 22px; }
    .taxonomy-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:15px; }
    .taxonomy-fields label { display:flex; min-width:0; flex-direction:column; gap:6px; color:#283142; font-size:12px; font-weight:650; }
    .taxonomy-fields .wide { grid-column:1/-1; }
    .taxonomy-fields .collection-products-field select { min-height:220px; padding:7px!important; }
    .taxonomy-fields .collection-products-field option { padding:7px 9px; }
    .taxonomy-fields .collection-products-field small { color:#737b89; font-size:11px; font-weight:400; }
    .collection-image-field>label { margin-bottom:7px; color:#283142; font-size:12px; font-weight:650; }
    .collection-image-preview { display:flex; min-height:150px; align-items:center; justify-content:center; overflow:hidden; border:1px dashed #cbd1db; border-radius:10px; background:#f8f9fb; color:#737b89; font-size:12px; }
    .collection-image-preview img { width:100%; max-height:280px; object-fit:contain; }
    .collection-image-field>p,.collection-products-field>p { min-height:16px; margin:5px 0; color:#636b7b; font-size:11px; }
    .collection-image-field>button[hidden],.collection-image-preview [hidden] { display:none; }
    .collection-product-results { display:grid; max-height:230px; overflow:auto; gap:5px; padding:7px; border:1px solid #e3e6ec; border-radius:9px; }
    .taxonomy-fields .collection-product-result { display:flex; min-height:42px; flex-direction:row; align-items:center; gap:10px; padding:7px 9px; border-radius:7px; background:#f8f9fb; color:#283142; font-size:12px; }
    .taxonomy-fields .collection-product-result input { width:17px; min-height:17px; height:17px; flex:none; accent-color:#24583e; }
    .collection-product-result span,.collection-product-result small { display:block; }
    .collection-product-result small { margin-top:3px; color:#737b89; font-size:10px; font-weight:500; }
    .collection-selected-products { display:flex; flex-wrap:wrap; gap:7px; margin-top:8px; }
    .collection-selected-product { display:flex; align-items:center; gap:7px; border:1px solid #dce3dc; border-radius:8px; padding:6px 9px; background:#f2f6f1; color:#344738; font-size:11px; }
    .collection-selected-product button { width:24px; height:24px; border:0; border-radius:6px; background:#fff; color:#5f3934; cursor:pointer; }
    .collection-row-image { width:44px; height:36px; margin:0 10px 0 0; border-radius:5px; object-fit:cover; vertical-align:middle; }
    .taxonomy-fields input,.taxonomy-fields select,.taxonomy-fields textarea { width:100%; min-height:44px; border:1px solid #cbd1db!important; border-radius:8px!important; padding:9px 11px!important; background:#fff!important; color:#151a23!important; font:inherit; font-size:13px!important; box-shadow:none!important; }
    .taxonomy-fields textarea { min-height:78px; resize:vertical; }
    .taxonomy-fields input:focus,.taxonomy-fields select:focus,.taxonomy-fields textarea:focus { border-color:#7296f4!important; box-shadow:0 0 0 3px #dce6fb!important; outline:0; }
    .taxonomy-form-message { min-height:18px; margin:12px 0 0; color:#9a4239; font-size:12px; }
    .taxonomy-form footer { display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #e8eaf0; padding-top:16px; }
    @media(max-width:680px) { .taxonomy-heading h1 { font-size:22px; }.taxonomy-list-heading { align-items:flex-start; padding:16px; }.taxonomy-list-heading .taxonomy-primary { flex:none; }.taxonomy-table th,.taxonomy-table td { padding:12px; }.taxonomy-modal { align-items:flex-end; padding:0; }.taxonomy-modal-dialog { max-height:93vh; border-radius:15px 15px 0 0; }.taxonomy-modal-dialog>header,.taxonomy-form { padding:17px; }.taxonomy-fields { grid-template-columns:1fr; gap:12px; }.taxonomy-fields .wide { grid-column:auto; }.taxonomy-form footer { flex-direction:column-reverse; }.taxonomy-form footer button { width:100%; } }
    .taxonomy-row-actions { min-width:300px; }
    .brand-row-image { width:48px; height:40px; margin-right:10px; border-radius:7px; object-fit:contain; vertical-align:middle; }
    .brand-image-preview { min-height:130px; }
    .brand-image-preview img { width:140px; height:120px; object-fit:contain; }
    .taxonomy-row-actions .taxonomy-secondary,.taxonomy-row-actions .taxonomy-danger { min-height:34px; margin:2px; border-radius:7px; padding:0 10px; font-size:11px; }
    .taxonomy-table a { color:#303744; text-decoration:underline; text-underline-offset:3px; }
    .taxonomy-table textarea:focus { border-color:#788293; outline:0; box-shadow:0 0 0 3px #e3e6ec; }
    .taxonomy-chip { background:#f1f2f4; color:#394253; }
    .taxonomy-modal-backdrop { background:#151a238c; }
    .taxonomy-fields input:focus,.taxonomy-fields select:focus,.taxonomy-fields textarea:focus { border-color:#788293!important; box-shadow:0 0 0 3px #e3e6ec!important; }
    .taxonomy-screen button:focus-visible,.taxonomy-modal button:focus-visible,.taxonomy-modal input:focus-visible,.taxonomy-modal select:focus-visible,.taxonomy-modal textarea:focus-visible { outline-color:#788293; }
    @media(prefers-reduced-motion:reduce) { .taxonomy-primary,.taxonomy-secondary,.taxonomy-danger { transition:none; } }
  `;
}
