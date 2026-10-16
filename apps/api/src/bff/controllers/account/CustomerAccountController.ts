import { Hono } from 'hono';
import { getCookie } from 'hono/cookie';
import { Env } from '../../../platform/Env.js';
import { IdentityGateway } from '../../gateways/identity/IdentityGateway.js';
import { OrdersGateway } from '../../gateways/orders/OrdersGateway.js';
import { InvoicingGateway } from '../../gateways/invoicing/InvoicingGateway.js';
import { renderCustomerAccountPage } from '../../views/account/renderCustomerAccountPage.js';

export class CustomerAccountController {
  public static createRoutes(
    identityGateway: IdentityGateway,
    ordersGateway: OrdersGateway,
    invoicingGateway: InvoicingGateway
  ): Hono<{ Bindings: Env }> {
    const app = new Hono<{ Bindings: Env }>();

    const getCustomerSession = async (c: any) => {
      const auth = c.req.header('Authorization');
      const token = auth?.startsWith('Bearer ') ? auth.slice(7) : getCookie(c, '__Host-session');
      if (!token) return null;
      try {
        const ver = await identityGateway.validateSession(token);
        return ver?.actorType === 'customer' ? ver : null;
      } catch {
        return null;
      }
    };

    // GET /cuenta — Vista principal de la cuenta del cliente
    app.get('/cuenta', async (c) => {
      const session = await getCustomerSession(c);
      if (!session) {
        return c.redirect('/auth/login?redirect=/cuenta');
      }

      const [profile, orders, invoices] = await Promise.all([
        identityGateway.getCustomerProfile(session.actorId),
        ordersGateway.listOrders({ customerId: session.actorId, limit: 50 }),
        invoicingGateway.listInvoices({ customerId: session.actorId, limit: 50 }),
      ]);

      const html = renderCustomerAccountPage({
        customer: {
          id: session.actorId,
          email: profile.email,
          fullName: profile.fullName,
        },
        orders: orders.map((o) => o.toJSON()),
        invoices: invoices.map((i) => i.toJSON()),
      });
      c.header('Cache-Control', 'private, no-store');
      return c.html(html);
    });

    // GET /api/v1/customer/orders — API de pedidos del cliente autenticado
    app.get('/api/v1/customer/orders', async (c) => {
      const session = await getCustomerSession(c);
      if (!session) return c.json({ error: 'No autorizado' }, 401);

      const orders = await ordersGateway.listOrders({ customerId: session.actorId, limit: 50 });
      return c.json({ success: true, orders: orders.map((o) => o.toJSON()) });
    });

    // GET /api/v1/customer/invoices — API de facturas del cliente autenticado
    app.get('/api/v1/customer/invoices', async (c) => {
      const session = await getCustomerSession(c);
      if (!session) return c.json({ error: 'No autorizado' }, 401);

      const invoices = await invoicingGateway.listInvoices({ customerId: session.actorId, limit: 50 });
      return c.json({ success: true, invoices: invoices.map((i) => i.toJSON()) });
    });

    return app;
  }
}
