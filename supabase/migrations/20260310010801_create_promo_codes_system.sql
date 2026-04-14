/*
  # Create Promo Codes System

  1. New Tables
    - `promo_codes`
      - `id` (uuid, primary key)
      - `code` (text, unique) - The promo code string (e.g., "SUMMER2024")
      - `description` (text) - Description/purpose of the promo code
      - `discount_percentage` (integer) - Discount percentage (1-100)
      - `is_active` (boolean) - Whether the code is currently active
      - `usage_limit` (integer, nullable) - Maximum number of times code can be used (null = unlimited)
      - `usage_count` (integer) - Number of times the code has been used
      - `valid_from` (timestamptz) - When the code becomes valid
      - `valid_until` (timestamptz, nullable) - When the code expires (null = no expiration)
      - `created_at` (timestamptz)
      - `created_by` (uuid, foreign key to auth.users)
      - `updated_at` (timestamptz)

    - `promo_code_usage`
      - `id` (uuid, primary key)
      - `promo_code_id` (uuid, foreign key to promo_codes)
      - `order_id` (uuid, foreign key to orders)
      - `user_id` (uuid, foreign key to auth.users)
      - `discount_amount` (decimal)
      - `used_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Admin users can manage promo codes
    - Users can view active promo codes
    - Users can view their own promo code usage
    - Track promo code usage in orders

  3. Updates to Orders Table
    - Add `promo_code_id` column to orders
    - Add `discount_amount` column to orders
    - Add `subtotal` column to orders (total before discount)
*/

-- Create promo_codes table
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  description text NOT NULL,
  discount_percentage integer NOT NULL CHECK (discount_percentage >= 1 AND discount_percentage <= 100),
  is_active boolean DEFAULT true,
  usage_limit integer CHECK (usage_limit > 0),
  usage_count integer DEFAULT 0,
  valid_from timestamptz DEFAULT now(),
  valid_until timestamptz,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT valid_dates CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- Create promo_code_usage table
CREATE TABLE IF NOT EXISTS promo_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id uuid REFERENCES promo_codes(id) ON DELETE CASCADE NOT NULL,
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  discount_amount decimal(10, 2) NOT NULL,
  used_at timestamptz DEFAULT now()
);

-- Add promo code columns to orders table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'promo_code_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN promo_code_id uuid REFERENCES promo_codes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'discount_amount'
  ) THEN
    ALTER TABLE orders ADD COLUMN discount_amount decimal(10, 2) DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'subtotal'
  ) THEN
    ALTER TABLE orders ADD COLUMN subtotal decimal(10, 2);
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active, valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_code ON promo_code_usage(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_code_usage_user ON promo_code_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_promo_code ON orders(promo_code_id);

-- Enable RLS
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_code_usage ENABLE ROW LEVEL SECURITY;

-- Promo Codes Policies

-- Admin users can do everything with promo codes
CREATE POLICY "Admins can view all promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can create promo codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can update promo codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

CREATE POLICY "Admins can delete promo codes"
  ON promo_codes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- All authenticated users can view active promo codes for validation
CREATE POLICY "Users can view active promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND valid_from <= now()
    AND (valid_until IS NULL OR valid_until > now())
  );

-- Promo Code Usage Policies

-- Users can view their own promo code usage
CREATE POLICY "Users can view own promo code usage"
  ON promo_code_usage FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Admins can view all promo code usage
CREATE POLICY "Admins can view all promo code usage"
  ON promo_code_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- System can insert promo code usage records (during checkout)
CREATE POLICY "Users can create promo code usage records"
  ON promo_code_usage FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to validate and apply promo code
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
  FROM promo_codes
  WHERE code = p_code;

  -- Check if code exists
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'Invalid promo code';
    RETURN;
  END IF;

  -- Check if code is active
  IF NOT v_promo.is_active THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'This promo code is no longer active';
    RETURN;
  END IF;

  -- Check validity dates
  IF v_promo.valid_from > now() THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'This promo code is not yet valid';
    RETURN;
  END IF;

  IF v_promo.valid_until IS NOT NULL AND v_promo.valid_until < now() THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'This promo code has expired';
    RETURN;
  END IF;

  -- Check usage limit
  IF v_promo.usage_limit IS NOT NULL AND v_promo.usage_count >= v_promo.usage_limit THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'This promo code has reached its usage limit';
    RETURN;
  END IF;

  -- Check if user has already used this code
  SELECT COUNT(*) INTO v_user_usage_count
  FROM promo_code_usage
  WHERE promo_code_id = v_promo.id AND user_id = p_user_id;

  IF v_user_usage_count > 0 THEN
    RETURN QUERY SELECT false, NULL::uuid, 0, 'You have already used this promo code';
    RETURN;
  END IF;

  -- Code is valid
  RETURN QUERY SELECT true, v_promo.id, v_promo.discount_percentage, 'Promo code applied successfully'::text;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment usage count (called after successful order)
CREATE OR REPLACE FUNCTION increment_promo_usage(p_promo_code_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE promo_codes
  SET usage_count = usage_count + 1,
      updated_at = now()
  WHERE id = p_promo_code_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_promo_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_promo_codes_timestamp
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_promo_codes_updated_at();
