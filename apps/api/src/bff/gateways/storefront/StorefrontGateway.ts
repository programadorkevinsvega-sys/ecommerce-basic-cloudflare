export interface StorefrontHomeData {
  banners: Array<{
    id: string;
    title: string;
    description?: string;
    bannerType?: 'informative' | 'promotional';
    buttonText?: string;
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

export interface BannerItemDto {
  id: string;
  title: string;
  description?: string;
  bannerType?: 'informative' | 'promotional';
  buttonText?: string;
  placement: string;
  imageUrl: string;
  linkUrl: string;
  altText: string;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  sortOrder: number;
}

export interface UpdateBannerGatewayRequest {
  id: string;
  title?: string;
  description?: string;
  bannerType?: 'informative' | 'promotional';
  buttonText?: string;
  placement?: string;
  imageUrl?: string;
  linkUrl?: string;
  altText?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  sortOrder?: number;
}

export interface AnnouncementItemDto {
  id: string;
  message: string;
  placement: string;
  linkUrl?: string;
  isActive: boolean;
}

export interface UpdateAnnouncementGatewayRequest {
  id: string;
  message?: string;
  placement?: string;
  linkUrl?: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
}

export interface CreateBannerGatewayRequest {
  title: string;
  description?: string;
  bannerType?: 'informative' | 'promotional';
  buttonText?: string;
  placement: string;
  imageUrl: string;
  linkUrl?: string;
  altText: string;
  isActive?: boolean;
  startsAt?: string;
  endsAt?: string;
  sortOrder?: number;
}

export interface StorefrontGateway {
  getHomeContent(): Promise<StorefrontHomeData>;
  createBanner(request: CreateBannerGatewayRequest): Promise<{ id: string; title: string }>;
  updateBanner(request: UpdateBannerGatewayRequest): Promise<BannerItemDto>;
  listBanners(): Promise<BannerItemDto[]>;
  listAdminBanners(limit: number, offset: number, filters?: { type?: 'promotional' | 'informative'; query?: string; placement?: string; isActive?: boolean }): Promise<{ items: BannerItemDto[]; total: number }>;
  getBannerById(id: string): Promise<BannerItemDto | null>;
  getPublicBanners(placement: string): Promise<BannerItemDto[]>;
  getPublicAnnouncements(placement: string): Promise<AnnouncementItemDto[]>;
  deleteBanner(id: string): Promise<void>;
  createAnnouncement(request: { message: string; placement: string; linkUrl?: string }): Promise<{ id: string; message: string }>;
  updateAnnouncement(request: UpdateAnnouncementGatewayRequest): Promise<AnnouncementItemDto>;
  listAnnouncements(): Promise<AnnouncementItemDto[]>;
  listAdminAnnouncements(limit: number, offset: number): Promise<{ items: AnnouncementItemDto[]; total: number }>;
  getAnnouncementById(id: string): Promise<AnnouncementItemDto | null>;
  deleteAnnouncement(id: string): Promise<void>;
}
