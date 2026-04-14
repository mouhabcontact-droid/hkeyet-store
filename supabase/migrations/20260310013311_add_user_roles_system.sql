/*
  # Add User Roles System

  1. Changes
    - Add role column to profiles table
    - Create role enum type (admin, book_club, user)
    - Update existing admin users to have 'admin' role
    - Set default role to 'user' for new users
    - Add constraint to protect mouhab.contact@gmail.com from role changes

  2. Security
    - Only admins can change user roles
    - The master admin account cannot be demoted
*/

-- Create role enum type
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE user_role AS ENUM ('user', 'book_club', 'admin');
  END IF;
END $$;

-- Add role column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role user_role DEFAULT 'user';
  END IF;
END $$;

-- Update existing admin users to have 'admin' role
UPDATE profiles
SET role = 'admin'
WHERE is_admin = true;

-- Update non-admin users to have 'user' role
UPDATE profiles
SET role = 'user'
WHERE is_admin = false OR is_admin IS NULL;

-- Create function to sync is_admin with role
CREATE OR REPLACE FUNCTION sync_admin_role()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync is_admin with role
  NEW.is_admin = (NEW.role = 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to sync is_admin with role
DROP TRIGGER IF EXISTS sync_admin_role_trigger ON profiles;
CREATE TRIGGER sync_admin_role_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_role();

-- Create function to prevent master admin from being demoted
CREATE OR REPLACE FUNCTION protect_master_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Protect mouhab.contact@gmail.com from role changes by non-super admins
  IF OLD.email = 'mouhab.contact@gmail.com' THEN
    IF NEW.role != 'admin' THEN
      RAISE EXCEPTION 'Cannot change role of master admin account';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to protect master admin
DROP TRIGGER IF EXISTS protect_master_admin_trigger ON profiles;
CREATE TRIGGER protect_master_admin_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.email = 'mouhab.contact@gmail.com')
  EXECUTE FUNCTION protect_master_admin();

-- Create index on role for performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Update RLS policies to use role instead of is_admin

-- Drop old admin policies and create new ones
DROP POLICY IF EXISTS "Admins can view all promo codes" ON promo_codes;
CREATE POLICY "Admins can view all promo codes"
  ON promo_codes FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can create promo codes" ON promo_codes;
CREATE POLICY "Admins can create promo codes"
  ON promo_codes FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can update promo codes" ON promo_codes;
CREATE POLICY "Admins can update promo codes"
  ON promo_codes FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can delete promo codes" ON promo_codes;
CREATE POLICY "Admins can delete promo codes"
  ON promo_codes FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Admins can view all promo code usage" ON promo_code_usage;
CREATE POLICY "Admins can view all promo code usage"
  ON promo_code_usage FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
