import { DivipolaLocation } from '../entities/DivipolaLocation.js';

export interface IDivipolaRepository {
  listPage(query: { limit: number; offset: number; search?: string }): Promise<DivipolaLocation[]>;
  count(search?: string): Promise<number>;
  search(query: string, limit?: number): Promise<DivipolaLocation[]>;
  findByDaneCode(daneCode: string): Promise<DivipolaLocation | null>;
  upsertLocations?(locations: Array<{ daneCode: string; department: string; municipality: string }>): Promise<void>;
}
