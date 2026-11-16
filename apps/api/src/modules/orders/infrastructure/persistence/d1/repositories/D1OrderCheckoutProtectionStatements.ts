import { Order } from '../../../../domain/entities/Order.js';
import { OrderCreationProtection } from '../../../../domain/ports/IOrderRepository.js';
import { GUEST_CHECKOUT_LIMITS } from '../../../../domain/services/GuestCheckoutLimits.js';

export function buildD1OrderCheckoutProtectionStatements(
  db: D1Database,
  order: Order,
  protection: OrderCreationProtection,
): D1PreparedStatement[] {
  const pendingCutoff = new Date(Date.parse(order.createdAt) - GUEST_CHECKOUT_LIMITS.pendingWindowMinutes * 60_000).toISOString();
  const emailCutoff = new Date(Date.parse(order.createdAt) - GUEST_CHECKOUT_LIMITS.emailWindowMinutes * 60_000).toISOString();
  const emailConditions = protection.emailReservations.map(() =>
    `AND (SELECT COALESCE(SUM(email_count), 0) FROM orders_guest_checkout_email_reservations
      WHERE recipient_fingerprint = ? AND created_at >= ?) + ? <= ?`).join('\n');
  const emailBindings = protection.emailReservations.flatMap((reservation) => [
    reservation.recipientFingerprint, emailCutoff, reservation.count, GUEST_CHECKOUT_LIMITS.emailsPerRecipient,
  ]);
  return [
    db.prepare('DELETE FROM orders_guest_checkout_attempts WHERE created_at < ?').bind(emailCutoff),
    db.prepare('DELETE FROM orders_guest_checkout_email_reservations WHERE created_at < ?').bind(emailCutoff),
    db.prepare(
      `INSERT INTO orders_guest_checkout_attempts (
        order_id, ip_fingerprint, email_fingerprint, cart_fingerprint, pending, created_at
      )
      SELECT ?, ?, ?, ?, 1, ?
      WHERE
        (SELECT COUNT(*) FROM orders_guest_checkout_attempts
          WHERE ip_fingerprint = ? AND pending = 1 AND created_at >= ?) < ?
        AND (SELECT COUNT(*) FROM orders_guest_checkout_attempts
          WHERE email_fingerprint = ? AND pending = 1 AND created_at >= ?) < ?
        AND (SELECT COUNT(*) FROM orders_guest_checkout_attempts
          WHERE cart_fingerprint = ? AND pending = 1 AND created_at >= ?) < ?
        ${emailConditions}
      ON CONFLICT(order_id) DO NOTHING`
    ).bind(
      order.id, protection.ipFingerprint, protection.emailFingerprint, protection.cartFingerprint,
      order.createdAt,
      protection.ipFingerprint, pendingCutoff, GUEST_CHECKOUT_LIMITS.pendingPerIp,
      protection.emailFingerprint, pendingCutoff, GUEST_CHECKOUT_LIMITS.pendingPerEmail,
      protection.cartFingerprint, pendingCutoff, GUEST_CHECKOUT_LIMITS.pendingPerCart,
      ...emailBindings,
    ),
    ...protection.emailReservations.map((reservation) => db.prepare(
      `INSERT INTO orders_guest_checkout_email_reservations
        (order_id, recipient_fingerprint, email_count, created_at)
       SELECT ?, ?, ?, ?
       WHERE EXISTS (
         SELECT 1 FROM orders_guest_checkout_attempts
         WHERE order_id = ? AND created_at = ?
       )
       ON CONFLICT(order_id, recipient_fingerprint) DO NOTHING`
    ).bind(order.id, reservation.recipientFingerprint, reservation.count, order.createdAt, order.id, order.createdAt)),
  ];
}
