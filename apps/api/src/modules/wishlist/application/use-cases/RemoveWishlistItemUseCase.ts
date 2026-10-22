import { IWishlistRepository } from '../../domain/ports/IWishlistRepository.js';

export interface RemoveWishlistItemCommand { customerId: string; productId: string; traceId: string; }

export class RemoveWishlistItemUseCase {
  public constructor(private readonly repository: IWishlistRepository) {}
  public async execute(command: RemoveWishlistItemCommand): Promise<boolean> {
    if (!command.customerId.trim() || !command.productId.trim()) throw new Error('El cliente y el producto son obligatorios');
    return this.repository.remove(command.customerId, command.productId, command.traceId);
  }
}