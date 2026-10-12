export interface DivipolaLocationProps {
  daneCode: string;
  department: string;
  municipality: string;
  type?: string;
}

export class DivipolaLocation {
  public readonly daneCode: string;
  public readonly department: string;
  public readonly municipality: string;
  public readonly type: string;

  constructor(props: DivipolaLocationProps) {
    if (!props.daneCode || props.daneCode.trim() === '') {
      throw new Error('DANE code is required');
    }
    if (!props.department || props.department.trim() === '') {
      throw new Error('Department is required');
    }
    if (!props.municipality || props.municipality.trim() === '') {
      throw new Error('Municipality is required');
    }

    this.daneCode = props.daneCode.trim();
    this.department = props.department.trim();
    this.municipality = props.municipality.trim();
    this.type = props.type || 'municipio';
  }

  public get fullName(): string {
    return `${this.municipality}, ${this.department}`;
  }

  public toJSON() {
    return {
      daneCode: this.daneCode,
      department: this.department,
      municipality: this.municipality,
      type: this.type,
      fullName: this.fullName,
    };
  }
}
