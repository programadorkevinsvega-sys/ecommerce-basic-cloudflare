import { IPaymentRepository } from '../../domain/ports/IPaymentRepository.js';

export interface RecordSettlementCorrectionCommand {
  orderId: string;
  actualFeeCents: number;
  reportReference: string;
  reason: string;
  recordedBy: string;
}

export class RecordSettlementCorrectionUseCase {
  public constructor(private readonly repository: IPaymentRepository) {}

  public async execute(command: RecordSettlementCorrectionCommand): Promise<void> {
    const reportReference = command.reportReference.trim();
    const reason = command.reason.trim();
    if (!command.orderId || !Number.isSafeInteger(command.actualFeeCents) || command.actualFeeCents < 0 ||
      reportReference.length < 3 || reportReference.length > 120 || reason.length < 5 || reason.length > 500 || !command.recordedBy) {
      throw new Error('Datos de corrección inválidos');
    }
    await this.repository.recordSettlementCorrection({
      ...command, reportReference, reason, recordedAt: new Date().toISOString(),
    });
  }
}
