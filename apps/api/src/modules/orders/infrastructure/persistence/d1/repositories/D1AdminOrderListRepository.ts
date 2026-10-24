import { IOrderRepository } from '../../../../domain/ports/IOrderRepository.js';
import { AdminOrderListPage, AdminOrderListQuery } from '../../../../domain/ports/AdminOrderListPage.js';
import { IAdminOrderListRepository } from '../../../../domain/ports/IAdminOrderListRepository.js';

const statuses = ['placed', 'confirmed', 'prepared', 'shipped', 'delivered', 'cancelled'] as const;
type OrderStatusCountRow = { status: typeof statuses[number]; total: number };
type OrderIdRow = { id: string };

export class D1AdminOrderListRepository implements IAdminOrderListRepository {
  constructor(private readonly db: D1Database, private readonly orders: IOrderRepository) {}

  public async list(input: AdminOrderListQuery): Promise<AdminOrderListPage> {
    const filters = buildFilters(input);
    const offset = (input.page - 1) * input.pageSize;
    const [count, statusRows, orderRows] = await Promise.all([
      this.db.prepare(`SELECT COUNT(*) AS total FROM orders_orders${filters.where}`)
        .bind(...filters.values).first<{ total: number }>(),
      this.db.prepare('SELECT status, COUNT(*) AS total FROM orders_orders GROUP BY status')
        .all<OrderStatusCountRow>(),
      this.db.prepare(`SELECT id FROM orders_orders${filters.where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`)
        .bind(...filters.values, input.pageSize + 1, offset).all<OrderIdRow>(),
    ]);
    const rows = orderRows.results || [];
    const items = await Promise.all(rows.slice(0, input.pageSize).map((row) => this.orders.findById(row.id)));
    const statusCounts = Object.fromEntries(statuses.map((status) => [status, 0])) as Record<typeof statuses[number], number>;
    for (const row of statusRows.results || []) if (row.status in statusCounts) statusCounts[row.status] = row.total;
    return {
      items: items.filter((order) => order !== null), total: count?.total || 0,
      page: input.page, pageSize: input.pageSize, hasMore: rows.length > input.pageSize, statusCounts,
    };
  }
}

function buildFilters(input: AdminOrderListQuery): { where: string; values: unknown[] } {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (input.status) { clauses.push('status = ?'); values.push(input.status); }
  if (input.paymentStatus) { clauses.push('payment_status = ?'); values.push(input.paymentStatus); }
  if (input.paymentMethod) { clauses.push('payment_method = ?'); values.push(input.paymentMethod); }
  if (input.query) {
    const term = `%${input.query.replace(/[\\%_]/g, '\\$&')}%`;
    clauses.push("(id LIKE ? ESCAPE '\\' OR customer_name LIKE ? ESCAPE '\\' OR customer_email LIKE ? ESCAPE '\\' OR customer_phone LIKE ? ESCAPE '\\')");
    values.push(term, term, term, term);
  }
  return { where: clauses.length ? ` WHERE ${clauses.join(' AND ')}` : '', values };
}
