export interface CreateRedirectGatewayRequest {
  fromPath: string;
  toPath: string;
  statusCode?: number;
}

export interface SeoGateway {
  createRedirect(request: CreateRedirectGatewayRequest): Promise<{ id: string; fromPath: string; toPath: string }>;
  resolveRedirect(fromPath: string): Promise<{ toPath: string; statusCode: number } | null>;
}
