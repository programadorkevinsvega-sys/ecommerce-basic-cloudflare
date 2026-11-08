import { Order, OrderPaymentStatus, OrderStatus } from '../../domain/entities/Order.js';
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

  public constructor(repo: IOrderRepository) {
    this.repo = repo;
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
    } else if (cmd.status === 'prepared') {
      order.markPrepared();
    } else if (cmd.status === 'delivered') {
      order.markDelivered();
    } else if (cmd.status === 'cancelled') {
      order.markCancelled();
    } else if (cmd.status) {
      order.status = cmd.status;
    }

    await this.repo.saveAggregate(order, {
      orderId: order.id,
      fromStatus,
      toStatus: order.status,
      note: cmd.note || `Cambio de estado a ${order.status}`,
      actor: cmd.actor,
      createdAt: new Date().toISOString(),
    }, {
      name: 'orders.order.status_changed.v1',
      payload: {
        orderId: order.id, fromStatus, toStatus: order.status,
        paymentStatus: order.paymentStatus, actor: cmd.actor,
      },
    });

    return order;
  }
}
