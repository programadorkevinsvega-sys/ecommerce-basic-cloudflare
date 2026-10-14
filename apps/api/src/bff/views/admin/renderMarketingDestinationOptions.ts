import type { MarketingDestinationOption } from './AdminDashboardProps.js';

export function renderMarketingDestinationOptions(
  destinations: MarketingDestinationOption[],
  savedPlacements: string[]
): string {
  const options = [...destinations];
  const known = new Set(destinations.map((item) => item.value));
  for (const value of savedPlacements) {
    if (known.has(value) || /^[a-z_]+$/.test(value)) continue;
    options.push({ value, label: `${value} (destino guardado)`, group: 'Destinos guardados' });
    known.add(value);
  }
  const groups = new Map<string, MarketingDestinationOption[]>();
  for (const item of options) groups.set(item.group, [...(groups.get(item.group) || []), item]);
  return [...groups.entries()].map(([group, items]) =>
    `<optgroup label="${escapeHtml(group)}">${items.map(renderOption).join('')}</optgroup>`
  ).join('');
}

function renderOption(item: MarketingDestinationOption): string {
  return `<option value="${escapeHtml(item.value)}">${escapeHtml(item.label)}</option>`;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
