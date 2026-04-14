/*
  # Add Public Access to Authors and Book Authors Tables

  1. Changes
    - Add public SELECT policy for authors table
    - Add public SELECT policy for book_authors table
    - This allows anyone to view book author information

  2. Security
    - Only SELECT is allowed for public users
    - All other operations remain restricted to admins
*/

-- Add public read access to authors
CREATE POLICY "Anyone can view authors"
  ON public.authors
  FOR SELECT
  TO public
  USING (true);

-- Add public read access to book_authors
CREATE POLICY "Anyone can view book authors"
  ON public.book_authors
  FOR SELECT
  TO public
  USING (true);