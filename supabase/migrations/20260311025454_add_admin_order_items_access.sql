/*
  # Add Admin Access to Order Items

  1. Changes
    - Add admin SELECT policy for order_items table
    - Allows admins to view all order items when viewing order details

  2. Security
    - Only users with admin role can view all order items
    - Regular users can still only view their own order items
*/

-- Drop existing policy if it exists and create new one
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'order_items' 
    AND policyname = 'Admins can view all order items'
  ) THEN
    CREATE POLICY "Admins can view all order items"
      ON order_items
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles
          WHERE profiles.id = auth.uid()
          AND profiles.role = 'admin'::user_role
        )
      );
  END IF;
END $$;