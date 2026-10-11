import { ISessionRepository } from '../../domain/repositories/ISessionRepository.js';
import { IRoleRepository } from '../../domain/repositories/IRoleRepository.js';
import { IAdminUserRepository } from '../../domain/repositories/IAdminUserRepository.js';
import { SessionTokenGenerator } from '../../domain/services/SessionTokenGenerator.js';
import { ActorType } from '../../domain/entities/Session.js';
import { Result } from '../../../../shared-kernel/Result.js';

export interface AuthenticatedActor {
  actorId: string;
  actorType: ActorType;
  permissions: string[];
}

export class ValidateSessionUseCase {
  private readonly sessionRepo: ISessionRepository;
  private readonly adminRepo: IAdminUserRepository;
  private readonly roleRepo: IRoleRepository;

  public constructor(
    sessionRepo: ISessionRepository,
    adminRepo: IAdminUserRepository,
    roleRepo: IRoleRepository
  ) {
    this.sessionRepo = sessionRepo;
    this.adminRepo = adminRepo;
    this.roleRepo = roleRepo;
  }

  public async execute(rawToken: string): Promise<Result<AuthenticatedActor, Error>> {
    const tokenHash = await SessionTokenGenerator.hashToken(rawToken);
    const session = await this.sessionRepo.findByTokenHash(tokenHash);

    if (!session || session.isExpired()) {
      return Result.fail(new Error('Sesión inválida o expirada'));
    }

    session.touch();
    await this.sessionRepo.save(session);

    let permissions: string[] = [];

    if (session.actorType === 'admin') {
      const admin = await this.adminRepo.findById(session.actorId);
      if (!admin || !admin.isActive) {
        return Result.fail(new Error('Usuario administrador inactivo'));
      }
      const role = await this.roleRepo.findById(admin.roleId);
      if (role) {
        permissions = role.permissions;
      }
    }

    return Result.ok({
      actorId: session.actorId,
      actorType: session.actorType,
      permissions,
    });
  }
}
