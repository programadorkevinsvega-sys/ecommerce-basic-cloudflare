import { ElectronicNumberingRange, IElectronicInvoicingPort } from '../../domain/ports/IElectronicInvoicingPort.js';

export class ListElectronicNumberingRangesUseCase {
  constructor(private readonly electronicInvoicing: IElectronicInvoicingPort) {}

  public execute(): Promise<ElectronicNumberingRange[]> {
    return this.electronicInvoicing.listNumberingRanges();
  }
}
