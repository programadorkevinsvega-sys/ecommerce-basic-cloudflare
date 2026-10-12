export function normalizeShippingAddress(raw: any) {
  const r = raw || {};
  return {
    department:   r.department  || r.dept   || '',
    municipality: r.municipality || r.city   || r.department || '',
    daneCode:     r.daneCode    || r.dane    || '000000',
    addressLine:  r.addressLine || r.address || '',
    notes:        r.notes,
  };
}
