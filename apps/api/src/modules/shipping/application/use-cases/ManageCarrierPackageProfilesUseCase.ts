import { CarrierPackageProfile, CarrierPackageProfileInput } from '../../domain/entities/CarrierPackageProfile.js';
import { ICarrierConfigRepository } from '../../domain/ports/ICarrierConfigRepository.js';

export class ManageCarrierPackageProfilesUseCase {
  private readonly repository: ICarrierConfigRepository;
  public constructor(repository: ICarrierConfigRepository) { this.repository = repository; }

  public list(): Promise<CarrierPackageProfile[]> { return this.repository.listProfiles(); }
  public async get(id: string): Promise<CarrierPackageProfile> {
    const profile = await this.repository.getProfile(id);
    if (!profile) throw new Error('Tipo de empaque no encontrado');
    return profile;
  }

  public async create(input: CarrierPackageProfileInput): Promise<CarrierPackageProfile> {
    const profiles = await this.repository.listProfiles();
    if (profiles.length >= 20) throw new Error('Puedes registrar hasta 20 tipos de empaque.');
    const now = new Date().toISOString();
    const profile = { ...validate(input), id: crypto.randomUUID(), isActive: input.isActive ?? true, createdAt: now, updatedAt: now };
    await this.repository.createProfile(profile);
    return profile;
  }

  public async update(id: string, input: CarrierPackageProfileInput): Promise<CarrierPackageProfile> {
    const current = await this.get(id);
    const updated = await this.repository.updateProfile(id, { ...validate(input), id, isActive: current.isActive }, new Date().toISOString());
    if (!updated) throw new Error('Tipo de empaque no encontrado');
    return updated;
  }

  public async setActive(id: string, active: boolean): Promise<CarrierPackageProfile> {
    const current = await this.get(id);
    if (!active && current.isActive) {
      const config = await this.repository.get();
      if (config.enabled && (await this.repository.listProfiles()).filter((profile) => profile.isActive).length <= 1) {
        throw new Error('Mantén al menos un empaque activo mientras las cotizaciones estén habilitadas.');
      }
    }
    const updated = await this.repository.setProfileActive(id, active, new Date().toISOString());
    if (!updated) throw new Error('Tipo de empaque no encontrado');
    return updated;
  }

  public async delete(id: string): Promise<void> {
    const current = await this.get(id);
    if (current.isActive && (await this.repository.get()).enabled &&
      (await this.repository.listProfiles()).filter((profile) => profile.isActive).length <= 1) {
      throw new Error('Desactiva las cotizaciones o agrega otra caja activa antes de eliminar esta.');
    }
    if (!await this.repository.deleteProfile(id)) throw new Error('Tipo de empaque no encontrado');
  }
}

function validate(input: CarrierPackageProfileInput): CarrierPackageProfileInput {
  const dimensions = [input.innerWidthCm, input.innerLengthCm, input.innerHeightCm,
    input.outerWidthCm, input.outerLengthCm, input.outerHeightCm];
  if (!input.name.trim() || input.name.trim().length > 100 || dimensions.some((value) => !Number.isSafeInteger(value) || value < 1 || value > 300) ||
      input.innerWidthCm > input.outerWidthCm || input.innerLengthCm > input.outerLengthCm || input.innerHeightCm > input.outerHeightCm ||
      !Number.isSafeInteger(input.tareWeightGrams) || input.tareWeightGrams < 0 ||
      !Number.isSafeInteger(input.maxWeightGrams) || input.maxWeightGrams <= input.tareWeightGrams || input.maxWeightGrams > 1_000_000) {
    throw new Error('Revisa nombre, dimensiones internas/externas y pesos del empaque.');
  }
  return { ...input, name: input.name.trim() };
}
