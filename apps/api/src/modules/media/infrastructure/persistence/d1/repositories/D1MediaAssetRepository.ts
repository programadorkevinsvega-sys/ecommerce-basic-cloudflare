import { MediaAsset } from '../../../../domain/entities/MediaAsset.js';
import { IMediaAssetRepository } from '../../../../domain/ports/IMediaAssetRepository.js';

interface MediaAssetRow {
  id: string;
  storage_key: string;
  original_file_name: string;
  mime_type: string;
  file_size_bytes: number;
  width?: number;
  height?: number;
  alt_text: string;
  folder_id?: string;
  is_private: number;
  uploaded_by_admin_id: string;
  created_at: string;
  updated_at: string;
}

export class D1MediaAssetRepository implements IMediaAssetRepository {
  private readonly db: D1Database;

  public constructor(db: D1Database) {
    this.db = db;
  }

  public async findById(id: string): Promise<MediaAsset | null> {
    const row = await this.db
      .prepare('SELECT * FROM media_assets WHERE id = ?')
      .bind(id)
      .first<MediaAssetRow>();

    return row ? this.toDomain(row) : null;
  }

  public async findByStorageKey(key: string): Promise<MediaAsset | null> {
    const row = await this.db
      .prepare('SELECT * FROM media_assets WHERE storage_key = ?')
      .bind(key)
      .first<MediaAssetRow>();

    return row ? this.toDomain(row) : null;
  }

  public async isStorageKeyReferenced(key: string): Promise<boolean> {
    const row = await this.db.prepare('SELECT 1 AS found FROM media_assets WHERE storage_key = ? LIMIT 1').bind(key).first();
    return Boolean(row);
  }

  public async save(asset: MediaAsset): Promise<void> {
    const p = asset.toPrimitives();
    await this.db
      .prepare(
        `INSERT INTO media_assets (
          id, storage_key, original_file_name, mime_type, file_size_bytes,
          width, height, alt_text, folder_id, is_private, uploaded_by_admin_id,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          alt_text = excluded.alt_text,
          folder_id = excluded.folder_id,
          updated_at = excluded.updated_at`
      )
      .bind(
        p.id,
        p.storageKey,
        p.originalFileName,
        p.mimeType,
        p.fileSizeBytes,
        p.width ?? null,
        p.height ?? null,
        p.altText,
        p.folderId ?? null,
        p.isPrivate ? 1 : 0,
        p.uploadedByAdminId,
        p.createdAt,
        p.updatedAt
      )
      .run();
  }

  public async delete(id: string): Promise<void> {
    await this.db.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();
  }

  public async list(limit: number, offset: number, folderId?: string): Promise<MediaAsset[]> {
    let query = 'SELECT * FROM media_assets WHERE is_private = 0';
    const params: unknown[] = [];

    if (folderId) {
      query += ' AND folder_id = ?';
      params.push(folderId);
    }

    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const { results } = await this.db.prepare(query).bind(...params).all<MediaAssetRow>();
    return (results || []).map((r) => this.toDomain(r));
  }

  private toDomain(row: MediaAssetRow): MediaAsset {
    return new MediaAsset({
      id: row.id,
      storageKey: row.storage_key,
      originalFileName: row.original_file_name,
      mimeType: row.mime_type,
      fileSizeBytes: row.file_size_bytes,
      width: row.width ?? undefined,
      height: row.height ?? undefined,
      altText: row.alt_text,
      folderId: row.folder_id ?? undefined,
      isPrivate: row.is_private === 1,
      uploadedByAdminId: row.uploaded_by_admin_id,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }
}
