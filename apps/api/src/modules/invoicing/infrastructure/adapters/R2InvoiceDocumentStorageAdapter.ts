import { IInvoiceDocumentStoragePort, InvoiceDocument } from '../../domain/ports/IInvoiceDocumentStoragePort.js';

export class R2InvoiceDocumentStorageAdapter implements IInvoiceDocumentStoragePort {
  constructor(private readonly bucket: R2Bucket) {}

  public async get(key: string): Promise<InvoiceDocument | null> {
    const object = await this.bucket.get(key);
    return object ? { stream: object.body, sizeBytes: object.size, etag: object.httpEtag } : null;
  }
}
