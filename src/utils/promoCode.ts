import { supabase } from '../lib/supabase';

export interface PromoCodeValidation {
  valid: boolean;
  promoCodeId: string | null;
  discountPercentage: number;
  message: string;
}

export async function validatePromoCode(
  code: string,
  userId: string
): Promise<PromoCodeValidation> {
  try {
    const { data, error } = await supabase.rpc('validate_promo_code', {
      p_code: code.toUpperCase().trim(),
      p_user_id: userId,
    });

    if (error) {
      console.error('Error validating promo code:', error);
      return {
        valid: false,
        promoCodeId: null,
        discountPercentage: 0,
        message: 'Failed to validate promo code',
      };
    }

    if (data && data.length > 0) {
      const result = data[0];
      return {
        valid: result.valid,
        promoCodeId: result.promo_code_id,
        discountPercentage: result.discount_percentage,
        message: result.message,
      };
    }

    return {
      valid: false,
      promoCodeId: null,
      discountPercentage: 0,
      message: 'Invalid promo code',
    };
  } catch (err) {
    console.error('Error validating promo code:', err);
    return {
      valid: false,
      promoCodeId: null,
      discountPercentage: 0,
      message: 'Failed to validate promo code',
    };
  }
}

export function calculateDiscount(subtotal: number, discountPercentage: number): number {
  return (subtotal * discountPercentage) / 100;
}

export function calculateTotal(subtotal: number, discountAmount: number): number {
  return Math.max(0, subtotal - discountAmount);
}
