export class GuestOrderCreationLimitExceeded extends Error {
  public constructor() {
    super('Order creation limit exceeded');
    this.name = 'GuestOrderCreationLimitExceeded';
  }
}
