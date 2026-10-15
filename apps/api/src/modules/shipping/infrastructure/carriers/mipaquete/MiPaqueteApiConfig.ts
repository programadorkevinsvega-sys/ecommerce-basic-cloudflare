export interface MiPaqueteApiConfig {
  apiKey: string;
  baseUrl: URL;
}

export function readMiPaqueteApiConfig(input: {
  secret?: string;
  apiUrl?: string;
  environment?: string;
}): MiPaqueteApiConfig | null {
  const apiKey = input.secret?.trim();
  if (!apiKey || apiKey.length < 20 || !input.apiUrl) return null;

  try {
    const baseUrl = new URL(input.apiUrl);
    if (baseUrl.protocol !== 'https:' || baseUrl.username || baseUrl.password) return null;
    if (!baseUrl.hostname.toLowerCase().endsWith('.mipaquete.com')) return null;
    if (input.environment === 'production' && baseUrl.hostname.toLowerCase().includes('.dev.')) return null;
    if (baseUrl.search || baseUrl.hash) return null;
    baseUrl.pathname = baseUrl.pathname.replace(/\/$/, '');
    return { apiKey, baseUrl };
  } catch {
    return null;
  }
}
