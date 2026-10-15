import { IShippingCarrierPort, CarrierQuoteRequest, CreateCarrierShipmentRequest } from '../../../application/ports/out/IShippingCarrierPort.js';
import { MiPaqueteHttpClient } from './MiPaqueteHttpClient.js';
import { MiPaqueteCreateSchema, MiPaqueteQuoteSchema, MiPaqueteSendingsSchema } from './MiPaqueteResponseSchemas.js';

export class MiPaqueteCarrierAdapter implements IShippingCarrierPort {
  private readonly client: MiPaqueteHttpClient;
  public constructor(client: MiPaqueteHttpClient) { this.client = client; }

  public async quote(input: CarrierQuoteRequest) {
    const response = await this.client.quote({
      originCountryCode: '170', originLocationCode: input.originDaneCode,
      destinyCountryCode: '170', destinyLocationCode: input.destinationDaneCode,
      quantity: input.quantity, width: input.widthCm, length: input.lengthCm,
      height: input.heightCm, weight: input.weightKg, declaredValue: input.declaredValueCop,
      ...(input.cashOnDelivery ? { saleValue: input.saleValueCop } : {}),
    });
    const parsed = MiPaqueteQuoteSchema.safeParse(response);
    if (!parsed.success) throw new Error(`Invalid MiPaquete quote response: ${describeQuoteResponse(response, parsed.error.issues)}`);
    return parsed.data.map((quote) => ({
      quoteId: quote.id, deliveryCompanyId: quote.deliveryCompanyId,
      deliveryCompanyName: quote.deliveryCompanyName, shippingCostCop: quote.shippingCost,
      collectionCommissionCop: Math.max(quote.collectionCommissionWithRate || 0, quote.collectionCommissionWithOutRate || 0),
      deliveryMinutes: quote.shippingTime,
    }));
  }

  public async create(input: CreateCarrierShipmentRequest) {
    const response = await this.client.createSending({
      sender: mapParty(input.sender, true), receiver: mapParty(input.recipient, false),
      productInformation: {
        quantity: input.package.quantity, width: input.package.widthCm, large: input.package.lengthCm,
        height: input.package.heightCm, weight: input.package.weightKg,
        declaredValue: input.package.declaredValueCop, forbiddenProduct: true,
        productReference: input.orderId,
      },
      locate: { originDaneCode: input.originDaneCode, destinyDaneCode: input.destinationDaneCode,
        originCountryCode: '170', destinyCountryCode: '170' },
      channel: 'Vega Store',
      ...(input.carrierId ? { deliveryCompany: input.carrierId } : { criteria: input.criterion }),
      description: input.description.slice(0, 200), comments: `Pedido ${input.orderId}`.slice(0, 200),
      paymentType: input.paymentType, valueCollection: input.collectionValueCop,
      requestPickup: String(input.requestPickup), adminTransactionData: { saleValue: input.saleValueCop },
    });
    const parsed = MiPaqueteCreateSchema.safeParse(response);
    if (!parsed.success) throw new Error('Invalid MiPaquete shipment response');
    return {
      providerShipmentId: parsed.data._id || null,
      mipaqueteCode: parsed.data.mpCode === undefined
        ? parsed.data.code === undefined ? null : String(parsed.data.code)
        : String(parsed.data.mpCode),
      guideNumber: parsed.data.guideNumber === undefined ? null : String(parsed.data.guideNumber),
      guideUrls: parsed.data.pdfGuide || [],
      pickupCode: parsed.data.pickupCode === undefined ? null : String(parsed.data.pickupCode),
      status: parsed.data.tracking?.at(-1)?.updateState || 'Envío creado',
    };
  }

  public async getStatus(mipaqueteCode: string) {
    const response = await this.client.listSendings(1, { pageSize: 10, mpCode: Number(mipaqueteCode) });
    const parsed = MiPaqueteSendingsSchema.safeParse(response);
    if (!parsed.success) throw new Error('Invalid MiPaquete status response');
    const sending = parsed.data.sendings.find((item) => String(item['Código mipaquete']) === mipaqueteCode);
    if (!sending) return null;
    return {
      mipaqueteCode,
      guideNumber: sending['Número de Guía'] === undefined ? null : String(sending['Número de Guía']),
      guideUrls: sending.pdfGuide || [], carrierName: sending['Transportadora'] || null,
      status: sending['Estado actual del envío'] || sending.tracking?.at(-1)?.updateState || 'Pendiente',
      tracking: (sending.tracking || []).map((event) => ({ status: event.updateState, occurredAt: event.date || null })),
    };
  }
}

function describeQuoteResponse(response: unknown, issues: Array<{ path: PropertyKey[]; message: string }>): string {
  const issueSummary = issues.slice(0, 8).map((issue) => `${issue.path.join('.')}:${issue.message}`).join('|');
  if (Array.isArray(response)) {
    const first = response[0] && typeof response[0] === 'object' ? Object.keys(response[0]).slice(0, 12).join(',') : typeof response[0];
    return `array length=${response.length}; first_keys=${first}; issues=${issueSummary}`;
  }
  if (!response || typeof response !== 'object') return `type=${typeof response}`;
  const body = response as Record<string, unknown>;
  const code = safeScalar(body.code) || safeScalar(body.statusCode) || 'none';
  const message = safeScalar(body.message) || safeScalar(body.error) || 'none';
  return `keys=${Object.keys(body).slice(0, 8).join(',')}; code=${code}; message=${message}; issues=${issueSummary}`;
}

function safeScalar(value: unknown): string {
  return typeof value === 'string' || typeof value === 'number' ? String(value).replace(/[\r\n]/g, ' ').slice(0, 70) : '';
}

function mapParty(party: CreateCarrierShipmentRequest['sender'], sender: boolean) {
  return {
    name: party.name, surname: party.surname, cellPhone: party.phone, prefix: '+57',
    email: party.email, ...(sender ? { pickupAddress: party.address } : { destinationAddress: party.address }),
    nit: party.identification, nitType: party.identificationType,
  };
}
