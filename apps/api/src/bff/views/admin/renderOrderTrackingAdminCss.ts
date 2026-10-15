export function renderOrderTrackingAdminCss(): string {
  return `
    #admin-legacy-tabs .order-tracking-admin { color:#151a23; }
    #admin-legacy-tabs .tracking-admin-card { margin:0; padding:20px; }
    #admin-legacy-tabs .tracking-admin-filters { display:grid; grid-template-columns:minmax(260px,1fr) minmax(190px,260px) auto; align-items:end; gap:14px; margin-bottom:16px; }
    #admin-legacy-tabs .tracking-admin-filters label,
    #admin-legacy-tabs .tracking-admin-dialog label { display:flex; flex-direction:column; gap:7px; margin:0; color:#394253; font-size:13px; font-weight:600; }
    #admin-legacy-tabs .tracking-admin-filters input,
    #admin-legacy-tabs .tracking-admin-filters select,
    #admin-legacy-tabs .tracking-admin-dialog input:not([type="hidden"]),
    #admin-legacy-tabs .tracking-admin-dialog select { box-sizing:border-box; width:100%; min-height:44px; margin:0; border:1px solid #cbd1db!important; border-radius:8px; padding:9px 12px; background:#fff!important; color:#151a23!important; color-scheme:light; font:inherit; box-shadow:none; }
    #admin-legacy-tabs .tracking-admin-filters input::placeholder,
    #admin-legacy-tabs .tracking-admin-dialog input::placeholder { color:#858c99; opacity:1; }
    #admin-legacy-tabs .tracking-admin-filters input:focus,
    #admin-legacy-tabs .tracking-admin-filters select:focus,
    #admin-legacy-tabs .tracking-admin-dialog input:focus,
    #admin-legacy-tabs .tracking-admin-dialog select:focus { border-color:#648b72!important; outline:0; box-shadow:0 0 0 3px #e3eee6; }
    #admin-legacy-tabs .tracking-admin-filters button { min-height:44px; padding:0 18px; }
    #admin-legacy-tabs .tracking-admin-table { min-width:900px; }
    #admin-legacy-tabs dialog.tracking-admin-dialog { box-sizing:border-box; width:min(980px,calc(100vw - 40px)); max-width:none; max-height:min(92dvh,900px); margin:auto; overflow:auto; border:1px solid #e3e6ec; border-radius:16px; padding:0; background:#fff!important; color:#151a23!important; color-scheme:light; box-shadow:0 24px 70px #151a2340; }
    #admin-legacy-tabs dialog.tracking-admin-dialog::backdrop { background:#151a2366; backdrop-filter:blur(2px); }
    #admin-legacy-tabs .tracking-admin-dialog form { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px 20px; padding:0 24px 22px; background:#fff; color:#151a23; }
    #admin-legacy-tabs .tracking-admin-dialog form>header { position:sticky; top:0; z-index:2; grid-column:1/-1; display:flex; align-items:flex-start; justify-content:space-between; gap:20px; margin:0 -24px; border-bottom:1px solid #e8eaf0; padding:22px 24px 16px; background:#fff; }
    #admin-legacy-tabs .tracking-admin-dialog h2 { margin:0; color:#151a23; font-size:21px; line-height:1.25; }
    #admin-legacy-tabs .tracking-admin-dialog header p { margin:5px 0 0; color:#636b7b; font-size:13px; overflow-wrap:anywhere; }
    #admin-legacy-tabs .tracking-admin-dialog .shipping-modal-close { flex:none; width:38px; height:38px; border:1px solid #e3e6ec; background:#f8f9fb; color:#394253; }
    #admin-legacy-tabs .tracking-admin-timeline { grid-column:1/-1; min-width:0; border:1px solid #e8eaf0; border-radius:11px; padding:16px; background:#fafbfa; }
    #admin-legacy-tabs .tracking-admin-timeline h3 { margin:0 0 13px; color:#283142; font-size:15px; }
    #admin-legacy-tabs .tracking-admin-timeline ol { display:grid; grid-template-columns:repeat(auto-fit,minmax(145px,1fr)); gap:10px; margin:0; padding:0; list-style:none; }
    #admin-legacy-tabs .tracking-admin-timeline li { min-width:0; border:1px solid #e3e6ec; border-left:3px solid #648b72; border-radius:8px; padding:10px 11px; background:#fff; color:#394253; font-size:12px; }
    #admin-legacy-tabs .tracking-admin-timeline li strong,
    #admin-legacy-tabs .tracking-admin-timeline li time { display:block; }
    #admin-legacy-tabs .tracking-admin-timeline li strong { margin-bottom:5px; color:#20563d; }
    #admin-legacy-tabs .tracking-admin-timeline li time { color:#737b89; font-size:11px; line-height:1.4; }
    #admin-legacy-tabs #tracking-edit-message { grid-column:1/-1; margin:0; color:#a23b33; font-size:13px; }
    #admin-legacy-tabs .tracking-admin-dialog form>button.shipping-action { justify-self:start; min-height:40px; }
    #admin-legacy-tabs .tracking-admin-dialog footer { grid-column:1/-1; display:flex; justify-content:flex-end; gap:10px; margin:0; border-top:1px solid #e8eaf0; padding-top:16px; }
    #admin-legacy-tabs .tracking-admin-dialog footer button { min-height:42px; padding:0 16px; }
    @media(max-width:720px) {
      #admin-legacy-tabs .tracking-admin-card { padding:14px; }
      #admin-legacy-tabs .tracking-admin-filters { grid-template-columns:1fr; gap:12px; }
      #admin-legacy-tabs .tracking-admin-filters button { justify-self:start; }
      #admin-legacy-tabs dialog.tracking-admin-dialog { width:calc(100vw - 20px); max-height:94dvh; border-radius:14px; }
      #admin-legacy-tabs .tracking-admin-dialog form { grid-template-columns:1fr; gap:14px; padding:0 17px 17px; }
      #admin-legacy-tabs .tracking-admin-dialog form>header { margin:0 -17px; padding:17px; }
      #admin-legacy-tabs .tracking-admin-timeline,
      #admin-legacy-tabs #tracking-edit-message,
      #admin-legacy-tabs .tracking-admin-dialog footer { grid-column:1; }
      #admin-legacy-tabs .tracking-admin-timeline ol { grid-template-columns:1fr 1fr; }
    }
    @media(max-width:420px) {
      #admin-legacy-tabs .tracking-admin-timeline ol { grid-template-columns:1fr; }
      #admin-legacy-tabs .tracking-admin-dialog footer { justify-content:stretch; }
      #admin-legacy-tabs .tracking-admin-dialog footer button { flex:1; }
    }
  `;
}
