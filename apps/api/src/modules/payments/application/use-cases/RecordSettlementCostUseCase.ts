import { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';

export interface RecordSettlementCostCommand {
  orderId: string;
  actualFeeCents: number;
  estimatedFeeCents: number;
  reportReference: string;
  recordedBy: string;
}

export class RecordSettlementCostUseCase {
  constructor(private readonly repository: IPaymentRepository) {}

  public async execute(command: RecordSettlementCostCommand): Promise<void> {
    const reportReference = command.reportReference.trim();
    if (!command.orderId || !Number.isSafeInteger(command.actualFeeCents) || command.actualFeeCents < 0 || !Number.isSafeInteger(command.estimatedFeeCents) || command.estimatedFeeCents < 0 ||
      reportReference.length < 3 || reportReference.length > 120 || !command.recordedBy) {
      throw new Error('Datos de liquidación inválidos');
    }
    await this.repository.recordSettlementCost({ ...command, reportReference, recordedAt: new Date().toISOString() });
  }
}
