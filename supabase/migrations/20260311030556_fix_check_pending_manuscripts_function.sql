/*
  # Fix check_pending_manuscripts Function

  1. Changes
    - Fix the check_pending_manuscripts function to use correct status values
    - Should check for 'not_reviewed' and 'reviewing' statuses instead of 'pending'
    - Prevents users from submitting multiple manuscripts while one is being reviewed

  2. Security
    - Maintains SECURITY DEFINER to allow checking other user manuscripts
    - Prevents spam submissions
*/

CREATE OR REPLACE FUNCTION check_pending_manuscripts()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Check if user already has a manuscript under review
  IF EXISTS (
    SELECT 1 
    FROM manuscripts 
    WHERE user_id = NEW.user_id 
    AND status IN ('not_reviewed', 'reviewing')
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    RAISE EXCEPTION 'You already have a manuscript under review. Please wait for it to be reviewed before submitting another.';
  END IF;

  RETURN NEW;
END;
$$;