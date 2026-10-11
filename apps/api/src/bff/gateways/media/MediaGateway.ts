export interface MediaUploadRequest {
  originalFileName: string;
  data: Uint8Array;
  altText: string;
  folderId?: string;
  isPrivate?: boolean;
  uploadedByAdminId: string;
}

export interface MediaUploadResponse {
  id: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  altText: string;
  publicUrl: string;
}

export interface MediaServeResponse {
  stream: ReadableStream;
  mimeType: string;
  sizeBytes: number;
  altText: string;
}

export interface MediaGateway {
  uploadMedia(request: MediaUploadRequest): Promise<MediaUploadResponse>;
  getMedia(assetId: string): Promise<MediaServeResponse>;
  resolveMedia(mediaId: string): Promise<{ id: string; publicUrl: string; altText: string }>;
}
