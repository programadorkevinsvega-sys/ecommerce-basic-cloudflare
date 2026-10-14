export function renderCmsDashboardCss(): string {
  return `
    .admin-legacy-pane.cms-mode { --border:#e3e6ec; --muted:#636b7b; --card-bg:#fff; --text:#151a23; min-height:0; border-radius:0; padding:0; background:#f5f6f8; color:#151a23; }
    .admin-legacy-pane.blog-mode { --border:#e3e6ec; --muted:#636b7b; --card-bg:#fff; --text:#151a23; min-height:0; border-radius:0; padding:0; background:#f5f6f8; color:#151a23; }
    .admin-main.blog-page-active>.admin-topbar { display:none; }
    .cms-screen { color:#151a23; }
    .cms-screen [hidden] { display:none!important; }
    .cms-heading,.cms-editor-heading,.cms-list-heading { display:flex; align-items:center; justify-content:space-between; gap:16px; }
    .cms-heading { margin:0 0 20px; }
    .cms-eyebrow { color:#687283; font-size:10px; font-weight:750; letter-spacing:.1em; }
    .cms-heading h1 { margin:4px 0; color:#151a23; font-size:24px; }
    .cms-heading p,.cms-list-heading p,.cms-editor-heading p { margin:4px 0 0; color:#636b7b; font-size:13px; }
    .cms-primary,.cms-secondary { min-height:42px; border:1px solid #cbd1db; border-radius:8px; padding:0 15px; background:#fff; color:#303744; font:inherit; font-size:13px; font-weight:650; cursor:pointer; }
    .cms-primary { border-color:#20563d; background:#20563d; color:#fff; }
    .cms-primary:hover { border-color:#17452f; background:#17452f; }
    .cms-template-card,.cms-list-card,.cms-editor-card { overflow:hidden; margin:0 0 18px; border:1px solid #e3e6ec; border-radius:12px; background:#fff; }
    .cms-template-card { padding:16px 20px; }
    .cms-template-card label { color:#303744!important; }
    .cms-template-card .btn-action { min-height:36px; border:1px solid #cbd1db!important; border-radius:7px!important; padding:0 11px!important; background:#fff!important; color:#303744!important; font-size:12px!important; }
    .cms-list-heading,.cms-editor-heading { padding:18px 20px; border-bottom:1px solid #e8eaf0; }
    .cms-list-card:has(#newCmsPageForm:not([hidden])) .cms-list-heading,.cms-list-card:has(#newCmsPageForm:not([hidden])) .cms-table { display:none; }
    .cms-list-heading h2,.cms-editor-heading h2 { margin:0; color:#151a23; font-size:17px; }
    .cms-table-scroll { overflow-x:auto; }
    .cms-table { width:100%; min-width:720px; table-layout:fixed; border-collapse:collapse; text-align:left; font-size:13px; }
    .cms-table th:nth-child(1),.cms-table td:nth-child(1) { width:34%; }
    .cms-table th:nth-child(2),.cms-table td:nth-child(2) { width:14%; }
    .cms-table th:nth-child(3),.cms-table td:nth-child(3) { width:20%; }
    .cms-table th:nth-child(4),.cms-table td:nth-child(4) { width:32%; }
    .cms-table th { padding:12px 16px!important; border-bottom:1px solid #e3e6ec!important; background:#f8f9fb; color:#586172!important; font-size:10px; letter-spacing:.06em; text-transform:uppercase; }
    .cms-table td { padding:13px 16px!important; border-bottom:1px solid #eef0f4; color:#394253; vertical-align:middle; }
    .cms-table tr:last-child td { border-bottom:0; }
    .cms-page-title-cell { color:#151a23!important; font-weight:650; }
    .cms-page-url { margin-top:5px; color:#737b89; font-size:11px; font-weight:400; }
    .cms-page-actions { white-space:normal; }
    .cms-page-actions,.cms-table th:last-child { text-align:left!important; }
    .cms-actions-group { display:flex; flex-wrap:wrap; align-items:center; gap:4px; }
    .cms-page-actions .btn-action { min-height:32px; margin:2px; border:1px solid #cbd1db; border-radius:7px; padding:0 9px; background:#fff; color:#303744; font-size:11px; }
    .cms-page-actions .btn-action-publish,.cms-page-actions .btn-action-hide { border-color:#cbd1db; background:#fff; color:#303744; }
    .cms-page-actions .btn-action-delete { border-color:#edd8d4; background:#fff; color:#99483e; }
    .cms-page-actions .btn-action-view { border-color:#cbd1db; background:#fff; color:#303744; }
    .cms-page-actions a { text-decoration:none; }
    .cms-screen .badge-published { background:#edf3ef; color:#24583e; }
    .cms-screen .badge-draft { background:#f1f2f4; color:#586172; }
    .cms-empty { padding:42px 16px!important; color:#636b7b!important; text-align:center; }
    .cms-editor-form { padding:0 20px 20px; }
    .cms-editor-form label { color:#303744!important; }
    .cms-editor-form input,.cms-editor-form select { min-height:42px; border:1px solid #cbd1db!important; border-radius:8px!important; background:#fff!important; color:#151a23!important; }
    .cms-editor-form .form-grid { gap:15px; }
    .cms-editor-form>div>label { margin-bottom:8px!important; }
    .cms-editor-form [contenteditable="true"] { box-shadow:none!important; }
    .cms-editor-form>div:has(#cmsEditor) { margin-bottom:18px!important; }
    .cms-editor-form>div:has(#cmsEditor)>div:first-of-type { background:#f5f6f8!important; border-color:#e3e6ec!important; }
    .cms-editor-form>div:has(#cmsEditor) select,.cms-editor-form>div:has(#cmsEditor) button { border:1px solid #cbd1db!important; border-radius:6px!important; background:#fff!important; color:#303744!important; }
    .cms-editor-form>div:has(#cmsEditor)>div:last-of-type { background:#f5f6f8!important; border-color:#e3e6ec!important; }
    .cms-editor-form #cmsEditor { color:#151a23!important; }
    .cms-editor-form .btn-primary { min-height:42px; border:0!important; border-radius:8px!important; background:#151a23!important; }
    .cms-editor-form .btn-action { min-height:40px; border:1px solid #cbd1db!important; border-radius:8px!important; background:#fff!important; color:#303744!important; }
    .cms-form-actions { display:flex; justify-content:flex-end; gap:9px; margin-top:16px; border-top:1px solid #e8eaf0; padding-top:16px; }
    .cms-form-actions .btn-primary { min-height:42px; border:1px solid #151a23!important; border-radius:8px!important; padding:0 16px; background:#151a23!important; color:#fff; font-weight:650; cursor:pointer; }
    #cmsDeleteModal { background:#151a238c!important; }
    #cmsDeleteModal>div { border:1px solid #e3e6ec!important; border-radius:12px!important; background:#fff!important; box-shadow:0 24px 64px #151a2347!important; }
    #cmsDeleteModal h3 { color:#151a23!important; }
    #cmsDeleteModal p { color:#636b7b!important; }
    #cmsDeleteModal .btn-action:not(.btn-action-delete) { min-height:40px; border:1px solid #cbd1db!important; border-radius:8px!important; background:#fff!important; color:#303744!important; }
    #cmsDeleteModal .btn-action-delete { min-height:40px; border:1px solid #edd8d4!important; border-radius:8px!important; background:#fff!important; color:#99483e!important; }
    @media(max-width:680px) { .cms-heading { align-items:flex-start; flex-direction:column; }.cms-heading .cms-primary { width:100%; }.cms-list-heading,.cms-editor-heading { align-items:flex-start; padding:15px; }.cms-editor-form { padding:15px; }.cms-page-actions { min-width:300px; } }
  `;
}
