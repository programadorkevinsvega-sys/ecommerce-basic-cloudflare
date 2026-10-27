export const PRODUCT_LANDING_SECTIONS = [
  'benefits', 'specifications', 'guides', 'reviews', 'faq', 'related',
] as const;

export type ProductLandingSection = typeof PRODUCT_LANDING_SECTIONS[number];
export type ProductLandingTemplate = 'standard' | 'conversion' | 'launch';

export interface ProductLandingBenefit {
  title: string;
  description: string;
}

export interface ProductLandingFaq {
  question: string;
  answer: string;
}

export interface ProductLandingConfigProps {
  productId: string;
  enabled: boolean;
  templateKey: ProductLandingTemplate;
  eyebrow: string;
  headline: string;
  subtitle: string;
  ctaLabel: string;
  seoTitle?: string;
  seoDescription?: string;
  benefits: ProductLandingBenefit[];
  faqs: ProductLandingFaq[];
  sections: ProductLandingSection[];
  createdAt: string;
  updatedAt: string;
}

export class ProductLandingConfig {
  private readonly props: ProductLandingConfigProps;

  public constructor(props: ProductLandingConfigProps) {
    validateProps(props);
    this.props = {
      ...props,
      eyebrow: props.eyebrow.trim(),
      headline: props.headline.trim(),
      subtitle: props.subtitle.trim(),
      ctaLabel: props.ctaLabel.trim(),
      seoTitle: (props.seoTitle ?? '').trim(),
      seoDescription: (props.seoDescription ?? '').trim(),
      benefits: props.benefits.map((item) => ({ title: item.title.trim(), description: item.description.trim() })),
      faqs: props.faqs.map((item) => ({ question: item.question.trim(), answer: item.answer.trim() })),
      sections: [...new Set(props.sections)],
    };
  }

  public static createDefault(productId: string, now = new Date().toISOString()): ProductLandingConfig {
    return new ProductLandingConfig({
      productId, enabled: false, templateKey: 'standard', eyebrow: '', headline: '',
      subtitle: '', ctaLabel: 'Comprar ahora', benefits: [], faqs: [],
      sections: ['benefits', 'specifications', 'guides', 'reviews', 'faq', 'related'],
      createdAt: now, updatedAt: now,
    });
  }

  public toPrimitives(): ProductLandingConfigProps {
    return {
      ...this.props,
      benefits: this.props.benefits.map((item) => ({ ...item })),
      faqs: this.props.faqs.map((item) => ({ ...item })),
      sections: [...this.props.sections],
    };
  }
}

function validateProps(props: ProductLandingConfigProps): void {
  if (!props.productId.trim() || props.productId.length > 100) throw new Error('Identificador de producto inválido');
  if (!['standard', 'conversion', 'launch'].includes(props.templateKey)) throw new Error('Plantilla de landing inválida');
  validateText(props.eyebrow, 80, 'La etiqueta superior');
  validateText(props.headline, 160, 'El titular');
  validateText(props.subtitle, 400, 'El subtítulo');
  validateText(props.ctaLabel, 40, 'El texto del botón');
  validateText(props.seoTitle ?? '', 100, 'El título SEO');
  validateText(props.seoDescription ?? '', 300, 'La descripción SEO');
  if (!Array.isArray(props.benefits) || props.benefits.length > 6) throw new Error('La landing admite hasta 6 beneficios');
  if (!Array.isArray(props.faqs) || props.faqs.length > 10) throw new Error('La landing admite hasta 10 preguntas frecuentes');
  if (!Array.isArray(props.sections) || props.sections.some((item) => !PRODUCT_LANDING_SECTIONS.includes(item))) {
    throw new Error('La landing contiene una sección no permitida');
  }
  props.benefits.forEach((item) => {
    validateText(item.title, 80, 'El título del beneficio');
    validateText(item.description, 240, 'La descripción del beneficio');
  });
  props.faqs.forEach((item) => {
    validateText(item.question, 180, 'La pregunta frecuente');
    validateText(item.answer, 800, 'La respuesta frecuente');
  });
}

function validateText(value: string, max: number, label: string): void {
  if (typeof value !== 'string' || value.length > max) throw new Error(label + ' supera la longitud permitida');
}
