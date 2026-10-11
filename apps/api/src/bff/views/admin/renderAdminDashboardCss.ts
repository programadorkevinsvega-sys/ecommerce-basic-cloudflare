export function renderAdminDashboardCss(): string {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; min-height: 100vh; display: flex; flex-direction: column; }
    header { background: #1e293b; border-bottom: 1px solid #334155; padding: 1rem 2rem; display: flex; justify-content: space-between; align-items: center; }
    .brand { font-size: 1.25rem; font-weight: 700; color: #fff; }
    .nav-user { display: flex; align-items: center; gap: 1rem; font-size: 0.875rem; color: #94a3b8; }
    .btn-logout { background: #dc2626; color: #fff; border: none; padding: 0.4rem 0.8rem; border-radius: 4px; cursor: pointer; font-weight: 600; }
    .container { max-width: 1200px; margin: 2rem auto; padding: 0 1rem; flex: 1; width: 100%; }
    .tabs { display: flex; gap: 0.5rem; border-bottom: 1px solid #334155; margin-bottom: 1.5rem; }
    .tab-btn { background: transparent; border: none; color: #94a3b8; padding: 0.75rem 1.25rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; }
    .tab-btn.active { color: #3b82f6; border-bottom-color: #3b82f6; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 1.5rem; margin-bottom: 1.5rem; }
    h2 { font-size: 1.25rem; margin-bottom: 1rem; color: #fff; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 1rem; margin-bottom: 1rem; }
    label { display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem; color: #cbd5e1; }
    input, select, textarea { width: 100%; padding: 0.6rem; background: #0f172a; border: 1px solid #334155; border-radius: 4px; color: #fff; font-size: 0.9rem; }
    button.btn-primary { background: #2563eb; color: #fff; border: none; padding: 0.75rem 1.5rem; border-radius: 4px; font-weight: 600; cursor: pointer; }
    table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
    th { padding: 0.75rem; border-bottom: 2px solid #334155; color: #94a3b8; font-weight: 600; }
    .msg { padding: 0.75rem; border-radius: 4px; margin-top: 1rem; display: none; font-size: 0.9rem; }
    .serp-card { background: #ffffff; color: #1f2937; border-radius: 6px; padding: 1rem; margin-top: 1rem; border: 1px solid #cbd5e1; }
    .serp-title { color: #1a0dab; font-size: 1.15rem; font-weight: 500; text-decoration: none; cursor: pointer; }
    .serp-url { color: #006621; font-size: 0.85rem; margin: 2px 0 4px; }
    .serp-desc { color: #545454; font-size: 0.85rem; line-height: 1.4; }
    .char-count { font-size: 0.75rem; color: #94a3b8; float: right; font-weight: normal; }
  `;
}
