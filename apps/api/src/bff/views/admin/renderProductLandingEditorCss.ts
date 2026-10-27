export function renderProductLandingEditorCss(): string {
  return `
    .products-actions .btn-action-landing { background:#e8edff; color:#344a9a; }
    .landing-modal[hidden] { display:none!important; }
    .landing-modal { position:fixed; inset:0; z-index:1900; display:flex; align-items:center; justify-content:center; padding:22px; }
    .landing-modal-backdrop { position:absolute; inset:0; border:0; background:rgba(13,22,38,.68); }
    .landing-modal-dialog { position:relative; z-index:1; width:min(100%,900px); max-height:calc(100vh - 44px); display:flex; flex-direction:column; overflow:hidden; border:1px solid #dbe1e9; border-radius:16px; background:#fff; color:#172033; box-shadow:0 24px 70px #0e192d42; }
    .landing-modal-heading { display:flex; flex:none; align-items:flex-start; justify-content:space-between; gap:18px; padding:20px 24px; border-bottom:1px solid #e5e9ef; }
    .landing-modal-heading h2 { margin:3px 0 4px; font-size:23px; letter-spacing:-.025em; }.landing-modal-heading p { margin:0; color:#687386; font-size:12px; }
    .landing-eyebrow { color:#4359a8; font-size:10px; font-weight:800; letter-spacing:.12em; }.landing-close { width:40px; height:40px; border:0; border-radius:9px; background:#f0f3f8; color:#344054; font-size:24px; cursor:pointer; }
    .landing-form { display:grid; grid-template-columns:1fr; gap:10px; overflow-y:auto; padding:20px 24px 24px; }
    .landing-form-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }.landing-form label { display:grid; gap:6px; color:#303b4e; font-size:12px; font-weight:700; }
    .landing-form input:not([type=checkbox]),.landing-form select,.landing-form textarea { width:100%; min-width:0; border:1px solid #cbd3df; border-radius:8px; padding:10px 11px; background:#fff; color:#172033; font:inherit; font-size:13px; }
    .landing-form input:focus,.landing-form select:focus,.landing-form textarea:focus { outline:2px solid #a6b6ff; outline-offset:1px; border-color:#667bd4; }.landing-form textarea { resize:vertical; }
    .landing-form .landing-wide { grid-column:1/-1; }.landing-switch { grid-template-columns:20px 1fr!important; align-items:start; padding:12px; border:1px solid #dce3f0; border-radius:10px; background:#f7f9ff; }.landing-switch input { margin-top:3px; }.landing-switch strong,.landing-switch small { display:block; }.landing-switch small { margin-top:4px; color:#687386; font-weight:400; }
    .landing-editor-help strong { font-size:13px; }.landing-editor-help p { margin:4px 0 8px; color:#687386; font-size:11px; }.landing-editor-help code { border-radius:4px; padding:2px 4px; background:#f0f3f9; color:#33415c; }
    .landing-section-picker { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; border:1px solid #e0e5ed; border-radius:10px; padding:14px; }.landing-section-picker legend { padding:0 5px; color:#303b4e; font-size:12px; font-weight:700; }.landing-section-picker label { display:flex; align-items:center; gap:7px; font-weight:500; }.landing-section-picker input { accent-color:#4359a8; }
    .landing-form-footer { display:flex; flex-wrap:wrap; align-items:center; gap:9px; padding-top:8px; border-top:1px solid #e5e9ef; }.landing-form-footer #plMsg { flex:1 1 100%; min-height:18px; color:#526075; font-size:12px; }.landing-form-footer #plMsg.is-error { color:#b42318; }.landing-form-footer #plMsg.is-success { color:#18764b; }
    .landing-primary,.landing-secondary { min-height:40px; border-radius:8px; padding:0 14px; font:inherit; font-size:12px; font-weight:700; cursor:pointer; }.landing-primary { border:0; background:#344a9a; color:#fff; }.landing-primary:disabled { opacity:.6; cursor:wait; }.landing-secondary { border:1px solid #cbd3df; background:#fff; color:#344054; }.landing-form-footer a { color:#344a9a; font-size:12px; font-weight:650; text-decoration:none; margin-right:auto; }
    @media(max-width:640px) { .landing-modal { padding:8px; }.landing-modal-dialog { max-height:calc(100vh - 16px); }.landing-modal-heading,.landing-form { padding:16px; }.landing-form-grid,.landing-section-picker { grid-template-columns:1fr; }.landing-form .landing-wide { grid-column:auto; }.landing-form-footer a { flex-basis:100%; } }
  `;
}
