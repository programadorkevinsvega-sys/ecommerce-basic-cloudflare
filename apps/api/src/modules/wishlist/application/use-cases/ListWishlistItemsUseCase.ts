import { IWishlistRepository, WishlistPage } from '../../domain/ports/IWishlistRepository.js';

export class ListWishlistItemsUseCase {
  public constructor(private readonly repository: IWishlistRepository) {}
  public async execute(customerId: string, page: number, pageSize: number): Promise<WishlistPage> {
    if (!customerId.trim()) throw new Error('El cliente es obligatorio');
    if (!Number.isSafeInteger(page) || page < 1 || page > 1000000) throw new Error('Página inválida');
    if (!Number.isSafeInteger(pageSize) || pageSize < 1 || pageSize > 50) throw new Error('Tamaño de página inválido');
    return this.repository.listByCustomer(customerId, page, pageSize);
  }
}