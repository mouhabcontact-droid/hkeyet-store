/*
  # Add Public Access to Books Table

  1. Changes
    - Add public SELECT policy for books table so anyone can view books
    - This allows the homepage and books page to work for non-authenticated users

  2. Security
    - Only SELECT is allowed for public users
    - All other operations (INSERT, UPDATE, DELETE) remain restricted to admins
*/

-- Add public read access to books
CREATE POLICY "Anyone can view books"
  ON public.books
  FOR SELECT
  TO public
  USING (true);