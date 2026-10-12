import { Order, ShippingAddressSnapshot } from '../../domain/entities/Order.js';
import { OrderLine } from '../../domain/entities/OrderLine.js';
import { IOrderOutboxRepository } from '../../domain/ports/IOrderOutboxRepository.js';
import { IOrderRepository } from '../../domain/ports/IOrderRepository.js';

export interface CreateOrderLineInput {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceCents: number;
}

export interface CreateOrderCommand {
  customerId?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerTaxId?: string | null;
  shippingAddress: ShippingAddressSnapshot;
  shippingZoneId: string;
  shippingCostCents: number;
  subtotalCents: number;
  discountCents?: number;
  couponCode?: string | null;
  totalCents: number;
  paymentMethod: 'wompi' | 'cash_on_delivery';
  lines: CreateOrderLineInput[];
}

export class CreateOrderUseCase {
  private readonly repo: IOrderRepository;
  private readonly outbox: IOrderOutboxRepository;

  public constructor(repo: IOrderRepository, outbox: IOrderOutboxRepository) {
    this.repo = repo;
    this.outbox = outbox;
  }

  public async execute(cmd: CreateOrderCommand): Promise<Order> {
    const orderId = `ord-${crypto.randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();

    const lines = cmd.lines.map((l) => new OrderLine({
      orderId,
      productId: l.productId,
      productName: l.productName,
      productSku: l.productSku,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
      totalCents: l.quantity * l.unitPriceCents,
    }));

    const order = new Order({
      id: orderId,
      customerId: cmd.customerId,
      customerEmail: cmd.customerEmail,
      customerName: cmd.customerName,
      customerPhone: cmd.customerPhone,
      customerTaxId: cmd.customerTaxId,
      shippingAddress: cmd.shippingAddress,
      shippingZoneId: cmd.shippingZoneId,
      shippingCostCents: cmd.shippingCostCents,
      subtotalCents: cmd.subtotalCents,
      discountCents: cmd.discountCents || 0,
      couponCode: cmd.couponCode,
      totalCents: cmd.totalCents,
      paymentMethod: cmd.paymentMethod,
      status: 'placed',
      paymentStatus: 'pending',
      lines,
      createdAt: now,
      updatedAt: now,
    });

    await this.repo.save(order);
    await this.repo.addHistory({
      orderId,
      fromStatus: null,
      toStatus: 'placed',
      note: `Pedido creado con método ${cmd.paymentMethod}`,
      actor: cmd.customerEmail,
      createdAt: now,
    });

    await this.outbox.publish('orders.order.placed.v1', {
      orderId: order.id,
      customerEmail: order.customerEmail,
      customerName: order.customerName,
      totalCents: order.totalCents,
      paymentMethod: order.paymentMethod,
      items: order.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
      timestamp: now,
    });

    return order;
  }
}
