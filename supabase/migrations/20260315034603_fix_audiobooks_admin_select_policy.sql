/*
  # Fix Audiobooks Admin Select Policy

  1. Changes
    - Add policy for admins to select all audiobooks (published and unpublished)
    - This allows admins to view and edit all audiobooks in the admin panel
  
  2. Security
    - Policy restricted to authenticated users with admin role
    - Does not affect public access to published audiobooks
*/

-- Add policy for admins to select all audiobooks
CREATE POLICY "Admins can select all audiobooks"
  ON audiobooks
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );