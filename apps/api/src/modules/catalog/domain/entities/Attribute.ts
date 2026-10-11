export type AttributeType = 'text' | 'select' | 'number';

export interface AttributeProps {
  id: string;
  name: string;
  code: string;
  type: AttributeType;
  options: string[];
  createdAt: string;
  updatedAt: string;
}

export class Attribute {
  private readonly props: AttributeProps;

  public constructor(props: AttributeProps) {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('El nombre del atributo no puede estar vacío');
    }
    if (!props.code || props.code.trim().length === 0) {
      throw new Error('El código del atributo no puede estar vacío');
    }
    this.props = props;
  }

  public get id(): string { return this.props.id; }
  public get name(): string { return this.props.name; }
  public get code(): string { return this.props.code; }
  public get type(): AttributeType { return this.props.type; }
  public get options(): string[] { return [...this.props.options]; }
  public get createdAt(): string { return this.props.createdAt; }
  public get updatedAt(): string { return this.props.updatedAt; }

  public toPrimitives(): AttributeProps {
    return {
      ...this.props,
      options: [...this.props.options],
    };
  }
}
