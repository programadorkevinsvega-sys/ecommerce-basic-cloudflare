import type { CatalogProductDto, CategoryDto, BrandDto, AttributeDto, SupplierDto, ProductVariantDto, CatalogCollectionDto } from '../../gateways/catalog/CatalogGateway.js';
import type { BannerItemDto, AnnouncementItemDto } from '../../gateways/storefront/StorefrontGateway.js';
import type { StoreSettingsResponse as SettingsDto } from '../../gateways/settings/SettingsGateway.js';
import type { CmsPageDto } from '../../gateways/cms/CmsGateway.js';
import type { PromotionRuleDto, CouponDto } from '../../gateways/promotions/PromotionsGateway.js';
import type { ShippingZoneDto, DivipolaLocationDto } from '../../gateways/shipping/ShippingGateway.js';

export interface MarketingDestinationOption { value: string; label: string; group: string; }

export interface AdminDashboardProps {
  products: CatalogProductDto[];
  categories: CategoryDto[];
  brands: BrandDto[];
  attributes: AttributeDto[];
  suppliers: SupplierDto[];
  variants: ProductVariantDto[];
  collections: CatalogCollectionDto[];
  banners: BannerItemDto[];
  marketingDestinations?: MarketingDestinationOption[];
  announcements: AnnouncementItemDto[];
  cmsPages: CmsPageDto[];
  promotionRules: PromotionRuleDto[];
  coupons: CouponDto[];
  shippingZones: ShippingZoneDto[];
  divipolaLocations: DivipolaLocationDto[];
  settings: SettingsDto;
  adminEmail: string;
}
