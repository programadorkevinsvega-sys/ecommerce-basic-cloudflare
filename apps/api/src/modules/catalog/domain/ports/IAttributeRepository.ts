import { Attribute } from '../entities/Attribute.js';

export interface IAttributeRepository {
  findById(id: string): Promise<Attribute | null>;
  findByCode(code: string): Promise<Attribute | null>;
  save(attribute: Attribute): Promise<void>;
  delete(id: string): Promise<void>;
  list(): Promise<Attribute[]>;
}
