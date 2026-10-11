export interface MediaAssetProps {
  id: string;
  storageKey: string;
  originalFileName: string;
  mimeType: string;
  fileSizeBytes: number;
  width?: number;
  height?: number;
  altText: string;
  folderId?: string;
  isPrivate: boolean;
  uploadedByAdminId: string;
  createdAt: string;
  updatedAt: string;
}

export class MediaAsset {
  private readonly props: MediaAssetProps;

  public constructor(props: MediaAssetProps) {
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get storageKey(): string { return this.props.storageKey; }
  public get originalFileName(): string { return this.props.originalFileName; }
  public get mimeType(): string { return this.props.mimeType; }
  public get fileSizeBytes(): number { return this.props.fileSizeBytes; }
  public get width(): number | undefined { return this.props.width; }
  public get height(): number | undefined { return this.props.height; }
  public get altText(): string { return this.props.altText; }
  public get folderId(): string | undefined { return this.props.folderId; }
  public get isPrivate(): boolean { return this.props.isPrivate; }
  public get uploadedByAdminId(): string { return this.props.uploadedByAdminId; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public updateAltText(altText: string): void {
    if (!altText || altText.trim().length === 0) {
      throw new Error('El texto alternativo (altText) es obligatorio conforme a SEC-R2-04');
    }
    this.props.altText = altText.trim();
    this.props.updatedAt = new Date().toISOString();
  }

  public toPrimitives(): MediaAssetProps {
    return { ...this.props };
  }
}
