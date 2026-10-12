import { Order, OrderPaymentStatus, OrderStatus } from '../../domain/entities/Order.js';
import { IOrderOutboxRepository } from '../../domain/ports/IOrderOutboxRepository.js';
import { IOrderRepository } from '../../domain/ports/IOrderRepository.js';

export interface UpdateOrderStatusCommand {
  orderId: string;
  status?: OrderStatus;
  paymentStatus?: OrderPaymentStatus;
  note?: string;
  actor: string;
}

export class UpdateOrderStatusUseCase {
  private readonly repo: IOrderRepository;
  private readonly outbox: IOrderOutboxRepository;

  public constructor(repo: IOrderRepository, outbox: IOrderOutboxRepository) {
    this.repo = repo;
    this.outbox = outbox;
  }

  public async execute(cmd: UpdateOrderStatusCommand): Promise<Order> {
    const order = await this.repo.findById(cmd.orderId);
    if (!order) {
      throw new Error(`Order with id '${cmd.orderId}' not found`);
    }

    const fromStatus = order.status;

    if (cmd.paymentStatus === 'approved') {
      order.markPaymentApproved();
    } else if (cmd.paymentStatus === 'collected') {
      order.markPaymentCollected();
    } else if (cmd.paymentStatus) {
      order.paymentStatus = cmd.paymentStatus;
    }

    if (cmd.status === 'shipped') {
      order.markShipped();
    } else if (cmd.status === 'delivered') {
      order.markDelivered();
    } else if (cmd.status === 'cancelled') {
      order.markCancelled();
    } else if (cmd.status) {
      order.status = cmd.status;
    }

    await this.repo.save(order);
    await this.repo.addHistory({
      orderId: order.id,
      fromStatus,
      toStatus: order.status,
      note: cmd.note || `Cambio de estado a ${order.status}`,
      actor: cmd.actor,
      createdAt: new Date().toISOString(),
    });

    await this.outbox.publish('orders.order.status_changed.v1', {
      orderId: order.id,
      fromStatus,
      toStatus: order.status,
      paymentStatus: order.paymentStatus,
      actor: cmd.actor,
    });

    return order;
  }
}
