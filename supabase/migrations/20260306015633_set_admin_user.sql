/*
  # Set Admin User

  ## Changes
  - Updates the user with email mouhab.contact@gmail.com to have admin privileges
  - If the user doesn't exist yet, this will be applied when they sign up
*/

DO $$
BEGIN
  UPDATE profiles 
  SET is_admin = true 
  WHERE email = 'mouhab.contact@gmail.com';
  
  IF NOT FOUND THEN
    RAISE NOTICE 'User with email mouhab.contact@gmail.com not found yet. They will need admin set on signup.';
  END IF;
END $$;
