/*
  # Add Admin Select Policy for Orders
  
  1. Issue
    - Admins cannot view orders in the admin panel
    - Only policy for SELECT allows users to see their own orders
    - No policy exists for admins to view all orders
    
  2. Solution
    - Add SELECT policy for admins to view all orders
    - Check admin status via profiles.role = 'admin'
*/

-- Add policy for admins to view all orders
CREATE POLICY "Admins can view all orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );
