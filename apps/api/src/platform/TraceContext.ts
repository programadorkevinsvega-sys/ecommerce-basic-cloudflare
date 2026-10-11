export class TraceContext {
  public readonly traceId: string;
  public readonly requestId: string;

  public constructor(traceId: string, requestId?: string) {
    this.traceId = traceId;
    this.requestId = requestId || crypto.randomUUID();
  }

  public static fromHeaders(headers: Headers): TraceContext {
    const traceParent = headers.get('traceparent');
    let traceId = '';

    if (traceParent) {
      const parts = traceParent.split('-');
      if (parts.length >= 2 && parts[1]) {
        traceId = parts[1];
      }
    }

    if (!traceId) {
      traceId = headers.get('x-trace-id') || crypto.randomUUID();
    }

    const requestId = headers.get('cf-ray') || headers.get('x-request-id') || crypto.randomUUID();
    return new TraceContext(traceId, requestId);
  }

  public toTraceparent(): string {
    const version = '00';
    const parentId = crypto.randomUUID().replace(/-/g, '').substring(0, 16);
    const flags = '01';
    const cleanTraceId = this.traceId.replace(/-/g, '').padEnd(32, '0').substring(0, 32);
    return `${version}-${cleanTraceId}-${parentId}-${flags}`;
  }
}
