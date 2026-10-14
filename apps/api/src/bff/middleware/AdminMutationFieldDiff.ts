const SAFE_FIELDS = new Set([
  'id', 'orderId', 'productId', 'name', 'title', 'slug', 'status', 'priceInCents', 'stockQuantity', 'quantity',
  'pricingTargetType', 'targetProfitCents', 'targetMarginBasisPoints',
  'reservedQuantity', 'availableQuantity', 'sortOrder', 'placement', 'bannerType', 'isActive',
  'startsAt', 'endsAt', 'buttonText', 'altText', 'shippingScope', 'saleMode',
  'allowsCashOnDelivery', 'targetType', 'targetId', 'discountType', 'discountValue',
  'minOrderAmountCents', 'maxUsesGlobal', 'maxUsesPerCustomer', 'priority', 'sku',
  'type', 'priceInCents', 'minEstimatedDays', 'maxEstimatedDays', 'read', 'amountInCents',
  'paymentMethod', 'paymentStatus', 'totalCents', 'subtotalCents', 'shippingCostCents',
  'discountCents', 'currentVersion', 'taxRatePercent', 'currency', 'requireCodVerification',
]);

export function auditFieldDiff(before: unknown, after: unknown): Record<string, unknown> {
  const prior = project(before);
  const current = project(after);
  const changed: Record<string, unknown> = {};
  for (const key of new Set([...Object.keys(prior), ...Object.keys(current)])) {
    if (JSON.stringify(prior[key]) === JSON.stringify(current[key])) continue;
    if (Array.isArray(prior[key]) || Array.isArray(current[key])) {
      changed[key] = diffItems(Array.isArray(prior[key]) ? prior[key] : [], Array.isArray(current[key]) ? current[key] : []);
      continue;
    }
    changed[key] = SAFE_FIELDS.has(key)
      ? { ...(key in prior ? { before: prior[key] } : {}), ...(key in current ? { after: current[key] } : {}) }
      : { changed: true };
  }
  return changed;
}

function diffItems(before: unknown[], after: unknown[]): Record<string, unknown> {
  const index = (items: unknown[]) => new Map(items.map((item, position) => {
    const record = item as Record<string, unknown>;
    return [String(record.id ?? record.productId ?? position), item];
  }));
  const prior = index(before);
  const current = index(after);
  const keys = new Set([...prior.keys(), ...current.keys()]);
  const changed = [...keys].flatMap((key) => {
    const oldValue = prior.get(key);
    const newValue = current.get(key);
    const fields = auditFieldDiff(oldValue, newValue);
    return Object.keys(fields).length ? [{ id: key, fields }] : [];
  });
  return { changed: changed.slice(0, 20), totalChanged: changed.length, truncated: changed.length > 20 };
}

function project(value: unknown): Record<string, unknown> {
  if (value === null || value === undefined) return {};
  const source = Array.isArray(value) ? { items: value } : value;
  if (typeof source !== 'object') return {};
  const record = source as Record<string, unknown>;
  const props = record.props && typeof record.props === 'object' ? record.props as Record<string, unknown> : record;
  const result: Record<string, unknown> = {};
  for (const [key, entry] of Object.entries(props)) {
    if (!isSensitiveField(key) && isSafeValue(entry)) result[key] = entry;
    if (key === 'salePolicy' && entry && typeof entry === 'object') {
      for (const [nestedKey, nestedValue] of Object.entries(entry)) {
        if (SAFE_FIELDS.has(nestedKey) && isSafeValue(nestedValue)) result[nestedKey] = nestedValue;
      }
    }
    if (key === 'items' && Array.isArray(entry)) {
      result.items = entry.map((item) => project(item));
    }
    if (key === 'lines' && Array.isArray(entry)) {
      result.lines = entry.map((line) => project(line));
    }
  }
  return result;
}

function isSensitiveField(key: string): boolean {
  return /password|secret|token|email|phone|address|notes|receipt|authorization|credential|customer|recipient|body|content|image|url|reason|data/i.test(key);
}

function isSafeValue(value: unknown): boolean {
  return value === null || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
    || (Array.isArray(value) && value.every((item) => typeof item === 'string' || typeof item === 'number'));
}
