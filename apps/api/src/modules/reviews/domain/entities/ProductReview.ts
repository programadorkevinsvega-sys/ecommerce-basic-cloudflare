export type ProductReviewStatus = 'pending' | 'approved' | 'rejected';
export type ProductReviewSource = 'verified' | 'demo' | 'manual';

export interface ProductReview {
  id: string;
  productId: string;
  customerId: string;
  rating: number;
  comment: string;
  status: ProductReviewStatus;
  source: ProductReviewSource;
  createdAt: string;
  updatedAt: string;
}

export function validateReviewInput(rating: number, comment: string): string {
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error('La puntuación debe estar entre 1 y 5.');
  const value = comment.trim();
  if (value.length < 10 || value.length > 2000) throw new Error('El comentario debe tener entre 10 y 2.000 caracteres.');
  return value;
}
