import { NotificationsGateway } from '../notifications/NotificationsGateway.js';

export class InProcessAdminLoginLockoutAlert {
  public constructor(private readonly notifications: NotificationsGateway) {}

  public async notifyAdminLoginBlocked(input: {
    adminEmail: string;
    idempotencyKey: string;
    traceId?: string;
  }): Promise<void> {
    try {
      const result = await this.notifications.sendEmail({
        recipientEmail: input.adminEmail,
        templateName: 'admin_login_ip_lockout',
        subject: 'Alerta de seguridad: acceso administrativo bloqueado temporalmente',
        html: '<p>Se bloquearon temporalmente los nuevos intentos de acceso administrativo desde un origen de red tras varios intentos fallidos.</p><p>Si no reconoces esta actividad, revisa la seguridad de tu cuenta.</p>',
        text: 'Se bloquearon temporalmente los nuevos intentos de acceso administrativo desde un origen de red tras varios intentos fallidos. Si no reconoces esta actividad, revisa la seguridad de tu cuenta.',
        idempotencyKey: input.idempotencyKey,
      });
      if (!result.success) throw new Error('El proveedor no aceptó el correo de alerta');
    } catch (error) {
      console.error(JSON.stringify({
        timestamp: new Date().toISOString(),
        service: 'ecommerce-api',
        event: 'security.admin_login_lockout_alert_failed',
        module: 'identity',
        level: 'error',
        trace_id: input.traceId || 'unknown',
        error_name: error instanceof Error ? error.name : 'UnknownError',
      }));
      throw new Error('No se pudo enviar la alerta de bloqueo administrativo');
    }
  }
}
