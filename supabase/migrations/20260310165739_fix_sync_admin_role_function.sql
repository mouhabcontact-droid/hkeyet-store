/*
  # Fix sync_admin_role Function
  
  1. Issue
    - Function tries to set raw_app_meta_data on profiles table (doesn't exist)
    - raw_app_meta_data exists on auth.users table
    
  2. Solution
    - Update auth.users table when profile role changes
    - Remove incorrect reference to NEW.raw_app_meta_data on profiles
*/

-- Drop the incorrect function
DROP FUNCTION IF EXISTS public.sync_admin_role() CASCADE;

-- Recreate with correct logic to update auth.users
CREATE FUNCTION public.sync_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update the auth.users table with admin role metadata
  IF NEW.role = 'admin' THEN
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'::jsonb
    )
    WHERE id = NEW.id;
  ELSE
    UPDATE auth.users
    SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) - 'role'
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS sync_admin_role_trigger ON profiles;
CREATE TRIGGER sync_admin_role_trigger
  AFTER INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_role();
