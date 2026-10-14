export function renderTaxonomyDashboardCss(): string {
  return `
    .taxonomy-screen { color:#202923; }
    .admin-nav-link[data-tab="taxonomies"].active { background:#eaf0e9; color:#315b43; }
    .taxonomy-screen button:focus-visible,.taxonomy-modal button:focus-visible,.taxonomy-modal input:focus-visible,.taxonomy-modal select:focus-visible,.taxonomy-modal textarea:focus-visible { outline:3px solid #7e987f; outline-offset:2px; }
    .taxonomy-heading { margin:0 0 20px; }
    .taxonomy-heading>div>span { color:#5d755f; font-size:10px; font-weight:700; letter-spacing:.12em; }
    .taxonomy-heading h1 { margin:4px 0; font-size:26px; }
    .taxonomy-heading p { margin:0; color:#6f786f; font-size:13px; }
    .taxonomy-page[hidden],.taxonomy-modal[hidden] { display:none!important; }
    .taxonomy-list-card { overflow:hidden; border:1px solid #e5e8e1; border-radius:14px; background:#fff; box-shadow:0 2px 8px #1f2a1a08; }
    .taxonomy-list-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; padding:20px 22px; }
    .taxonomy-list-heading h2 { margin:0; color:#202923; font-size:17px; }
    .taxonomy-list-heading p { margin:5px 0 0; color:#788078; font-size:12px; }
    .taxonomy-primary,.taxonomy-secondary,.taxonomy-danger { display:inline-flex; min-height:42px; align-items:center; justify-content:center; gap:7px; border:1px solid transparent; border-radius:9px; padding:0 15px; font:inherit; font-size:13px; font-weight:650; cursor:pointer; transition:background .16s ease,border-color .16s ease; }
    .taxonomy-primary { background:#244d37; color:#fff; }
    .taxonomy-primary:hover { background:#193d2a; }
    .taxonomy-secondary { border-color:#dce2d9; background:#fff; color:#38453a; }
    .taxonomy-secondary:hover { background:#f5f7f3; }
    .taxonomy-danger { min-height:34px; border-color:#edd8d4; background:#fff; color:#99483e; font-size:12px; }
    .taxonomy-danger:hover { background:#fff6f4; }
    .taxonomy-table-scroll { overflow-x:auto; }
    .taxonomy-table { width:100%; min-width:620px; border-collapse:collapse; text-align:left; font-size:13px; }
    .taxonomy-table th { padding:12px 16px; border-top:1px solid #edf0ea; border-bottom:1px solid #e8ebe5; background:#f8f9f6; color:#667064; font-size:10px; letter-spacing:.055em; text-transform:uppercase; }
    .taxonomy-table td { padding:14px 16px; border-bottom:1px solid #eff1ed; color:#485248; vertical-align:middle; }
    .taxonomy-table tbody tr:last-child td { border-bottom:0; }
    .taxonomy-table tbody tr:hover td { background:#fbfcfa; }
    .taxonomy-table td strong,.taxonomy-table td small { display:block; }
    .taxonomy-table td strong { color:#263229; font-weight:650; }
    .taxonomy-table td small { margin-top:5px; color:#788078; font-size:11px; }
    .taxonomy-table code { color:#657063; font-size:12px; }
    .taxonomy-table a { color:#315b43; text-decoration:none; }
    .taxonomy-table textarea { width:min(100%,330px); min-height:54px; border:1px solid #d4dbd1; border-radius:7px; padding:8px; background:#fff; color:#202923; font:inherit; font-size:12px; vertical-align:middle; }
    .taxonomy-row-save { margin-left:7px; border:0; background:transparent; color:#315b43; font:inherit; font-size:12px; font-weight:650; cursor:pointer; }
    .taxonomy-empty { padding:52px 20px!important; color:#7a8379!important; text-align:center; }
    .taxonomy-chip { display:inline-flex; margin:2px; border-radius:999px; padding:5px 9px; background:#f0f3ed; color:#53634f; font-size:11px; }
    .taxonomy-status { display:inline-flex; border-radius:999px; padding:5px 9px; background:#f1f2ef; color:#697167; font-size:11px; font-weight:600; }
    .taxonomy-status.active { background:#edf4ed; color:#315b43; }
    .taxonomy-modal { position:fixed; inset:0; z-index:1900; display:flex; align-items:center; justify-content:center; padding:22px; }
    .taxonomy-modal-backdrop { position:absolute; inset:0; border:0; background:#1821198c; }
    .taxonomy-modal-dialog { position:relative; display:flex; width:min(100%,640px); max-height:calc(100vh - 44px); flex-direction:column; overflow:hidden; border:1px solid #e5e8e1; border-radius:15px; background:#fff; color:#202923; box-shadow:0 24px 64px #1721173b; }
    .taxonomy-modal-dialog>header { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; border-bottom:1px solid #edf0ea; padding:19px 22px; }
    .taxonomy-modal-dialog h2 { margin:0; font-size:19px; }
    .taxonomy-modal-dialog header p { margin:5px 0 0; color:#737d72; font-size:12px; }
    .taxonomy-modal-close { width:40px; height:40px; flex:none; border:0; border-radius:8px; background:#f2f4f0; color:#455044; font-size:24px; cursor:pointer; }
    .taxonomy-form { overflow:auto; padding:20px 22px 22px; }
    .taxonomy-fields { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:15px; }
    .taxonomy-fields label { display:flex; min-width:0; flex-direction:column; gap:6px; color:#39453a; font-size:12px; font-weight:650; }
    .taxonomy-fields .wide { grid-column:1/-1; }
    .taxonomy-fields input,.taxonomy-fields select,.taxonomy-fields textarea { width:100%; min-height:44px; border:1px solid #d4dbd1!important; border-radius:8px!important; padding:9px 11px!important; background:#fff!important; color:#202923!important; font:inherit; font-size:13px!important; box-shadow:none!important; }
    .taxonomy-fields textarea { min-height:78px; resize:vertical; }
    .taxonomy-fields input:focus,.taxonomy-fields select:focus,.taxonomy-fields textarea:focus { border-color:#819982!important; box-shadow:0 0 0 3px #edf3ec!important; outline:0; }
    .taxonomy-form-message { min-height:18px; margin:12px 0 0; color:#9a4239; font-size:12px; }
    .taxonomy-form footer { display:flex; justify-content:flex-end; gap:10px; border-top:1px solid #edf0ea; padding-top:16px; }
    @media(max-width:680px) { .taxonomy-heading h1 { font-size:23px; }.taxonomy-list-heading { align-items:flex-start; padding:16px; }.taxonomy-list-heading .taxonomy-primary { flex:none; }.taxonomy-table th,.taxonomy-table td { padding:12px; }.taxonomy-modal { align-items:flex-end; padding:0; }.taxonomy-modal-dialog { max-height:93vh; border-radius:15px 15px 0 0; }.taxonomy-modal-dialog>header,.taxonomy-form { padding:17px; }.taxonomy-fields { grid-template-columns:1fr; gap:12px; }.taxonomy-fields .wide { grid-column:auto; }.taxonomy-form footer { flex-direction:column-reverse; }.taxonomy-form footer button { width:100%; } }
    @media(prefers-reduced-motion:reduce) { .taxonomy-primary,.taxonomy-secondary,.taxonomy-danger { transition:none; } }
  `;
}
