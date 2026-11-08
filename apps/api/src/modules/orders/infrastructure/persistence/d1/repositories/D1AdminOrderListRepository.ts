import { AdminOrderListItem } from '../../../../domain/ports/AdminOrderListItem.js';
import { AdminOrderListPage, AdminOrderListQuery } from '../../../../domain/ports/AdminOrderListPage.js';
import { IAdminOrderListRepository } from '../../../../domain/ports/IAdminOrderListRepository.js';
import { AdminOrderSummaryItem } from '../../../../domain/ports/AdminOrderSummaryItem.js';

interface AdminOrderListRow {
  id: string;
  customer_name: string;
  customer_phone: string;
  total_cents: number;
  payment_method: 'wompi' | 'cash_on_delivery';
  status: AdminOrderListItem['status'];
  payment_status: AdminOrderListItem['paymentStatus'];
  created_at: string;
}

interface AdminOrderSummaryRow extends AdminOrderListRow {
  customer_email: string;
  shipping_address: string;
}

export class D1AdminOrderListRepository implements IAdminOrderListRepository {
  constructor(private readonly db: D1Database) {}

  public async list(input: AdminOrderListQuery): Promise<AdminOrderListPage> {
    const filters = buildFilters(input);
    const offset = (input.page - 1) * input.pageSize;
    const [count, orderRows] = await Promise.all([
      this.db.prepare(`SELECT COUNT(*) AS total FROM orders_orders${filters.where}`)
        .bind(...filters.values).first<{ total: number }>(),
      this.db.prepare(`SELECT id, customer_name, customer_phone, total_cents, payment_method, status, payment_status, created_at
        FROM orders_orders${filters.where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
        .bind(...filters.values, input.pageSize + 1, offset).all<AdminOrderListRow>(),
    ]);
    const rows = orderRows.results || [];
    return {
      items: rows.slice(0, input.pageSize).map(mapAdminOrderListItem),
      total: count?.total || 0,
      page: input.page,
      pageSize: input.pageSize,
      hasMore: rows.length > input.pageSize,
    };
  }

  public async summary(limit: number): Promise<AdminOrderSummaryItem[]> {
    const { results } = await this.db.prepare(`SELECT id, customer_email, customer_name, customer_phone, shipping_address,
      total_cents, payment_method, status, payment_status, created_at FROM orders_orders
      ORDER BY created_at DESC, id DESC LIMIT ?`).bind(Math.min(Math.max(limit, 1), 100)).all<AdminOrderSummaryRow>();
    return (results || []).map((row) => ({
      ...mapAdminOrderListItem(row),
      customerEmail: row.customer_email,
      shippingAddress: parseSummaryAddress(row.shipping_address),
    }));
  }
}

function buildFilters(input: AdminOrderListQuery): { where: string; values: unknown[] } {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (input.status) { clauses.push('status = ?'); values.push(input.status); }
  if (input.paymentStatus) { clauses.push('payment_status = ?'); values.push(input.paymentStatus); }
  if (input.paymentMethod) { clauses.push('payment_method = ?'); values.push(input.paymentMethod); }
  const query = input.query?.trim();
  if (query) {
    const prefix = `${escapeLike(query)}%`;
    clauses.push("(id = ? OR id LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_email LIKE ? ESCAPE '\\' OR customer_phone LIKE ? ESCAPE '\\')");
    values.push(query, prefix, prefix, prefix, prefix);
  }
  return { where: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', values };
}

function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&');
}

function mapAdminOrderListItem(row: AdminOrderListRow): AdminOrderListItem {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    totalCents: row.total_cents,
    paymentMethod: row.payment_method,
    status: row.status,
    paymentStatus: row.payment_status,
    createdAt: row.created_at,
  };
}

function parseSummaryAddress(value: string): AdminOrderSummaryItem['shippingAddress'] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object') return {};
    const address = parsed as Record<string, unknown>;
    return {
      municipality: typeof address.municipality === 'string' ? address.municipality : undefined,
      department: typeof address.department === 'string' ? address.department : undefined,
    };
  } catch {
    return {};
  }
}
