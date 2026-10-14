export function renderAdminPaginationCss(): string {
  return `
    .admin-pagination { display:flex; justify-content:center; align-items:center; gap:14px; border-top:1px solid #e9ecf0; padding:13px; color:#586170; font-size:12px; }
    .admin-page-button { min-height:34px; border:1px solid #d7dce3; border-radius:7px; padding:0 12px; background:#fff; color:#28313e; font:inherit; cursor:pointer; }
    .admin-page-button:hover:not(:disabled) { border-color:#8d9aab; background:#f7f8fa; }
    .admin-page-button:disabled { cursor:not-allowed; opacity:.45; }
    .admin-pagination-empty { padding:24px 14px!important; color:#737c8b!important; text-align:center; }
    @media(max-width:560px) { .admin-pagination { gap:8px; padding:11px 6px; font-size:11px; }.admin-page-button { padding:0 9px; } }
  `;
}
