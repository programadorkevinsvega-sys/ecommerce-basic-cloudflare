import { Order, ShippingAddressSnapshot, ShippingFulfillmentMethod } from '../../domain/entities/Order.js';
import { OrderLine } from '../../domain/entities/OrderLine.js';
import { IOrderRepository } from '../../domain/ports/IOrderRepository.js';
import { MAX_ORDER_AGGREGATE_BYTES, MAX_ORDER_LINES } from '../../domain/services/OrderAggregateLimits.js';

export interface CreateOrderLineInput {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitPriceCents: number;
  electronicInvoiceEnabled?: boolean;
}

export interface CreateOrderCommand {
  customerId?: string | null;
  guestCartIdHash?: string | null;
  customerEmail: string;
  customerName: string;
  customerPhone: string;
  customerTaxId?: string | null;
  customerTaxIdType?: 'CC' | 'NIT';
  customerLegalOrganizationCode?: '1' | '2';
  shippingAddress: ShippingAddressSnapshot;
  shippingZoneId: string;
  shippingCostCents: number;
  shippingDiscountCents?: number;
  shippingCollectionCents?: number;
  shippingChargeMode?: 'included' | 'collect_at_delivery';
  shippingFulfillmentMethod?: ShippingFulfillmentMethod;
  subtotalCents: number;
  discountCents?: number;
  couponCode?: string | null;
  totalCents: number;
  taxCents?: number;
  pricingVersion?: number;
  estimatedPaymentFeeCents?: number;
  transactionFeeCents?: number;
  guestTrackingTokenHash: string;
  minEstimatedDays?: number;
  maxEstimatedDays?: number;
  paymentMethod: 'wompi' | 'cash_on_delivery';
  lines: CreateOrderLineInput[];
}

export class CreateOrderUseCase {
  private readonly repo: IOrderRepository;

  public constructor(repo: IOrderRepository) {
    this.repo = repo;
  }

  public async execute(cmd: CreateOrderCommand): Promise<Order> {
    if (!Array.isArray(cmd.lines) || cmd.lines.length === 0 || cmd.lines.length > MAX_ORDER_LINES) {
      throw new Error(`El pedido debe contener entre 1 y ${MAX_ORDER_LINES} líneas`);
    }
    if (new TextEncoder().encode(JSON.stringify(cmd)).byteLength > MAX_ORDER_AGGREGATE_BYTES) {
      throw new Error('La entrada del pedido excede el límite de tamaño D1');
    }
    if (cmd.customerId && cmd.guestCartIdHash || !cmd.customerId && !/^[a-f0-9]{64}$/.test(cmd.guestCartIdHash || '')) {
      throw new Error('El mecanismo de acceso del pedido no es válido');
    }
    const orderId = `ord-${crypto.randomUUID()}`;
    const now = new Date().toISOString();

    const lines = cmd.lines.map((l) => new OrderLine({
      orderId,
      productId: l.productId,
      productName: l.productName,
      productSku: l.productSku,
      quantity: l.quantity,
      unitPriceCents: l.unitPriceCents,
      totalCents: l.quantity * l.unitPriceCents,
      electronicInvoiceEnabled: l.electronicInvoiceEnabled,
    }));

    const order = new Order({
      id: orderId,
      customerId: cmd.customerId,
      guestCartIdHash: cmd.guestCartIdHash,
      customerEmail: cmd.customerEmail,
      customerName: cmd.customerName,
      customerPhone: cmd.customerPhone,
      customerTaxIdType: cmd.customerTaxIdType,
      customerLegalOrganizationCode: cmd.customerLegalOrganizationCode,
      customerTaxId: cmd.customerTaxId,
      shippingAddress: cmd.shippingAddress,
      shippingZoneId: cmd.shippingZoneId,
      shippingCostCents: cmd.shippingCostCents,
      shippingDiscountCents: cmd.shippingDiscountCents,
      shippingCollectionCents: cmd.shippingCollectionCents,
      shippingChargeMode: cmd.shippingChargeMode,
      shippingFulfillmentMethod: cmd.shippingFulfillmentMethod,
      subtotalCents: cmd.subtotalCents,
      discountCents: cmd.discountCents || 0,
      couponCode: cmd.couponCode,
      totalCents: cmd.totalCents,
      taxCents: cmd.taxCents,
      pricingVersion: cmd.pricingVersion,
      estimatedPaymentFeeCents: cmd.estimatedPaymentFeeCents,
      transactionFeeCents: cmd.transactionFeeCents,
      guestTrackingTokenHash: cmd.guestTrackingTokenHash,
      minEstimatedDays: cmd.minEstimatedDays,
      maxEstimatedDays: cmd.maxEstimatedDays,
      paymentMethod: cmd.paymentMethod,
      status: 'placed',
      paymentStatus: 'pending',
      lines,
      createdAt: now,
      updatedAt: now,
    });

    await this.repo.saveAggregate(order, {
      orderId, fromStatus: null, toStatus: 'placed',
      note: `Pedido creado con método ${cmd.paymentMethod}`, actor: cmd.customerEmail, createdAt: now,
    }, {
      name: 'orders.order.placed.v1',
      payload: {
        orderId: order.id, customerEmail: order.customerEmail, customerName: order.customerName,
        totalCents: order.totalCents, paymentMethod: order.paymentMethod,
        items: order.lines.map((line) => ({ productId: line.productId, quantity: line.quantity })),
        timestamp: now,
      },
    });

    return order;
  }
}
