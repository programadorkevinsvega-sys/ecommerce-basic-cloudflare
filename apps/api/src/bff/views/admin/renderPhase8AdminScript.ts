import { renderOrdersAdminScript } from './renderOrdersAdminScript.js';
import { renderOrdersAdminListScript } from './renderOrdersAdminListScript.js';
import { renderInventoryAdminScript } from './renderInventoryAdminScript.js';
import { renderInventoryListScript } from './renderInventoryListScript.js';
import { renderInventoryAdjustScript } from './renderInventoryAdjustScript.js';
import { renderPaymentsAdminScript } from './renderPaymentsAdminScript.js';
import { renderInvoicingAdminScript } from './renderInvoicingAdminScript.js';
import { renderAuditAdminScript } from './renderAuditAdminScript.js';

export function renderPhase8AdminScript(): string {
  return `
    ${renderOrdersAdminScript()}
    ${renderOrdersAdminListScript()}
    ${renderInventoryAdminScript()}
    ${renderInventoryListScript()}
    ${renderInventoryAdjustScript()}
    ${renderPaymentsAdminScript()}
    ${renderInvoicingAdminScript()}
    ${renderAuditAdminScript()}
  `;
}
