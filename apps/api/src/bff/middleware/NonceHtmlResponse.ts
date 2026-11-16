export async function nonceHtmlResponse(response: Response, nonce: string): Promise<Response> {
  if (!response.headers.get('Content-Type')?.includes('text/html') || response.body === null) return response;

  const html = await response.text();
  const nonceHtml = html.replace(/<script(?=[\s>])/gi, `<script nonce="${nonce}"`);
  const headers = new Headers(response.headers);
  headers.delete('Content-Length');
  headers.set('Cache-Control', 'private, no-store');
  headers.delete('Cache-Tag');
  return new Response(nonceHtml, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
