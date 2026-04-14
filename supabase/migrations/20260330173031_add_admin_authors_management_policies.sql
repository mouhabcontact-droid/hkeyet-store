/*
  # Add Admin Policies for Authors Management

  1. Security
    - Admins can insert, update, and delete authors
    - Public can view authors (for website display)
    - Authenticated users can view authors
*/

-- Allow admins to insert authors
CREATE POLICY "Admins can insert authors"
ON authors FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to update authors
CREATE POLICY "Admins can update authors"
ON authors FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);

-- Allow admins to delete authors
CREATE POLICY "Admins can delete authors"
ON authors FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.is_admin = true
  )
);
