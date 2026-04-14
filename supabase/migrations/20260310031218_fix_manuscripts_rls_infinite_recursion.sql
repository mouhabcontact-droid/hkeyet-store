/*
  # Fix Manuscripts RLS Infinite Recursion

  1. Changes
    - Drop the problematic INSERT policy that causes infinite recursion
    - Create a helper function to check for pending manuscripts
    - Create new INSERT policy using the helper function

  2. Security
    - Maintains the same security logic (users can only upload one manuscript at a time)
    - Avoids infinite recursion by using a SECURITY DEFINER function
*/

-- Drop the problematic policy
DROP POLICY IF EXISTS "Users can insert manuscript if no pending" ON public.manuscripts;

-- Create a helper function to check for pending manuscripts
CREATE OR REPLACE FUNCTION public.user_has_pending_manuscript(user_uuid uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.manuscripts
    WHERE user_id = user_uuid
    AND status IN ('not_reviewed', 'reviewing')
  );
END;
$$;

-- Create new INSERT policy without infinite recursion
CREATE POLICY "Users can insert manuscript if no pending"
  ON public.manuscripts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT public.user_has_pending_manuscript(auth.uid())
  );