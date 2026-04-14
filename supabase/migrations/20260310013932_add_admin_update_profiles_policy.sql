/*
  # Add Admin Update Profiles Policy

  1. Changes
    - Add RLS policy allowing admins to update any user's profile
    - This enables admins to change user roles in the admin panel

  2. Security
    - Only users with admin role can update other users' profiles
    - Regular users can still only update their own profiles
    - Master admin protection trigger still applies
*/

-- Allow admins to update any user's profile
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
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
