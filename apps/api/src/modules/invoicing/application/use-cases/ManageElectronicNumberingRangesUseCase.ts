import { ElectronicNumberingRange, IElectronicInvoicingPort, NewNumberingRange, NumberingRangeFilters } from '../../domain/ports/IElectronicInvoicingPort.js';

export class ManageElectronicNumberingRangesUseCase {
  constructor(private readonly provider: IElectronicInvoicingPort) {}

  public list(filters?: NumberingRangeFilters) { return this.provider.listNumberingRanges(filters); }
  public get(id: string): Promise<ElectronicNumberingRange> { return this.provider.getNumberingRange(id); }
  public associated() { return this.provider.listSoftwareAssociatedRanges(); }
  public create(input: NewNumberingRange) { return this.provider.createNumberingRange(input); }
  public toggle(id: string) { return this.provider.toggleNumberingRange(id); }
  public updateCurrent(id: string, current: number) { return this.provider.updateNumberingRangeCurrent(id, current); }
  public delete(id: string) { return this.provider.deleteNumberingRange(id); }
  public restore(id: string) { return this.provider.restoreNumberingRange(id); }
}
