import { IShippingCarrierPort, CarrierQuoteRequest, CreateCarrierShipmentRequest, CarrierShipmentLookup } from '../../../application/ports/out/IShippingCarrierPort.js';
import { MiPaqueteHttpClient } from './MiPaqueteHttpClient.js';
import { MiPaqueteCreateSchema, MiPaqueteLocationsSchema, MiPaqueteQuoteSchema, MiPaqueteSendingsSchema } from './MiPaqueteResponseSchemas.js';

export class MiPaqueteCarrierAdapter implements IShippingCarrierPort {
  private readonly client: MiPaqueteHttpClient;
  public constructor(client: MiPaqueteHttpClient) { this.client = client; }

  public async listLocations() {
    const response = await this.client.listLocations();
    const parsed = MiPaqueteLocationsSchema.safeParse(response);
    if (!parsed.success) throw new Error('Invalid MiPaquete locations response');
    return parsed.data;
  }

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
      deliveryCompanyName: quote.deliveryCompanyName, shippingCostCop: Math.ceil(quote.shippingCost),
      collectionCommissionCop: Math.ceil(Math.max(quote.collectionCommissionWithRate || 0, quote.collectionCommissionWithOutRate || 0)),
      deliveryMinutes: Math.ceil(quote.shippingTime),
    }));
  }

  public async create(input: CreateCarrierShipmentRequest) {
    const response = await this.client.createSending({
      sender: mapParty(input.sender, true), receiver: mapParty(input.recipient, false),
      productInformation: {
        quantity: input.package.quantity, width: input.package.widthCm, large: input.package.lengthCm,
        height: input.package.heightCm, weight: input.package.weightKg,
        declaredValue: input.package.declaredValueCop, forbiddenProduct: true,
        productReference: input.description.slice(0, 200),
      },
      locate: { originDaneCode: input.originDaneCode, destinyDaneCode: input.destinationDaneCode,
        originCountryCode: '170', destinyCountryCode: '170' },
      channel: 'Vega Store',
      ...(input.carrierId ? { deliveryCompany: input.carrierId } : { criteria: input.criterion }),
      description: input.description.slice(0, 200), comments: `Pedido ${input.orderId}`.slice(0, 200),
      paymentType: input.paymentType, valueCollection: input.collectionValueCop,
      requestPickup: input.requestPickup, adminTransactionData: { saleValue: input.saleValueCop },
    });
    const parsed = MiPaqueteCreateSchema.safeParse(response);
    if (!parsed.success) throw new Error('Invalid MiPaquete shipment response');
    return {
      providerShipmentId: parsed.data._id || null,
      mipaqueteCode: parsed.data.mpCode === undefined
        ? parsed.data.code === undefined ? null : String(parsed.data.code)
        : String(parsed.data.mpCode),
      guideNumber: nullableProviderValue(parsed.data.guideNumber),
      guideUrls: parsed.data.pdfGuide || [],
      pickupCode: nullableProviderValue(parsed.data.pickupCode),
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
      guideNumber: nullableProviderValue(sending['Número de Guía']),
      guideUrls: sending.pdfGuide || [], carrierName: sending['Transportadora'] || null,
      status: sending['Estado actual del envío'] || sending.tracking?.at(-1)?.updateState || 'Pendiente',
      tracking: (sending.tracking || []).map((event) => ({ status: event.updateState, occurredAt: event.date || null })),
    };
  }

  public async findByOrderReference(orderId: string): Promise<CarrierShipmentLookup> {
    const pageSize = 25;
    const maxPages = 8;
    const first = await this.sendingsPage(1, pageSize);
    const total = first.totalItems;
    if (total !== undefined && total > pageSize * maxPages) return { kind: 'inconclusive' };
    const pages = total === undefined ? maxPages : Math.max(1, Math.ceil(total / pageSize));
    const matches = new Map<string, (typeof first.sendings)[number]>();
    for (let page = 1; page <= pages; page++) {
      const result = page === 1 ? first : await this.sendingsPage(page, pageSize);
      for (const item of result.sendings) {
        if (isCancelled(item) || !matchesOrder(item, orderId)) continue;
        const identity = item._id || String(item['Código mipaquete']);
        matches.set(identity, item);
      }
      if (matches.size > 1) return { kind: 'multiple' };
      if (total === undefined && result.sendings.length < pageSize) return lookupResult(matches.values().next().value);
    }
    if (total === undefined && pages === maxPages && first.sendings.length === pageSize) return { kind: 'inconclusive' };
    return lookupResult(matches.values().next().value);
  }

  private async sendingsPage(page: number, pageSize: number) {
    const response = await this.client.listSendings(page, { pageSize });
    const parsed = MiPaqueteSendingsSchema.safeParse(response);
    if (!parsed.success) throw new Error('Invalid MiPaquete reconciliation response');
    return parsed.data;
  }
}

function matchesOrder(item: { 'Producto o Referencia'?: string | number; 'Observaciones del envío'?: string }, orderId: string): boolean {
  return String(item['Producto o Referencia'] ?? '').trim() === orderId ||
    String(item['Observaciones del envío'] ?? '').includes(`Pedido ${orderId}`);
}

function isCancelled(item: { 'Estado actual del envío'?: string; tracking?: Array<{ updateState: string }> }): boolean {
  const status = item['Estado actual del envío'] || item.tracking?.at(-1)?.updateState || '';
  const normalized = status.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return normalized.includes('cancel') || normalized.includes('anulad');
}

function lookupResult(item: { _id?: string; 'Código mipaquete': string | number; 'Número de Guía'?: string | number;
  'Número de Recolección'?: string | number; 'Transportadora'?: string; 'Estado actual del envío'?: string;
  pdfGuide?: string[] } | undefined): CarrierShipmentLookup {
  if (!item) return { kind: 'not_found' };
  return { kind: 'found', providerShipmentId: item._id || null, mipaqueteCode: String(item['Código mipaquete']),
    guideNumber: nullableProviderValue(item['Número de Guía']),
    guideUrls: item.pdfGuide || [], pickupCode: nullableProviderValue(item['Número de Recolección']),
    carrierName: item['Transportadora'] || null, status: item['Estado actual del envío'] || 'Envío creado' };
}

function nullableProviderValue(value: string | number | undefined): string | null {
  if (value === undefined) return null;
  const normalized = String(value).trim();
  return !normalized || /^(no disponible|n\/?a|null|undefined)$/i.test(normalized) ? null : normalized;
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
