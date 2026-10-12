import { CreditNote } from '../../domain/entities/CreditNote.js';
import { IInvoiceRepository } from '../../domain/ports/IInvoiceRepository.js';

export interface CreateCreditNoteCommand {
  invoiceId: string;
  reason: string;
  amountInCents: number;
  issuedBy: string;
}

export class CreateCreditNoteUseCase {
  constructor(private readonly repo: IInvoiceRepository) {}

  public async execute(cmd: CreateCreditNoteCommand): Promise<CreditNote> {
    const invoice = await this.repo.findById(cmd.invoiceId);
    if (!invoice) {
      throw new Error(`Factura con id '${cmd.invoiceId}' no encontrada`);
    }

    if (cmd.amountInCents > invoice.totalCents) {
      throw new Error(`El monto de la nota crédito no puede superar el total de la factura`);
    }

    const id = `cn_${crypto.randomUUID()}`;
    const creditNoteNumber = `NC-${Date.now().toString().slice(-6)}`;
    const now = new Date().toISOString();

    const creditNote = new CreditNote({
      id,
      creditNoteNumber,
      invoiceId: invoice.id,
      reason: cmd.reason,
      amountInCents: cmd.amountInCents,
      issuedBy: cmd.issuedBy,
      createdAt: now,
    });

    await this.repo.saveCreditNote(creditNote);

    // Actualizar estado de la factura si cubre el total
    if (cmd.amountInCents === invoice.totalCents) {
      invoice.status = 'credit_note_applied';
      invoice.updatedAt = now;
      await this.repo.save(invoice);
    }

    return creditNote;
  }
}
