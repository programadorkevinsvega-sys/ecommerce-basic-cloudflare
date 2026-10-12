import { renderOrdersAdminScript } from './renderOrdersAdminScript.js';
import { renderInventoryAdminScript } from './renderInventoryAdminScript.js';
import { renderPaymentsAdminScript } from './renderPaymentsAdminScript.js';
import { renderInvoicingAdminScript } from './renderInvoicingAdminScript.js';
import { renderAuditAdminScript } from './renderAuditAdminScript.js';

export function renderPhase8AdminScript(): string {
  return `
    ${renderOrdersAdminScript()}
    ${renderInventoryAdminScript()}
    ${renderPaymentsAdminScript()}
    ${renderInvoicingAdminScript()}
    ${renderAuditAdminScript()}
  `;
}
