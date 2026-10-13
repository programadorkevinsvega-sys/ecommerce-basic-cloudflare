export interface InvoiceDocument {
  stream: ReadableStream;
  sizeBytes: number;
  etag: string;
}

export interface IInvoiceDocumentStoragePort {
  get(key: string): Promise<InvoiceDocument | null>;
}
