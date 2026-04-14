/*
  # Fix eBooks Public Access

  1. Changes
    - Add public SELECT policy for ebooks table to allow anonymous users to browse ebooks
    - This ensures the ebooks page works for non-logged-in users

  2. Security
    - Only SELECT (read) access is granted to public
    - All write operations still require authentication and admin privileges
*/

-- Drop the existing authenticated-only policy
DROP POLICY IF EXISTS "Anyone can view ebooks" ON ebooks;

-- Create new policy that allows both authenticated and anonymous users to view ebooks
CREATE POLICY "Public can view ebooks"
  ON ebooks
  FOR SELECT
  TO public
  USING (true);