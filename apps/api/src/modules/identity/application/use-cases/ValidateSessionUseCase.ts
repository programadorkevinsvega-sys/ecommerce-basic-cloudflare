import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository.js';
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository.js';
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { ActorType } from '../../domain/entities/Session.js';
import { Result } from '../../../../shared-kernel/Result.js';

export interface AuthenticatedActor {
  actorId: string;
  actorType: ActorType;
  email?: string;
  permissions: string[];
  mfaEnabled?: boolean;
  emailVerified?: boolean;
}

export class ValidateSessionUseCase {
  private readonly sessionRepo: ISessionRepository;
  private readonly adminRepo: IAdminUserRepository;
  private readonly roleRepo: IRoleRepository;
  private readonly customerRepo: ICustomerRepository;

  public constructor(
    sessionRepo: ISessionRepository,
    adminRepo: IAdminUserRepository,
    roleRepo: IRoleRepository,
    customerRepo: ICustomerRepository,
  ) {
    this.sessionRepo = sessionRepo;
    this.adminRepo = adminRepo;
    this.roleRepo = roleRepo;
    this.customerRepo = customerRepo;
  }

  public async execute(rawToken: string): Promise<Result<AuthenticatedActor, Error>> {
    const tokenHash = await SessionTokenGenerator.hashToken(rawToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);

    if (!session || session.isExpired()) {
      return Result.fail(new Error('Sesión inválida o expirada'));
    }

    if (session.shouldRefreshActivity()) {
      session.touch();
      await this.sessionRepo.save(session);
    }

    let permissions: string[] = [];
    let mfaEnabled: boolean | undefined;
    let emailVerified: boolean | undefined;
    let email: string | undefined;

    if (session.actorType === 'admin') {
      const admin = await this.adminRepo.findById(session.actorId);
      if (!admin || !admin.isActive) {
        return Result.fail(new Error('Usuario administrador inactivo'));
      }
      email = admin.email;
      mfaEnabled = admin.mfaEnabled;
      const role = await this.roleRepo.findById(admin.roleId);
      if (role) {
        permissions = role.permissions;
      }
    } else {
      const customer = await this.customerRepo.findById(session.actorId);
      if (!customer || !customer.isActive) {
        return Result.fail(new Error('Usuario cliente inactivo'));
      }
      emailVerified = customer.emailVerified;
    }

    return Result.ok({
      actorId: session.actorId,
      actorType: session.actorType,
      email,
      permissions,
      mfaEnabled,
      emailVerified,
    });
  }
}
