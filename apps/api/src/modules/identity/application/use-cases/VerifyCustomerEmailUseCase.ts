import { ICustomerAuthRepository } from '../../domain/repositories/ICustomerAuthRepository.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { Result } from '../../../../shared-kernel/Result.js';

export class VerifyCustomerEmailUseCase {
  public constructor(private readonly auth: ICustomerAuthRepository) {}

  public async execute(token: string): Promise<Result<void, Error>> {
    const tokenHash = await SessionTokenGenerator.hashToken(token);
    const verified = await this.auth.verifyEmail(tokenHash, new Date().toISOString());
    return verified
      ? Result.ok(undefined)
      : Result.fail(new Error('EMAIL_VERIFICATION_INVALID_OR_EXPIRED'));
  }
}
