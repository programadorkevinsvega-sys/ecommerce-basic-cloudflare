import { IWishlistRepository, AddWishlistItemResult } from '../../domain/ports/IWishlistRepository.js';

export interface AddWishlistItemCommand { customerId: string; productId: string; traceId: string; }

export class AddWishlistItemUseCase {
  public constructor(private readonly repository: IWishlistRepository) {}
  public async execute(command: AddWishlistItemCommand): Promise<AddWishlistItemResult> {
    if (!command.customerId.trim() || !command.productId.trim()) throw new Error('El cliente y el producto son obligatorios');
    return this.repository.add(command.customerId, command.productId, command.traceId);
  }
}