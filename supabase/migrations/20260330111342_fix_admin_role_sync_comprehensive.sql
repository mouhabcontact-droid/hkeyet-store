/*
  # Fix Admin Role Sync Comprehensive
  
  1. Issue
    - When admin changes user role to 'admin' or 'book_club', the is_admin flag is not being synced
    - sync_admin_role function only updates auth.users metadata but not the is_admin flag in profiles
    - This causes RLS policies and admin checks to fail
    
  2. Solution
    - Update sync_admin_role to also sync the is_admin flag
    - Ensure is_admin = true when role = 'admin'
    - Ensure is_admin = false for other roles
    - Update existing profiles to sync is_admin with role
    
  3. Changes
    - Modified sync_admin_role trigger function to update is_admin flag
    - Added data migration to sync existing profiles
*/

-- Drop existing function
DROP FUNCTION IF EXISTS public.sync_admin_role() CASCADE;

-- Recreate function with is_admin sync
CREATE FUNCTION public.sync_admin_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Sync is_admin flag with role
  IF NEW.role = 'admin' THEN
    NEW.is_admin := true;
    
    -- Update auth.users with admin role metadata
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      '"admin"'::jsonb
    )
    WHERE id = NEW.id;
  ELSE
    NEW.is_admin := false;
    
    -- Update auth.users to remove admin role or set to book_club/user
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(NEW.role::text)
    )
    WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS sync_admin_role_trigger ON profiles;
CREATE TRIGGER sync_admin_role_trigger
  BEFORE INSERT OR UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_admin_role();

-- Sync existing profiles: update is_admin flag based on role
UPDATE profiles
SET is_admin = (role = 'admin')
WHERE (role = 'admin' AND is_admin = false) 
   OR (role != 'admin' AND is_admin = true);

-- Sync auth.users metadata for existing profiles
DO $$
DECLARE
  profile_record RECORD;
BEGIN
  FOR profile_record IN SELECT id, role FROM profiles LOOP
    UPDATE auth.users
    SET raw_app_meta_data = jsonb_set(
      COALESCE(raw_app_meta_data, '{}'::jsonb),
      '{role}',
      to_jsonb(profile_record.role::text)
    )
    WHERE id = profile_record.id;
  END LOOP;
END $$;
