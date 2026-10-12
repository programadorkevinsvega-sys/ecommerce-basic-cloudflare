import { describe, it, expect } from 'vitest';
import { OrdersCheckoutPolicy } from '../src/modules/orders/domain/services/OrdersCheckoutPolicy.js';
import { WompiPaymentAdapter } from '../src/modules/payments/infrastructure/adapters/WompiPaymentAdapter.js';
import { Cart } from '../src/modules/cart/domain/entities/Cart.js';
import { CartItem } from '../src/modules/cart/domain/entities/CartItem.js';

describe('Fase 8: Compras, Pagos y Políticas de Checkout', () => {
  it('OrdersCheckoutPolicy: bloquea contra entrega si un producto no lo permite y genera mensaje explícito', () => {
    const policyResult = OrdersCheckoutPolicy.evaluate({
      destinationZoneId: 'zone-bogota-local',
      zoneAllowsCod: true,
      isDestinationCovered: true,
      items: [
        {
          product: {
            productId: 'prod-1',
            name: 'Celular Smartphone Alta Gama',
            allowsCashOnDelivery: false,
            shippingScope: 'national',
            localCoverageZones: [],
          },
          quantity: 1,
        },
      ],
    });

    expect(policyResult.canProceed).toBe(true);
    expect(policyResult.allowsCashOnDelivery).toBe(false);
    expect(policyResult.codBlockingReasons[0]).toContain("El producto 'Celular Smartphone Alta Gama' no permite pago contra entrega");
    expect(policyResult.allowedPaymentMethods).toEqual(['wompi']);
  });

  it('OrdersCheckoutPolicy: bloquea la orden si un producto local se envía a otra zona no autorizada', () => {
    const policyResult = OrdersCheckoutPolicy.evaluate({
      destinationZoneId: 'zone-cali',
      zoneAllowsCod: true,
      isDestinationCovered: true,
      items: [
        {
          product: {
            productId: 'prod-local',
            name: 'Flores Frescas Medellín',
            allowsCashOnDelivery: true,
            shippingScope: 'local',
            localCoverageZones: ['zone-medellin'],
          },
          quantity: 1,
        },
      ],
    });

    expect(policyResult.canProceed).toBe(false);
    expect(policyResult.blockingReasons[0]).toContain("El producto 'Flores Frescas Medellín' solo tiene cobertura local");
  });

  it('OrdersCheckoutPolicy: permite contra entrega y Wompi si todo es conforme', () => {
    const policyResult = OrdersCheckoutPolicy.evaluate({
      destinationZoneId: 'zone-medellin',
      zoneAllowsCod: true,
      isDestinationCovered: true,
      items: [
        {
          product: {
            productId: 'prod-ok',
            name: 'Camiseta de Algodón',
            allowsCashOnDelivery: true,
            shippingScope: 'national',
            localCoverageZones: [],
          },
          quantity: 2,
        },
      ],
    });

    expect(policyResult.canProceed).toBe(true);
    expect(policyResult.allowsCashOnDelivery).toBe(true);
    expect(policyResult.allowedPaymentMethods).toEqual(['wompi', 'cash_on_delivery']);
  });

  it('WompiPaymentAdapter: genera firma de integridad SHA-256 exacta', async () => {
    const adapter = new WompiPaymentAdapter();
    const signature = await adapter.generateIntegritySignature({
      reference: 'ORDER-12345678',
      amountInCents: 5000000,
      currency: 'COP',
      integritySecret: 'test_secret_123',
    });

    expect(signature).toBeDefined();
    expect(signature.length).toBe(64); // SHA-256 hex length
  });

  it('Cart: cálculo correcto de subtotales y modificación de cantidades', () => {
    const item1 = new CartItem({
      cartId: 'cart-1',
      productId: 'p-1',
      quantity: 2,
      unitPriceCents: 1500000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const item2 = new CartItem({
      cartId: 'cart-1',
      productId: 'p-2',
      quantity: 1,
      unitPriceCents: 2000000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const cart = new Cart({
      id: 'cart-1',
      status: 'active',
      items: [item1, item2],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    expect(cart.totalQuantity).toBe(3);
    expect(cart.subtotalCents).toBe(5000000); // 2*1500000 + 1*2000000

    cart.updateItemQuantity('p-1', 4);
    expect(cart.totalQuantity).toBe(5);
    expect(cart.subtotalCents).toBe(8000000); // 4*1500000 + 1*2000000
  });
});
