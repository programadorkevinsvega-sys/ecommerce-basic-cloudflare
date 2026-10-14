export interface CheckoutProductPolicyItem {
  productId: string;
  name: string;
  allowsCashOnDelivery: boolean;
  shippingScope: 'national' | 'local';
  localCoverageZones: string[];
  allowedPaymentMethods?: Array<'wompi' | 'cash_on_delivery'>;
}

export interface CheckoutEvaluationInput {
  destinationZoneId: string;
  zoneAllowsCod: boolean;
  isDestinationCovered: boolean;
  items: Array<{ product: CheckoutProductPolicyItem; quantity: number }>;
}

export interface CheckoutEvaluationResult {
  canProceed: boolean;
  blockingReasons: string[];
  allowsCashOnDelivery: boolean;
  codBlockingReasons: string[];
  allowedPaymentMethods: Array<'wompi' | 'cash_on_delivery'>;
}

export class OrdersCheckoutPolicy {
  public static evaluate(input: CheckoutEvaluationInput): CheckoutEvaluationResult {
    const blockingReasons: string[] = [];
    const codBlockingReasons: string[] = [];
    let allowedByProducts: Array<'wompi' | 'cash_on_delivery'> = ['wompi', 'cash_on_delivery'];

    if (!input.isDestinationCovered) {
      blockingReasons.push('El destino seleccionado no cuenta con cobertura de envío activa.');
    }

    for (const item of input.items) {
      const p = item.product;
      const productMethods = p.allowedPaymentMethods ?? ['wompi', 'cash_on_delivery'];
      allowedByProducts = allowedByProducts.filter((method) => method === 'cash_on_delivery'
        ? p.allowsCashOnDelivery
        : productMethods.includes(method));

      // 1. Cobertura de productos locales
      if (p.shippingScope === 'local') {
        const isCoveredByLocal = p.localCoverageZones.includes(input.destinationZoneId);
        if (!isCoveredByLocal) {
          blockingReasons.push(
            `El producto '${p.name}' solo tiene cobertura local y no puede enviarse a la zona seleccionada.`
          );
        }
      }

      // 2. Política de pago contra entrega por producto
      if (!p.allowsCashOnDelivery) {
        codBlockingReasons.push(
          `El producto '${p.name}' no permite pago contra entrega.`
        );
      }
    }

    // 3. Política de contra entrega por zona de transporte
    if (!input.zoneAllowsCod) {
      codBlockingReasons.push('La zona de envío seleccionada no admite recaudos contra entrega.');
    }

    const canProceed = blockingReasons.length === 0;
    const allowsCod = canProceed && codBlockingReasons.length === 0 && allowedByProducts.includes('cash_on_delivery');
    const allowedPaymentMethods: Array<'wompi' | 'cash_on_delivery'> = canProceed ? allowedByProducts.filter((method) => method !== 'cash_on_delivery' || allowsCod) : [];

    return {
      canProceed,
      blockingReasons,
      allowsCashOnDelivery: allowsCod,
      codBlockingReasons,
      allowedPaymentMethods,
    };
  }
}
