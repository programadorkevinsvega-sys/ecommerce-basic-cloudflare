export function renderSystemDashboardCss(): string {
  return `
    .admin-legacy-pane:has(#tab-audit.active),.admin-legacy-pane:has(#tab-settings.active) { --border:#e3e6ec; --muted:#636b7b; --card-bg:#fff; --text:#151a23; --input-bg:#fff; min-height:0; border-radius:0; padding:0; background:#f5f6f8; color:#151a23; }
    .admin-main:has(#tab-audit.active)>.admin-topbar,.admin-main:has(#tab-settings.active)>.admin-topbar { display:none; }
    .audit-screen,.settings-screen { display:grid; gap:18px; }
    .audit-heading,.settings-heading { display:flex; justify-content:space-between; align-items:center; gap:20px; }
    .audit-eyebrow,.settings-eyebrow { color:#788190; font-size:10px; font-weight:750; letter-spacing:.12em; }
    .audit-heading h1,.settings-heading h1 { margin:5px 0; color:#18202c; font-size:25px; }
    .audit-heading p,.settings-heading p,.settings-card-heading p { margin:0; color:#737c8b; font-size:13px; line-height:1.5; }
    .audit-heading .btn-primary,.settings-actions .btn-primary { min-height:42px; border:0; border-radius:8px; padding:0 16px; background:#214f3b; color:#fff; font:inherit; font-size:13px; font-weight:700; cursor:pointer; }
    .audit-card,.settings-card { overflow:hidden; border:1px solid #e3e6ec; border-radius:12px; background:#fff; box-shadow:0 2px 8px #1c27330a; }
    .audit-table-scroll { overflow-x:auto; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-table { width:100%; min-width:900px; border-collapse:collapse; text-align:left; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-table th { border-bottom:1px solid #e5e8ed; padding:13px 16px; background:#f8f9fb; color:#737c8b; font-size:10px; font-weight:750; letter-spacing:.08em; text-transform:uppercase; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-table td { border-bottom:1px solid #edf0f3; padding:14px 16px; color:#3e4653; font-size:12px; vertical-align:top; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-table tr:last-child td { border-bottom:0; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-table td strong { display:block; color:#252c37; font-size:12px; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-table td small { display:block; margin-top:3px; color:#828a97; font-size:10px; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-table code { color:#505b6b; font-size:11px; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-action { display:inline-block; border-radius:999px; padding:4px 8px; background:#edf3ef; color:#24583e; font-size:10px; font-weight:700; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-changes { max-width:280px; overflow-wrap:anywhere; color:#697382; font-family:monospace; font-size:11px; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-empty { padding:30px 16px; color:#737c8b; text-align:center; }
    .admin-legacy-pane:has(#tab-audit.active) .audit-empty.error { color:#ad3028; }
    .audit-pagination { display:flex; justify-content:center; align-items:center; gap:14px; border-top:1px solid #e9ecf0; padding:13px; color:#586170; font-size:12px; }
    .audit-page-button { min-height:34px; border:1px solid #d7dce3; border-radius:7px; padding:0 12px; background:#fff; color:#28313e; font:inherit; cursor:pointer; }
    .audit-page-button:hover:not(:disabled) { border-color:#8d9aab; background:#f7f8fa; }
    .audit-page-button:disabled { cursor:not-allowed; opacity:.45; }
    .settings-card { padding:22px; }
    .settings-card-heading { margin-bottom:20px; }
    .settings-card-heading h2 { margin:0 0 5px; color:#202733; font-size:17px; }
    .admin-legacy-pane:has(#tab-settings.active) .form-grid { grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; }
    .admin-legacy-pane:has(#tab-settings.active) label { color:#4b5563; font-size:12px; }
    .admin-legacy-pane:has(#tab-settings.active) input:not([type=file]),.admin-legacy-pane:has(#tab-settings.active) select,.admin-legacy-pane:has(#tab-settings.active) textarea { min-height:42px; border:1px solid #d6dbe3; border-radius:7px; padding:9px 11px; background:#fff; color:#202733; font:inherit; font-size:13px; box-shadow:none; }
    .admin-legacy-pane:has(#tab-settings.active) input:focus,.admin-legacy-pane:has(#tab-settings.active) select:focus,.admin-legacy-pane:has(#tab-settings.active) textarea:focus { border-color:#7d9a89; outline:0; box-shadow:0 0 0 3px #e5eee8; }
    .admin-legacy-pane:has(#tab-settings.active) input[readonly] { background:#f3f5f7; color:#727b88; }
    .admin-legacy-pane:has(#tab-settings.active) .form-grid small,.settings-help { color:#737c8b; font-size:11px; line-height:1.5; }
    .settings-help { margin:0 0 16px; }
    .settings-actions { display:flex; justify-content:flex-end; }
    .admin-legacy-pane:has(#tab-settings.active) .msg { color:#fff; }
    @media(max-width:820px) { .admin-legacy-pane:has(#tab-settings.active) .form-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
    @media(max-width:560px) { .audit-heading,.settings-heading { align-items:stretch; flex-direction:column; }.audit-heading .btn-primary { align-self:flex-start; }.settings-card { padding:16px; }.admin-legacy-pane:has(#tab-settings.active) .form-grid { grid-template-columns:minmax(0,1fr); }.settings-actions .btn-primary { width:100%; } }
  `;
}
