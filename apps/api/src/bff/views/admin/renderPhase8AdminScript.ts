import { renderOrdersAdminScript } from './renderOrdersAdminScript.js';
import { renderInventoryAdminScript } from './renderInventoryAdminScript.js';
import { renderPaymentsAdminScript } from './renderPaymentsAdminScript.js';

export function renderPhase8AdminScript(): string {
  return `
    ${renderOrdersAdminScript()}
    ${renderInventoryAdminScript()}
    ${renderPaymentsAdminScript()}
  `;
}
