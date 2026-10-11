export interface StorefrontHomeData {
  banners: Array<{
    id: string;
    title: string;
    imageUrl: string;
    linkUrl: string;
    altText: string;
    sortOrder: number;
  }>;
  announcements: Array<{
    id: string;
    message: string;
    linkUrl?: string;
  }>;
}

export interface CreateBannerGatewayRequest {
  title: string;
  placement: 'home' | 'category' | 'product' | 'checkout';
  imageUrl: string;
  linkUrl: string;
  altText: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  sortOrder?: number;
}

export interface StorefrontGateway {
  getHomeContent(): Promise<StorefrontHomeData>;
  createBanner(request: CreateBannerGatewayRequest): Promise<{ id: string; title: string }>;
  createAnnouncement(request: { message: string; placement: 'top_bar' | 'home' | 'products'; linkUrl?: string }): Promise<{ id: string; message: string }>;
}
