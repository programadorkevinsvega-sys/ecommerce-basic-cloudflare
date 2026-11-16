import { ICustomerAuthRepository } from '../../domain/repositories/ICustomerAuthRepository.js';
import { PasswordHasher } from '../../domain/services/PasswordHasher.js';
import { PasswordPolicy } from '../../domain/services/PasswordPolicy.js';
import { ICustomerPasswordBreachChecker } from '../ports/ICustomerPasswordBreachChecker.js';
import { PasswordBreachCheckUnavailableError } from '../errors/PasswordBreachCheckUnavailableError.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { Result } from '../../../../shared-kernel/Result.js';

export class ResetCustomerPasswordUseCase {
  public constructor(
    private readonly auth: ICustomerAuthRepository,
    private readonly breachChecker: ICustomerPasswordBreachChecker,
  ) {}

  public async execute(token: string, password: string): Promise<Result<void, Error>> {
    if (!PasswordPolicy.isAcceptable(password)) return Result.fail(new Error('PASSWORD_POLICY_UNMET'));
    try {
      if (await this.breachChecker.isCompromised(password)) {
        return Result.fail(new Error('PASSWORD_COMPROMISED'));
      }
    } catch (error) {
      if (error instanceof PasswordBreachCheckUnavailableError) return Result.fail(error);
      throw error;
    }
    const passwordHash = await PasswordHasher.hash(password);
    const reset = await this.auth.resetPassword(
      await SessionTokenGenerator.hashToken(token), passwordHash, new Date().toISOString(),
    );
    return reset ? Result.ok(undefined) : Result.fail(new Error('PASSWORD_RESET_INVALID_OR_EXPIRED'));
  }
}
