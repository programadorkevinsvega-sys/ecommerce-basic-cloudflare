import { DivipolaLocation } from '../entities/DivipolaLocation.js';

export interface IDivipolaRepository {
  listAll(): Promise<DivipolaLocation[]>;
  search(query: string, limit?: number): Promise<DivipolaLocation[]>;
  findByDaneCode(daneCode: string): Promise<DivipolaLocation | null>;
}
