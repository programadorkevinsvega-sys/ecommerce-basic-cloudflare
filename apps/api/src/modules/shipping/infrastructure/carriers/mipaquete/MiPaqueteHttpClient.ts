import { MiPaqueteApiConfig } from './MiPaqueteApiConfig.js';

export class MiPaqueteHttpClient {
  private readonly config: MiPaqueteApiConfig;
  private readonly fetcher: typeof fetch;

  public constructor(config: MiPaqueteApiConfig, fetcher: typeof fetch = fetch) {
    this.config = config;
    this.fetcher = fetcher;
  }

  public quote(payload: Record<string, unknown>): Promise<unknown> {
    return this.request('/quoteShipping', 'POST', payload);
  }

  public createSending(payload: Record<string, unknown>): Promise<unknown> {
    return this.request('/createSending', 'POST', payload);
  }

  public listSendings(page: number, payload: Record<string, unknown>): Promise<unknown> {
    return this.request(`/getSendings/${page}`, 'POST', payload);
  }

  private async request(path: string, method: 'POST', payload: Record<string, unknown>): Promise<unknown> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8_000);
    try {
      const response = await this.fetcher.call(globalThis, new URL(path, this.config.baseUrl), {
        method,
        redirect: 'error',
        signal: controller.signal,
        headers: {
          'content-type': 'application/json',
          apikey: this.config.apiKey,
          'session-tracker': crypto.randomUUID(),
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error(`MiPaquete request failed (${response.status})`);
      return await response.json() as unknown;
    } finally {
      clearTimeout(timeout);
    }
  }
}
