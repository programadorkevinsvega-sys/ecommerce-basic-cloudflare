export interface Env {
  AUTH_LIMITER: RateLimit;
  CHECKOUT_LIMITER: RateLimit;
  API_WRITE_LIMITER: RateLimit;
  DB: D1Database;
  MEDIA_BUCKET: R2Bucket;
  IMAGES: ImagesBinding;
  CACHE: KVNamespace;
  EVENTS_QUEUE: Queue;
  ANALYTICS?: AnalyticsEngineDataset;
  ENVIRONMENT?: string;
  ADMIN_EMAIL?: string;
  ADMIN_PASSWORD?: string;
  WOMPI_PUBLIC_KEY?: string;
  WOMPI_PRIVATE_KEY?: string;
  WOMPI_ENVIRONMENT?: 'sandbox' | 'production';
  WOMPI_INTEGRITY_SECRET?: string;
  WOMPI_EVENTS_SECRET?: string;
  RESEND_API_KEY?: string;
  RESEND_FROM_EMAIL?: string;
  RESEND_WEBHOOK_SECRET?: string;
}
