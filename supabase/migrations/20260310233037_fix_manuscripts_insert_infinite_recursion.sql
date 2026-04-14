/*
  # Fix Manuscripts Insert Infinite Recursion
  
  1. Issue
    - The INSERT policy on manuscripts checks for pending manuscripts
    - This causes infinite recursion when trying to insert
    - The WITH CHECK clause queries the same table being inserted into
    
  2. Solution
    - Drop the existing recursive INSERT policy
    - Create a simpler INSERT policy that only checks ownership
    - Add a trigger-based validation for pending manuscripts check
    - This prevents the infinite recursion while maintaining data integrity
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can insert manuscript if no pending" ON manuscripts;

-- Create a simple INSERT policy without recursion
CREATE POLICY "Users can insert own manuscripts"
  ON manuscripts
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create a function to check for pending manuscripts
CREATE OR REPLACE FUNCTION check_pending_manuscripts()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user already has a pending manuscript
  IF EXISTS (
    SELECT 1 
    FROM manuscripts 
    WHERE user_id = NEW.user_id 
      AND status = 'pending' 
      AND id != NEW.id
  ) THEN
    RAISE EXCEPTION 'You already have a pending manuscript submission. Please wait for it to be reviewed.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists
DROP TRIGGER IF EXISTS check_pending_manuscripts_trigger ON manuscripts;

-- Create trigger to run before insert
CREATE TRIGGER check_pending_manuscripts_trigger
  BEFORE INSERT ON manuscripts
  FOR EACH ROW
  EXECUTE FUNCTION check_pending_manuscripts();
