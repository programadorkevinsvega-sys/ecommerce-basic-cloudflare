import { CarrierShipment } from '../../domain/entities/CarrierShipment.js';
import { CarrierIntegrationConfig } from '../../domain/entities/CarrierIntegrationConfig.js';
import { ICarrierConfigRepository } from '../../domain/ports/ICarrierConfigRepository.js';
import { ICarrierQuoteRepository } from '../../domain/ports/ICarrierQuoteRepository.js';
import { ICarrierShipmentRepository } from '../../domain/ports/ICarrierShipmentRepository.js';
import { IShippingCarrierPort, CarrierParty } from '../ports/out/IShippingCarrierPort.js';

export interface CarrierOrderInput {
  orderId: string; status: string; paymentStatus: string; paymentMethod: 'wompi' | 'cash_on_delivery';
  totalCents: number; shippingCostCents: number; transactionFeeCents: number; destinationDaneCode: string; destinationAddress: string;
  recipient: CarrierParty; sender: CarrierParty; description: string;
}

export class CreateMiPaqueteShipmentUseCase {
  private readonly configs: ICarrierConfigRepository;
  private readonly quotes: ICarrierQuoteRepository;
  private readonly shipments: ICarrierShipmentRepository;
  private readonly carrier: IShippingCarrierPort;
  public constructor(configs: ICarrierConfigRepository, quotes: ICarrierQuoteRepository, shipments: ICarrierShipmentRepository, carrier: IShippingCarrierPort) {
    this.configs = configs; this.quotes = quotes; this.shipments = shipments; this.carrier = carrier;
  }

  public async execute(order: CarrierOrderInput): Promise<CarrierShipment> {
    assertOrderEligible(order);
    const existing = await this.shipments.findByOrderId(order.orderId);
    if (existing) {
      if (existing.status === 'creation_pending') throw new Error('La creación está pendiente de conciliación; no reintentes para evitar una guía duplicada.');
      return existing;
    }
    const [config, quote] = await Promise.all([this.configs.get(), this.quotes.findByOrderId(order.orderId)]);
    assertConfigured(config);
    if (!config.enabled) throw new Error('La integración MiPaquete está desactivada.');
    if (!quote || quote.paymentMethod !== order.paymentMethod) throw new Error('No existe una cotización MiPaquete válida para este pedido.');
    if (!quote.packageProfileId || !quote.packageWidthCm || !quote.packageLengthCm || !quote.packageHeightCm ||
        !quote.packageWeightKg || !quote.packageFingerprint) {
      throw new Error('La cotización no tiene una instantánea de empaque válida. Cotiza nuevamente el pedido.');
    }
    // MiPaquete separa el valor de mercancía del recaudo. La mercancía usa el
    // subtotal final (con IVA incluido en el precio) y no suma flete ni tarifa Wompi.
    const saleValueCents = Math.max(0, order.totalCents - order.shippingCostCents - order.transactionFeeCents);
    const currentOptions = await this.carrier.quote({
      originDaneCode: config.originDaneCode as string, destinationDaneCode: order.destinationDaneCode,
      widthCm: quote.packageWidthCm, lengthCm: quote.packageLengthCm,
      heightCm: quote.packageHeightCm, weightKg: quote.packageWeightKg,
      quantity: 1, declaredValueCop: Math.ceil(quote.declaredValueCents / 100),
      saleValueCop: Math.ceil(saleValueCents / 100), cashOnDelivery: order.paymentMethod === 'cash_on_delivery',
    });
    const selected = currentOptions.find((option) => option.deliveryCompanyId === quote.deliveryCompanyId);
    if (!selected || selected.shippingCostCop * 100 > order.shippingCostCents) {
      throw new Error('La tarifa vigente supera el envío pagado. Revisa el pedido antes de generar la guía.');
    }
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const requestHash = await hashRequest({ orderId: order.orderId, quoteId: quote.id, selected: selected.quoteId });
    const inserted = await this.shipments.createPending({
      id, orderId: order.orderId, collectionValueCents: order.paymentMethod === 'cash_on_delivery' ? order.totalCents : 0,
      requestHash, now,
    });
    if (!inserted) throw new Error('Ya existe una guía o creación pendiente para este pedido.');
    const created = await this.carrier.create({
      orderId: order.orderId, sender: order.sender, recipient: order.recipient,
      package: { widthCm: quote.packageWidthCm, lengthCm: quote.packageLengthCm,
        heightCm: quote.packageHeightCm, weightKg: quote.packageWeightKg, quantity: 1,
        declaredValueCop: Math.ceil(quote.declaredValueCents / 100) },
      originDaneCode: config.originDaneCode as string, destinationDaneCode: order.destinationDaneCode,
      carrierId: quote.deliveryCompanyId, criterion: config.selectionCriterion as 'price' | 'time' | 'score',
      paymentType: order.paymentMethod === 'cash_on_delivery' ? config.cashOnDeliveryPaymentType as 101 | 102 : 101,
      collectionValueCop: order.paymentMethod === 'cash_on_delivery' ? Math.ceil(order.totalCents / 100) : 0,
      saleValueCop: order.paymentMethod === 'cash_on_delivery' ? Math.ceil(saleValueCents / 100) : 0,
      requestPickup: Boolean(config.requestPickup), description: order.description.slice(0, 200),
    });
    const updatedAt = new Date().toISOString();
    await this.shipments.update(id, {
      providerShipmentId: created.providerShipmentId, mipaqueteCode: created.mipaqueteCode,
      carrierName: selected.deliveryCompanyName, guideNumber: created.guideNumber,
      guideUrl: created.guideUrls[0] || null, pickupCode: created.pickupCode,
      providerStatus: created.status, status: 'created', shippingCostCents: selected.shippingCostCop * 100,
      lastSyncedAt: updatedAt,
    }, updatedAt);
    return (await this.shipments.findById(id)) as CarrierShipment;
  }
}

function assertOrderEligible(order: CarrierOrderInput): void {
  if (order.paymentMethod === 'wompi' && order.paymentStatus !== 'approved') throw new Error('El pago del pedido aún no está aprobado.');
  if (order.paymentMethod === 'cash_on_delivery' && order.status !== 'confirmed' && order.status !== 'prepared') {
    throw new Error('Confirma el pedido contra entrega antes de generar la guía.');
  }
  if (!['confirmed', 'prepared'].includes(order.status) || !/^\d{8}$/.test(order.destinationDaneCode)) {
    throw new Error('El pedido o destino no está listo para envío.');
  }
}

function assertConfigured(config: CarrierIntegrationConfig): void {
  if (!config.originDaneCode || !config.packageProfiles.some((profile) => profile.isActive) ||
      !config.cashOnDeliveryPaymentType || !config.selectionCriterion || config.requestPickup === null) {
    throw new Error('Completa la configuración logística de MiPaquete.');
  }
}

async function hashRequest(value: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
