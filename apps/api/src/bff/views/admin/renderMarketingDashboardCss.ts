export function renderMarketingDashboardCss(): string {
  return `
    .admin-legacy-pane.storefront-mode,.admin-legacy-pane.promotions-mode { min-height:0; border-radius:0; padding:0; background:#f5f6f8; color:#151a23; }
    .admin-legacy-pane.storefront-mode>.tab-content,.admin-legacy-pane.promotions-mode>.tab-content { color:#151a23; }
    .storefront-mode .card,.promotions-mode .card { margin:0 0 18px; border:1px solid #e3e6ec; border-radius:12px; padding:20px; background:#fff; color:#151a23; box-shadow:none; }
    .storefront-mode h2,.promotions-mode h2 { color:#151a23; font-size:17px; }
    .storefront-mode p,.promotions-mode p,.storefront-mode small,.promotions-mode small { color:#636b7b!important; }
    .storefront-mode label,.promotions-mode label { color:#303747; font-size:12px; font-weight:650; }
    .storefront-mode input:not([type="file"]),.storefront-mode select,.storefront-mode textarea,.promotions-mode input,.promotions-mode select,.promotions-mode textarea { min-height:42px; border:1px solid #cbd1db!important; border-radius:8px!important; padding:9px 11px!important; background:#fff!important; color:#151a23!important; font:inherit; font-size:13px; box-shadow:none!important; }
    .storefront-mode input:focus,.storefront-mode select:focus,.storefront-mode textarea:focus,.promotions-mode input:focus,.promotions-mode select:focus,.promotions-mode textarea:focus { border-color:#7296f4!important; box-shadow:0 0 0 3px #dce6fb!important; outline:0; }
    .storefront-mode input[type="file"],.promotions-mode input[type="file"] { color:#394253; }
    .admin-legacy-pane input[type="file"] { box-sizing:border-box; width:100%; min-height:42px; border:1px solid #cbd1db!important; border-radius:8px!important; padding:5px 8px!important; background:#fff!important; color:#394253!important; font:inherit; font-size:13px!important; }
    .admin-legacy-pane input[type="file"]::file-selector-button { min-height:30px; margin-right:10px; border:1px solid #d5dae3; border-radius:6px; padding:0 10px; background:#f4f6f8; color:#303747; font:inherit; font-size:12px; font-weight:600; cursor:pointer; }
    .admin-legacy-pane input[type="file"]:focus-visible { outline:3px solid #b9d8c4; outline-offset:2px; }
    .storefront-mode table,.promotions-mode table { width:100%; min-width:760px; border-collapse:collapse; text-align:left; font-size:13px; }
    .storefront-mode th,.promotions-mode th { padding:11px 12px; border-bottom:1px solid #e3e6ec!important; background:#f8f9fb; color:#586172; font-size:10px; letter-spacing:.05em; text-transform:uppercase; }
    .storefront-mode td,.promotions-mode td { padding:12px!important; border-bottom:1px solid #eef0f4!important; background:#fff!important; color:#394253!important; vertical-align:middle; }
    .storefront-mode td div,.promotions-mode td div { color:#636b7b!important; }
    .storefront-mode .form-grid,.promotions-mode .form-grid { gap:14px; }
    .storefront-mode .banner-filters { margin:18px 0 10px; }
    .storefront-mode [style*="background: #0f172a"],.storefront-mode [style*="background:#0f172a"],.storefront-mode [style*="background: #1e293b"] { border-color:#d8dde6!important; background:#f8f9fb!important; }
    .storefront-mode [style*="color:#e2e8f0"],.storefront-mode [style*="color: #e2e8f0"] { color:#303747!important; }
    .storefront-mode .btn-action,.promotions-mode .btn-action { min-height:32px; margin:2px; border:1px solid #d5dae3!important; border-radius:7px; padding:0 10px; background:#fff!important; color:#394253!important; font-size:11px; font-weight:600; cursor:pointer; }
    .storefront-mode .btn-action-view,.storefront-mode .btn-action-edit,.promotions-mode .btn-action-view,.promotions-mode .btn-action-edit { border-color:#d5dae3!important; background:#f4f6fa!important; color:#394253!important; }
    .storefront-mode .btn-action-publish,.promotions-mode .btn-action-publish { border-color:#c8e4d2!important; background:#e6f4ec!important; color:#136b3e!important; }
    .storefront-mode .btn-action-hide,.promotions-mode .btn-action-hide { border-color:#f0dfbd!important; background:#fff6e6!important; color:#8a5b00!important; }
    .storefront-mode .btn-action-delete,.promotions-mode .btn-action-delete { border-color:#efcfcc!important; background:#fff0ef!important; color:#a8231b!important; }
    .storefront-mode .badge-published,.promotions-mode .badge-published { border-radius:999px; padding:5px 9px; background:#e6f4ec; color:#136b3e; }
    .storefront-mode .badge-draft,.promotions-mode .badge-draft { border-radius:999px; padding:5px 9px; background:#eef0f4; color:#505969; }
    .marketing-page-toolbar { display:flex; justify-content:flex-end; align-items:center; margin:0 0 14px; }
    .marketing-create-button { display:inline-flex; min-height:44px; align-items:center; margin:0; border:0; border-radius:8px; padding:0 16px; font:inherit; font-size:13px; font-weight:650; cursor:pointer; }
    .marketing-modal { width:min(100% - 32px,920px); max-width:920px; max-height:calc(100vh - 32px); overflow:auto; border:1px solid #e3e6ec; border-radius:15px; padding:0; background:#fff; color:#151a23; box-shadow:0 24px 64px #151a2347; }
    .marketing-modal::backdrop { background:rgba(21,26,35,.58); }
    .marketing-modal-heading { position:sticky; top:0; z-index:1; display:flex; align-items:center; justify-content:space-between; gap:14px; border-bottom:1px solid #e8eaf0; padding:17px 22px; background:#fff; }
    .marketing-modal-heading h2 { margin:0; color:#151a23; font-size:18px; }
    .marketing-modal-close { display:grid; width:40px; height:40px; place-items:center; border:0; border-radius:8px; background:#f4f6fa; color:#394253; font-size:24px; cursor:pointer; }
    .marketing-modal form { margin:0!important; padding:20px 22px 22px; }
    .marketing-modal form>div[style*="display:flex"] { gap:10px!important; margin-top:16px; }
    .marketing-modal-cancel { min-height:42px; border:1px solid #d5dae3; border-radius:8px; padding:0 15px; background:#fff; color:#394253; font:inherit; font-weight:600; cursor:pointer; }
    .marketing-modal .msg { display:block; min-height:18px; margin-top:12px; color:#394253; }
    .promotions-mode .modal-content { border:1px solid #e3e6ec; border-radius:12px; background:#fff; color:#151a23; box-shadow:0 20px 60px #151a2333; }
    .promotions-mode .modal-content h2,.promotions-mode .modal-content p { color:#151a23!important; }
    .promotions-mode #modalPromoBody { color:#394253!important; }
    .promotions-mode #promoDetailsModal { background:rgba(21,26,35,.58); }
    @media(max-width:700px) { .storefront-mode .card,.promotions-mode .card { padding:15px; }.marketing-modal { width:100%; max-height:94vh; border-radius:15px 15px 0 0; }.marketing-modal[open] { margin:auto auto 0; }.marketing-modal form { padding:16px; }.marketing-modal-heading { padding:15px 16px; }.marketing-modal form>div[style*="display:flex"] { flex-wrap:wrap; }.marketing-modal form>div[style*="display:flex"] button { flex:1; } }
  `;
}
