export function renderPaymentsDashboardCss(): string {
  return `
    .payments-screen { color:#151a23; }.payments-heading { display:flex; flex-wrap:wrap; align-items:flex-start; justify-content:space-between; gap:16px; margin-bottom:20px; }.payments-heading h1 { margin:0; font-size:24px; }.payments-heading p { margin:4px 0 0; color:#636b7b; }
    .payments-page-panel[hidden] { display:none!important; }.payments-page-card { margin:0!important; padding:20px!important; }.payments-page-card h2 { margin-top:0; }.payments-page-card>p { color:#636b7b; }
    .payments-form-grid { display:grid; grid-template-columns:minmax(140px,1fr) minmax(180px,2fr); align-items:center; gap:12px; max-width:760px; margin-top:18px; }.payments-form-grid label { color:#283142; font-size:13px; font-weight:600; }.payments-form-grid input { width:100%; min-height:44px; border:1px solid #cbd1db; border-radius:7px; padding:8px 11px; background:#fff; color:#151a23; }.payments-form-grid button { justify-self:start; min-height:44px; }.payments-table-scroll { overflow-x:auto; margin-top:18px; }.payments-table { width:100%; min-width:680px; border-collapse:collapse; text-align:left; }.payments-table th,.payments-table td { border-bottom:1px solid #e3e6ec; padding:12px; }.payments-table th { background:#f8f9fb; color:#505969; font-size:12px; text-transform:uppercase; }.payments-table td { color:#394253; }
    @media(max-width:560px) { .payments-form-grid { grid-template-columns:minmax(0,1fr); gap:7px; }.payments-form-grid input { margin-bottom:8px; }.payments-page-card { padding:14px!important; } }
  `;
}
