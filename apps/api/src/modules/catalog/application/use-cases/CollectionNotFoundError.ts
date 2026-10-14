export class CollectionNotFoundError extends Error {
  public constructor() {
    super('Colección no encontrada');
    this.name = 'CollectionNotFoundError';
  }
}
