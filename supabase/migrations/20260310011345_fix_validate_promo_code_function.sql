/*
  # Fix validate_promo_code function

  1. Changes
    - Fix ambiguous column reference in validate_promo_code function
    - Properly qualify all column references with table aliases
    - Ensure function works correctly with promo_code_usage table
*/

-- Drop and recreate the validate_promo_code function with proper column qualification
DROP FUNCTION IF EXISTS validate_promo_code(text, uuid);

CREATE OR REPLACE FUNCTION validate_promo_code(
  p_code text,
  p_user_id uuid
)
RETURNS TABLE (
  valid boolean,
  promo_code_id uuid,
  discount_percentage integer,
  message text
) AS $$
DECLARE
  v_promo promo_codes%ROWTYPE;
  v_user_usage_count integer;
BEGIN
  -- Find the promo code
  SELECT * INTO v_promo
  FROM promo_codes pc
  WHERE pc.code = p_code;

  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'Invalid promo code'::text;
    RETURN;
  END IF;

  -- Check if code is active
  IF NOT v_promo.is_active THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'This promo code is no longer active'::text;
    RETURN;
  END IF;

  -- Check validity dates
  IF v_promo.valid_from > now() THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'This promo code is not yet valid'::text;
    RETURN;
  END IF;

  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'This promo code has expired'::text;
    RETURN;
  END IF;

  -- Check usage limit
  IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'This promo code has reached its usage limit'::text;
    RETURN;
  END IF;

  -- Check if user has already used this code
  SELECT COUNT(*) INTO v_user_usage_count
  FROM promo_code_usage pcu
  WHERE pcu.promo_code_id = v_promo.id AND pcu.user_id = p_user_id;

  IF v_user_usage_count > 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'You have already used this promo code'::text;
    RETURN;
  END IF;

  -- Code is valid
  RETURN QUERY SELECT true, v_promo.id, v_promo.discount_percentage, 'Promo code applied successfully'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
